import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const tables = [
  "profiles",
  "restaurants",
  "restaurant_aliases",
  "visits",
  "dishes",
  "photos",
  "place_candidates",
  "to_eat_items",
  "shared_restaurant_links",
];

function loadEnvFile(path) {
  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsAt = trimmed.indexOf("=");
    if (equalsAt === -1) continue;

    const key = trimmed.slice(0, equalsAt).trim();
    const value = trimmed.slice(equalsAt + 1).trim();
    process.env[key] ||= value.replace(/^['"]|['"]$/g, "");
  }
}

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

async function verifyTables(supabase) {
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      throw new Error(`Table check failed for ${table}: ${error.message}`);
    }

    console.log(`ok table ${table}`);
  }
}

async function verifyStorage(supabase) {
  const buckets = ["food-photos", "avatars"];

  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);

    if (error) {
      throw new Error(
        `Storage bucket check failed for ${bucket}: ${error.message}. Run supabase/storage.sql in the Supabase SQL editor.`,
      );
    }

    if (!data) {
      throw new Error(
        `Storage bucket check failed: ${bucket} was not found. Run supabase/storage.sql in the Supabase SQL editor.`,
      );
    }

    console.log(`ok storage bucket ${bucket}`);
  }
}

async function main() {
  loadEnvFile(resolve(".env.local"));
  assertEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  await verifyTables(supabase);
  await verifyStorage(supabase);
  console.log("Supabase initialization looks ready.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
