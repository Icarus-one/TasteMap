import { jsonError } from "@/server/http";
import { requireRouteSession } from "@/server/routeContext";

type RateLimitState = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitState>();

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowedOrigins = new Set([new URL(request.url).origin]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    try {
      allowedOrigins.add(new URL(appUrl).origin);
    } catch {
      // Ignore malformed deployment URLs so request-origin checks still work.
    }
  }

  if (!allowedOrigins.has(origin)) {
    return jsonError("Cross-origin request blocked.", 403);
  }

  return null;
}

export async function requireSecureRouteSession(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) {
    return {
      ok: false as const,
      response: originError,
    };
  }

  return requireRouteSession();
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (current.count >= limit) {
    return jsonError("Too many requests. Please try again later.", 429, {
      retry_after_seconds: Math.ceil((current.resetAt - now) / 1000),
    });
  }

  current.count += 1;
  return null;
}
