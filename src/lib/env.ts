export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasSupabasePublicEnv() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(url && anonKey);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

