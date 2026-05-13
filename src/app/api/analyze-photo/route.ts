import { analyzePhotoInputSchema } from "@/lib/validators";
import { getOpenAIModel } from "@/lib/env";

const confidenceValues = ["high", "medium", "low", "unknown"] as const;

const foodPhotoAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "photo_type",
    "detected_dishes",
    "suggested_tags",
    "summary_guess",
    "confidence",
  ],
  properties: {
    photo_type: {
      type: "string",
      enum: ["dish", "menu", "restaurant", "receipt", "unknown"],
    },
    detected_dishes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name_guess",
          "cuisine_guess",
          "category",
          "visible_ingredients",
          "confidence",
        ],
        properties: {
          name_guess: { type: "string" },
          cuisine_guess: { type: "string" },
          category: { type: "string" },
          visible_ingredients: {
            type: "array",
            items: { type: "string" },
          },
          confidence: {
            type: "string",
            enum: confidenceValues,
          },
        },
      },
    },
    suggested_tags: {
      type: "array",
      items: { type: "string" },
    },
    summary_guess: { type: "string" },
    confidence: {
      type: "string",
      enum: confidenceValues,
    },
  },
} as const;

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = analyzePhotoInputSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid photo analysis input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const imageUrl = parsed.data.photo_url ?? parsed.data.photo_base64;
  if (!imageUrl) {
    return Response.json(
      { error: "photo_url or photo_base64 is required" },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(fallbackAnalysis("OPENAI_API_KEY is not configured."));
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
                "Analyze this meal photo for TasteMap.",
                "Return JSON matching the schema.",
                "Treat results as suggestions for a user to confirm.",
                "If no dish is reliable, return an empty detected_dishes array.",
              ].join(" "),
            },
            {
              type: "input_image",
              image_url: imageUrl,
            },
          ],
        },
      ],
      max_output_tokens: 900,
      text: {
        format: {
          type: "json_schema",
          name: "food_photo_analysis",
          strict: true,
          schema: foodPhotoAnalysisSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    return Response.json(
      fallbackAnalysis(message || "OpenAI photo analysis failed."),
      { status: 200 },
    );
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  const analysis = parseModelJson(text);

  if (!analysis) {
    return Response.json(fallbackAnalysis("AI response was not valid JSON."));
  }

  return Response.json(analysis);
}

function fallbackAnalysis(error: string) {
  return {
    photo_type: "unknown",
    detected_dishes: [],
    suggested_tags: [],
    summary_guess: "",
    confidence: "unknown",
    error,
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

  const output = payload && typeof payload === "object" && "output" in payload
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
  const detected = Array.isArray(record.detected_dishes)
    ? record.detected_dishes
    : [];

  return {
    photo_type: normalizeEnum(
      record.photo_type,
      ["dish", "menu", "restaurant", "receipt", "unknown"],
      "unknown",
    ),
    detected_dishes: detected
      .filter((dish): dish is Record<string, unknown> => Boolean(dish))
      .map((dish) => ({
        name_guess: toStringValue(dish.name_guess),
        cuisine_guess: toStringValue(dish.cuisine_guess),
        category: toStringValue(dish.category),
        visible_ingredients: Array.isArray(dish.visible_ingredients)
          ? dish.visible_ingredients.map(toStringValue).filter(Boolean)
          : [],
        confidence: normalizeEnum(
          dish.confidence,
          ["high", "medium", "low", "unknown"],
          "unknown",
        ),
      }))
      .filter((dish) => dish.name_guess),
    suggested_tags: Array.isArray(record.suggested_tags)
      ? record.suggested_tags.map(toStringValue).filter(Boolean)
      : [],
    summary_guess: toStringValue(record.summary_guess),
    confidence: normalizeEnum(
      record.confidence,
      ["high", "medium", "low", "unknown"],
      "unknown",
    ),
  };
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
