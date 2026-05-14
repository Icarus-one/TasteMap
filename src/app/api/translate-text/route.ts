import { getOpenAIModel } from "@/lib/env";
import { translateTextSchema } from "@/lib/validators";
import { jsonError } from "@/server/http";
import {
  checkRateLimit,
  requireSecureRouteSession,
} from "@/server/security";

const languageNames = {
  en: "English",
  zh: "Chinese",
  fr: "French",
} as const;

const translationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["translated_text"],
  properties: {
    translated_text: { type: "string" },
  },
} as const;

export async function POST(request: Request) {
  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const rateLimitError = checkRateLimit({
    key: `translate-text:${session.user.id}`,
    limit: 80,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

  const json = await request.json().catch(() => null);
  const parsed = translateTextSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid translation input.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  const { text, source_language: sourceLanguage, target_language: targetLanguage } =
    parsed.data;

  if (sourceLanguage === targetLanguage) {
    return Response.json({ translated_text: "" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonError("OpenAI API key is not configured.", 503);
  }

  const timeoutSignal = AbortSignal.timeout(8000);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: timeoutSignal,
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
                "Translate the user's saved TasteMap content into the target language.",
                "Return JSON matching the schema.",
                "Keep proper nouns, restaurant names, brands, and addresses recognizable.",
                "Translate dish names, notes, tags, and short descriptions naturally.",
                "If the text is already in the target language or cannot be meaningfully translated, return an empty string.",
                `Detected source language: ${sourceLanguage}.`,
                `Target language: ${languageNames[targetLanguage]}.`,
                `Text:\n${text}`,
              ].join("\n\n"),
            },
          ],
        },
      ],
      max_output_tokens: 260,
      text: {
        format: {
          type: "json_schema",
          name: "taste_map_translation",
          strict: true,
          schema: translationSchema,
        },
      },
    }),
  }).catch(() => null);

  if (!response) {
    return jsonError("Translation timed out.", 504);
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    return jsonError(message || "Translation failed.", 502);
  }

  const payload = await response.json();
  const translatedText = parseTranslatedText(extractOutputText(payload));

  return Response.json({ translated_text: translatedText });
}

function parseTranslatedText(text: string) {
  try {
    const parsed = JSON.parse(text) as { translated_text?: unknown };
    return typeof parsed.translated_text === "string"
      ? parsed.translated_text.trim()
      : "";
  } catch {
    return "";
  }
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
