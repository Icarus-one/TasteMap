import { getOpenAIModel } from "@/lib/env";
import { analyzeToEatLinkSchema } from "@/lib/validators";
import {
  checkRateLimit,
  requireSecureRouteSession,
} from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";

const linkAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "restaurant_name",
    "city",
    "address",
    "cuisine_type",
    "note",
    "confidence",
    "missing_fields",
    "items",
  ],
  properties: {
    title: { type: "string" },
    restaurant_name: { type: "string" },
    city: { type: "string" },
    address: { type: "string" },
    cuisine_type: { type: "string" },
    note: { type: "string" },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low", "unknown"],
    },
    missing_fields: {
      type: "array",
      items: { type: "string" },
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "note"],
        properties: {
          title: { type: "string" },
          note: { type: "string" },
        },
      },
    },
  },
} as const;

export async function POST(request: Request) {
  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const rateLimitError = checkRateLimit({
    key: `analyze-to-eat-link:${session.user.id}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

  const json = await request.json().catch(() => null);
  const parsed = analyzeToEatLinkSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid link analysis input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sourceInput = parsed.data.source_input.trim();
  const sourceUrl = extractUrl(sourceInput);
  const sourcePlatform = detectPlatform(sourceInput || sourceUrl || "");
  const pageData = sourceUrl ? await getPageData(sourceUrl) : null;
  const pageContext = pageData?.context ?? null;
  const rawContext = [sourceInput, pageContext ?? ""].filter(Boolean).join("\n");

  if (!process.env.OPENAI_API_KEY) {
    const analysis = fallbackAnalysis(
        sourceUrl,
        pageData?.imageUrl ?? null,
        sourcePlatform,
        rawContext,
        pageContext,
        "OPENAI_API_KEY is not configured.",
      );
    await recordToEatLinkAnalysisEvent(session, analysis);
    return Response.json(analysis);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You are filling a private to-eat list from a food recommendation link.",
                "Return JSON matching the schema.",
                "Only use information supported by the pasted text or fetched page metadata.",
                "You are allowed to compose a practical working restaurant name from strong clues in the source when no explicit restaurant name is given.",
                "Example: if the source strongly suggests 新街口 + 牛肉火锅, a good working name is 新街口牛肉火锅.",
                "If a city is implied by tags or place clues such as 南京旅游攻略新街口, infer city as 南京 and area/address clue as 新街口.",
                "City should be filled when the source explicitly mentions it or when a strong tag/place clue makes it clear.",
                "Address can use neighborhood, street, mall, or area clues if present. If not present, leave it empty.",
                "Extract every clearly mentioned dish, drink, dessert, or recommended food into items.",
                "Items must represent dishes only, not whole sentences, not generic commentary, and not restaurant-prefixed phrases.",
                "Good item titles: 吊龙, 鲜切牛肉, 虾滑, 牛肉火锅, 冬阴功汤.",
                "Bad item titles: 新街口牛肉火锅·第一次看牛肉, 在新街口吃到特别特别好吃的牛肉火锅, 人流很可怕.",
                "If the post mentions a set menu or one obvious signature dish only, create one item for that dish.",
                "If no individual dishes are clearly mentioned, create one fallback item based on the main food recommendation only.",
                "The note must be a short paraphrased summary in your own words.",
                "Do not copy long spans of the source text. Do not dump raw metadata. Summarize what the post seems to recommend, any standout dish, queue, vibe, or caution if supported.",
                `Source platform: ${sourcePlatform}.`,
                `Pasted input: ${truncate(sourceInput, 2500)}`,
                pageContext
                  ? `Fetched page context:\n${truncate(pageContext, 5000)}`
                  : "Fetched page context: unavailable.",
              ].join("\n\n"),
            },
          ],
        },
      ],
      max_output_tokens: 700,
      text: {
        format: {
          type: "json_schema",
          name: "to_eat_link_analysis",
          strict: true,
          schema: linkAnalysisSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    const analysis = fallbackAnalysis(
        sourceUrl,
        pageData?.imageUrl ?? null,
        sourcePlatform,
        rawContext,
        pageContext,
        message || "OpenAI link analysis failed.",
      );
    await recordToEatLinkAnalysisEvent(session, analysis);
    return Response.json(analysis, { status: 200 });
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  const analysis = parseModelJson(text);

  if (!analysis) {
    const fallback = fallbackAnalysis(
        sourceUrl,
        pageData?.imageUrl ?? null,
        sourcePlatform,
        rawContext,
        pageContext,
        "AI response was not valid JSON.",
      );
    await recordToEatLinkAnalysisEvent(session, fallback);
    return Response.json(fallback);
  }

  const enriched = enrichAnalysis(analysis, rawContext);
  const responsePayload = {
    sourceUrl,
    sourceImageUrl: pageData?.imageUrl ?? null,
    sourcePlatform,
    ...enriched,
  };

  await recordToEatLinkAnalysisEvent(session, responsePayload);
  return Response.json(responsePayload);
}

async function recordToEatLinkAnalysisEvent(
  session: Extract<
    Awaited<ReturnType<typeof requireSecureRouteSession>>,
    { ok: true }
  >,
  analysis: Record<string, unknown>,
) {
  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "to_eat_link_analyzed",
    metadata: {
      source_platform:
        typeof analysis.sourcePlatform === "string"
          ? analysis.sourcePlatform
          : "unknown",
      has_source_url: Boolean(analysis.sourceUrl),
      has_restaurant_name: Boolean(analysis.restaurantName),
      item_count: Array.isArray(analysis.items) ? analysis.items.length : 0,
      confidence:
        typeof analysis.confidence === "string" ? analysis.confidence : "unknown",
      used_fallback: Boolean(analysis.error),
    },
  });
}

async function getPageData(sourceUrl: string) {
  try {
    if (!isAllowedFetchUrl(sourceUrl)) return null;

    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const ogTitle = extractMetaContent(html, "property", "og:title");
    const description = extractMetaContent(html, "name", "description");
    const ogDescription = extractMetaContent(html, "property", "og:description");
    const keywords = extractMetaContent(html, "name", "keywords");
    const ogImage = extractMetaContent(html, "property", "og:image");
    const twitterImage = extractMetaContent(html, "name", "twitter:image");

    return {
      context: [
      title ? `title: ${title}` : "",
      ogTitle ? `og:title: ${ogTitle}` : "",
      description ? `description: ${description}` : "",
      ogDescription ? `og:description: ${ogDescription}` : "",
      keywords ? `keywords: ${keywords}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
      imageUrl: ogImage || twitterImage || null,
    };
  } catch {
    return null;
  }
}

function isAllowedFetchUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
      const parts = hostname.split(".").map(Number);
      if (parts.some((part) => part < 0 || part > 255)) return false;
      if (parts[0] === 10) return false;
      if (parts[0] === 127) return false;
      if (parts[0] === 169 && parts[1] === 254) return false;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
      if (parts[0] === 192 && parts[1] === 168) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function fallbackAnalysis(
  sourceUrl: string | null,
  sourceImageUrl: string | null,
  sourcePlatform: string,
  rawContext: string,
  pageContext: string | null,
  error: string,
) {
  const derivedTitle = deriveTitleFromContext(sourcePlatform, pageContext, sourceUrl);
  const rawText = [rawContext, sourceUrl ?? "", pageContext ?? ""].join("\n");
  const restaurantName = deriveRestaurantName(rawText);
  const location = inferLocation(rawText);
  const address = location.area || deriveAddress(rawText);
  const cuisineType = deriveCuisineType(rawText);
  const items = deriveItems(rawText, restaurantName);
  const note = summarizeSourceText(rawText, {
    restaurantName,
    city: location.city,
    area: address,
    cuisineType,
    items,
  });
  const missingFields = [
    restaurantName ? "" : "restaurant_name",
    location.city ? "" : "city",
    cuisineType ? "" : "cuisine_type",
  ].filter(Boolean);

  return {
    sourceUrl,
    sourceImageUrl,
    sourcePlatform,
    title: derivedTitle,
    restaurant_name: restaurantName,
    city: location.city,
    address,
    cuisine_type: cuisineType,
    note,
    confidence: "low",
    missing_fields: missingFields,
    items,
    error,
  };
}

function parseModelJson(text: string) {
  try {
    return normalizeAnalysis(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return normalizeAnalysis(JSON.parse(match[0]));
    } catch {
      return null;
    }
  }
}

function normalizeAnalysis(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const missingFields = Array.isArray(record.missing_fields)
    ? record.missing_fields.map(toStringValue).filter(Boolean)
    : [];
  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => normalizeItem(item))
        .filter((item): item is { title: string; note: string | null } => Boolean(item))
    : [];

  return {
    title: toStringValue(record.title) || "Saved food recommendation",
    restaurant_name: toStringValue(record.restaurant_name),
    city: toStringValue(record.city),
    address: toStringValue(record.address),
    cuisine_type: toStringValue(record.cuisine_type),
    note: toStringValue(record.note),
    confidence: normalizeEnum(
      record.confidence,
      ["high", "medium", "low", "unknown"],
      "unknown",
    ),
    missing_fields: missingFields,
    items,
  };
}

function enrichAnalysis(
  analysis: {
    title: string;
    restaurant_name: string;
    city: string;
    address: string;
    cuisine_type: string;
    note: string;
    confidence: "high" | "medium" | "low" | "unknown";
    missing_fields: string[];
    items: Array<{ title: string; note: string | null }>;
  },
  rawContext: string,
) {
  const location = inferLocation(rawContext);
  const city = analysis.city || location.city;
  const address = analysis.address || location.area || deriveAddress(rawContext);
  const cuisineType = analysis.cuisine_type || deriveCuisineType(rawContext);
  const restaurantName =
    analysis.restaurant_name ||
    deriveRestaurantName([rawContext, city, address, cuisineType].filter(Boolean).join(" "));
  const items =
    analysis.items.length > 0 ? analysis.items : deriveItems(rawContext, restaurantName);
  const note = summarizeNote(analysis.note, rawContext, {
    restaurantName,
    city,
    area: address,
    cuisineType,
    items,
  });
  const missingFields = Array.from(
    new Set(
      [
        restaurantName ? "" : "restaurant_name",
        city ? "" : "city",
        cuisineType ? "" : "cuisine_type",
        ...analysis.missing_fields,
      ].filter(Boolean),
    ),
  );

  return {
    ...analysis,
    restaurant_name: restaurantName,
    city,
    address,
    cuisine_type: cuisineType,
    note,
    missing_fields: missingFields,
  };
}

function normalizeItem(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = toStringValue(record.title);
  const note = toStringValue(record.note);
  if (!title) return null;
  return {
    title,
    note: note || null,
  };
}

function extractOutputText(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "output_text" in payload &&
    typeof payload.output_text === "string"
  ) {
    return payload.output_text;
  }

  const output =
    payload && typeof payload === "object" && "output" in payload
      ? payload.output
      : null;

  if (!Array.isArray(output)) return "";

  const chunks: string[] = [];
  output.forEach((item) => {
    if (!item || typeof item !== "object" || !("content" in item)) return;
    const content = item.content;
    if (!Array.isArray(content)) return;
    content.forEach((part) => {
      if (!part || typeof part !== "object") return;
      if ("text" in part && typeof part.text === "string") {
        chunks.push(part.text);
      }
    });
  });

  return chunks.join("");
}

function extractTagContent(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return normalizeHtmlText(match?.[1] ?? "");
}

function extractMetaContent(html: string, attr: "name" | "property", key: string) {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${escapeRegex(key)}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapeRegex(key)}["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern) ?? html.match(reversePattern);
  return normalizeHtmlText(match?.[1] ?? "");
}

function normalizeHtmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function detectPlatform(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) {
    return "xiaohongshu";
  }
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) {
    return "douyin";
  }
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.startsWith("http")) return "web";
  return "manual";
}

function extractUrl(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/i);
  return match?.[0]?.replace(/[，。),\]]+$/g, "") ?? null;
}

function deriveTitleFromContext(
  sourcePlatform: string,
  pageContext: string | null,
  sourceUrl: string | null,
) {
  const titleLine = pageContext
    ?.split("\n")
    .find((line) => line.startsWith("og:title:") || line.startsWith("title:"));
  const title = titleLine?.split(":").slice(1).join(":").trim();
  if (title) return title;
  if (sourceUrl) return `${platformLabel(sourcePlatform)} recommendation`;
  return "Saved food recommendation";
}

function deriveRestaurantName(text: string) {
  const normalized = sanitizeSourceText(text);
  const location = inferLocation(normalized);
  const areaMatch = normalized.match(/在?([\u4e00-\u9fa5A-Za-z0-9]{2,10})(?:吃到|吃了|找到|发现|排队|打卡)/);
  const dishKeyword = extractDishKeyword(normalized);
  if (location.area && dishKeyword) {
    return `${location.area}${dishKeyword}`;
  }
  if (areaMatch && dishKeyword) {
    return `${areaMatch[1]}${dishKeyword}`;
  }

  const explicitMatch = normalized.match(/(?:店名|餐厅|火锅店|烧烤店|面馆|餐馆)[：:\s]*([\u4e00-\u9fa5A-Za-z0-9·\-]{2,20})/);
  if (explicitMatch) return explicitMatch[1];

  if (dishKeyword) return dishKeyword;
  return "";
}

function deriveAddress(text: string) {
  const normalized = sanitizeSourceText(text);
  const location = inferLocation(normalized);
  if (location.area) return location.area;
  const areaMatch = normalized.match(/在?([\u4e00-\u9fa5A-Za-z0-9]{2,14})(?:吃到|吃了|找到|发现|排队|打卡)/);
  if (areaMatch) return areaMatch[1];

  const locationMatch = normalized.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,14}(?:路|街|巷|广场|商场|天地|中心|城))/);
  return locationMatch?.[1] ?? "";
}

function deriveCuisineType(text: string) {
  const keyword = extractDishKeyword(text);
  if (!keyword) return "";
  if (keyword.includes("火锅")) return "Hotpot";
  if (keyword.includes("拉面") || keyword.includes("寿司")) return "Japanese";
  if (keyword.includes("披萨") || keyword.includes("意面")) return "Italian";
  if (keyword.includes("咖喱") || keyword.includes("冬阴功")) return "Thai";
  if (keyword.includes("烧烤")) return "BBQ";
  return keyword;
}

function deriveItems(text: string, restaurantName: string) {
  const normalized = sanitizeSourceText(text);
  const candidates = Array.from(new Set(extractDishCandidates(normalized))).slice(0, 10);

  if (candidates.length > 0) {
    return candidates.map((candidate) => ({
      title: candidate,
      note: `Mentioned in the recommendation source${restaurantName ? ` for ${restaurantName}` : ""}.`,
    }));
  }

  const fallbackTitle = extractDishKeyword(normalized) || restaurantName || "Saved food lead";
  return [
    {
      title: fallbackTitle,
      note: "Main recommendation captured from the source.",
    },
  ];
}

function extractDishCandidates(text: string) {
  const directMatches = Array.from(
    text.matchAll(
      /(吊龙|毛肚|肥牛|鲜切牛肉|牛肉丸|虾滑|鸭血|黄喉|千层肚|牛肉火锅|火锅|烤肉|烧烤|拉面|寿司|手卷|披萨|意面|咖喱|冬阴功汤|冬阴功|糯米饭|糍粑|冰粉|奶茶|甜品|蛋糕|汉堡|薯条|炒饭|炒面|小笼包|生煎|米线|螺蛳粉|炸鸡|可颂|提拉米苏|布丁|鸡尾酒)/g,
    ),
  ).map((match) => normalizeDishName(match[1]));

  const segmentedMatches = text
    .split(/[，、,\n。；;！!？?]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(extractDishSegment)
    .filter((value): value is string => Boolean(value));

  return [...directMatches, ...segmentedMatches]
    .map(normalizeDishName)
    .filter(Boolean)
    .filter((item) => !isJunkDish(item));
}

function extractDishKeyword(text: string) {
  const match = text.match(
    /(牛肉火锅|火锅|烤肉|烧烤|拉面|寿司|披萨|意面|咖喱|冬阴功汤|冬阴功|汉堡|米线|甜品|奶茶)/,
  );
  return match?.[1] ?? "";
}

function extractDishSegment(part: string) {
  const cleaned = part
    .replace(/^(还有|以及|推荐|必点|点了|吃了|他们家|这家|这个|那个)/, "")
    .replace(/(真的|特别|尤其|非常|超级|很|太|第一次|看到|觉得|好吃|难吃|推荐|绝了|不错)/g, "")
    .trim();

  const match = cleaned.match(
    /([\u4e00-\u9fa5A-Za-z0-9]{1,12}(?:吊龙|毛肚|肥牛|鲜切牛肉|牛肉丸|虾滑|鸭血|黄喉|千层肚|牛肉火锅|火锅|烤肉|烧烤|拉面|寿司|手卷|披萨|意面|咖喱|冬阴功汤|冬阴功|糯米饭|糍粑|冰粉|奶茶|甜品|蛋糕|汉堡|薯条|炒饭|炒面|小笼包|生煎|米线|螺蛳粉|炸鸡|可颂|提拉米苏|布丁|鸡尾酒))/,
  );
  return match?.[1] ?? "";
}

function normalizeDishName(value: string) {
  return value
    .replace(/^[·•\-\s]+/, "")
    .replace(/[·•\-\s]+$/g, "")
    .replace(/^(这家|他们家|推荐|必点)/, "")
    .trim();
}

function isJunkDish(value: string) {
  return /第一次|新街口|好吃|人流|排队|店里|帖子|推荐源/.test(value);
}

function sanitizeSourceText(value: string) {
  return value
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/Copy and open rednote.*$/gi, " ")
    .replace(/og:title:|og:description:|title:|description:|keywords:/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferLocation(text: string) {
  const normalized = sanitizeSourceText(text);
  const city = inferCity(normalized);
  const area = inferArea(normalized, city);
  return { city, area };
}

function inferCity(text: string) {
  const cities = [
    "北京",
    "上海",
    "广州",
    "深圳",
    "南京",
    "杭州",
    "成都",
    "重庆",
    "武汉",
    "西安",
    "苏州",
    "长沙",
    "天津",
    "青岛",
    "厦门",
    "福州",
    "昆明",
    "大连",
    "郑州",
    "宁波",
  ];

  for (const city of cities) {
    if (text.includes(city)) return city;
    if (text.includes(`${city}旅游攻略`)) return city;
    if (text.includes(`${city}美食`)) return city;
  }

  const match = text.match(/([\u4e00-\u9fa5]{2,4})(?:旅游攻略|美食攻略|探店攻略)/);
  return match?.[1] ?? "";
}

function inferArea(text: string, city: string) {
  const knownAreas = [
    "新街口",
    "国贸",
    "三里屯",
    "太古里",
    "观音桥",
    "春熙路",
    "五一广场",
    "徐家汇",
    "静安寺",
    "陆家嘴",
    "夫子庙",
    "老门东",
    "珠江新城",
    "天河城",
    "洪崖洞",
  ];

  for (const area of knownAreas) {
    if (text.includes(area)) return area;
    if (city && text.includes(`${city}${area}`)) return area;
  }

  const genericMatch = text.match(
    /([\u4e00-\u9fa5A-Za-z0-9]{2,12}(?:路|街口|街|巷|商场|广场|天地|中心|城|里))/,
  );
  return genericMatch?.[1] ?? "";
}

function summarizeNote(
  note: string,
  rawContext: string,
  details: {
    restaurantName: string;
    city: string;
    area: string;
    cuisineType: string;
    items: Array<{ title: string; note: string | null }>;
  },
) {
  const cleaned = cleanCopiedSummary(note);
  if (cleaned) {
    return cleaned;
  }

  return summarizeSourceText(rawContext, details);
}

function cleanCopiedSummary(note: string) {
  const cleaned = note
    .replace(/^(Saved from|Summary from available page metadata:)/gi, "")
    .replace(/title:\s*/gi, "")
    .replace(/description:\s*/gi, "")
    .replace(/og:title:\s*/gi, "")
    .replace(/og:description:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  if (cleaned.length > 240) return "";
  if (/https?:\/\//i.test(cleaned)) return "";
  return cleaned;
}

function summarizeSourceText(
  rawContext: string,
  details: {
    restaurantName: string;
    city: string;
    area: string;
    cuisineType: string;
    items: Array<{ title: string; note: string | null }>;
  },
) {
  const parts: string[] = [];
  const location = [details.city, details.area].filter(Boolean).join("");
  const dishPreview = details.items
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 3)
    .join("、");
  const hasQueueSignal = /(排队|人流|等位|爆满|很多人)/.test(rawContext);
  const hasStrongRecSignal = /(推荐|必点|值得|回头吃|好吃|香|绝)/.test(rawContext);

  if (details.restaurantName) {
    parts.push(
      `${location ? `${location}的` : ""}${details.restaurantName}${
        details.cuisineType ? `更像一条${details.cuisineType}推荐` : "是一条值得留意的餐厅线索"
      }。`,
    );
  } else if (details.cuisineType) {
    parts.push(
      `${location ? `${location}的` : ""}内容主要在推荐${details.cuisineType}相关吃法。`,
    );
  }

  if (dishPreview) {
    parts.push(`帖子重点提到了 ${dishPreview}。`);
  }

  if (hasQueueSignal) {
    parts.push("看起来人气不低，可能需要排队。");
  } else if (hasStrongRecSignal) {
    parts.push("整体语气偏强推荐。");
  }

  return parts.join(" ").trim() || "这条内容给出了一些可继续追踪的餐厅和菜品线索。";
}

function platformLabel(platform: string) {
  if (platform === "xiaohongshu") return "Xiaohongshu";
  if (platform === "douyin") return "Douyin";
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  if (platform === "web") return "Web";
  return "source";
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
