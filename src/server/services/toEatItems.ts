import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import {
  createToEatItemSchema,
  updateToEatItemSchema,
} from "@/lib/validators";

export type CreateToEatItemInput = z.infer<typeof createToEatItemSchema>;
export type UpdateToEatItemInput = z.infer<typeof updateToEatItemSchema>;
type ShareSourceAttribution = {
  source_sharer_user_id: string;
  source_restaurant_id: string;
};

export async function createToEatItem({
  supabase,
  userId,
  input,
  shareSourceAttribution = null,
}: {
  supabase: SupabaseClient;
  userId: string;
  input: CreateToEatItemInput;
  shareSourceAttribution?: ShareSourceAttribution | null;
}) {
  const { data, error } = await supabase
    .from("to_eat_items")
    .insert({
      user_id: userId,
      ...input,
      source_sharer_user_id:
        shareSourceAttribution?.source_sharer_user_id ?? null,
      source_restaurant_id:
        shareSourceAttribution?.source_restaurant_id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message, status: 500 as const };
  }

  return { item: data };
}

export async function updateToEatItem({
  supabase,
  userId,
  input,
}: {
  supabase: SupabaseClient;
  userId: string;
  input: UpdateToEatItemInput;
}) {
  const { id, ...patch } = input;
  const { data, error } = await supabase
    .from("to_eat_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message, status: 500 as const };
  }

  return { item: data };
}

export async function deleteToEatItem({
  supabase,
  userId,
  id,
}: {
  supabase: SupabaseClient;
  userId: string;
  id: string;
}) {
  const { error } = await supabase
    .from("to_eat_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message, status: 500 as const };
  }

  return { ok: true as const };
}
