import { supabase } from "@/lib/supabase";
import type { Gender, OutfitStyle, ProfileInput, ProfileRow } from "@/lib/types/profile";
import { OUTFIT_STYLE_OPTIONS } from "@/lib/types/profile";

const VALID_GENDERS = new Set<string>(
  ["female", "male", "non_binary", "prefer_not_to_say"] as Gender[]
);

const VALID_OUTFIT_STYLES = new Set<string>(
  OUTFIT_STYLE_OPTIONS.map((o) => o.value)
);

function parseGender(value: unknown): Gender | null {
  if (typeof value !== "string" || !VALID_GENDERS.has(value)) {
    return null;
  }
  return value as Gender;
}

function parseOutfitPreferences(value: unknown): OutfitStyle[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<OutfitStyle>();
  for (const item of value) {
    if (typeof item === "string" && VALID_OUTFIT_STYLES.has(item)) {
      unique.add(item as OutfitStyle);
    }
  }
  return [...unique];
}

function mapProfileRow(row: {
  user_id: string;
  gender: string | null;
  outfit_preferences: string[] | null;
  created_at: string;
  updated_at: string;
}): ProfileRow {
  return {
    user_id: row.user_id,
    gender: parseGender(row.gender),
    outfit_preferences: parseOutfitPreferences(row.outfit_preferences),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchProfileForUser(
  userId: string
): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, gender, outfit_preferences, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return { data: mapProfileRow(data), error: null };
}

export async function upsertProfileForUser(
  userId: string,
  input: ProfileInput
): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        gender: input.gender,
        outfit_preferences: input.outfitPreferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id, gender, outfit_preferences, created_at, updated_at")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: mapProfileRow(data), error: null };
}

export function buildTravelerProfile(input: {
  notes?: string | null;
  gender?: Gender | null;
  outfitPreferences?: OutfitStyle[];
}): Record<string, unknown> | undefined {
  const profile: Record<string, unknown> = {};

  const notes = input.notes?.trim();
  if (notes) {
    profile.notes = notes;
  }

  if (input.gender) {
    profile.gender = input.gender;
  }

  const styles = input.outfitPreferences?.filter(Boolean) ?? [];
  if (styles.length > 0) {
    profile.outfitStyles = styles;
  }

  return Object.keys(profile).length > 0 ? profile : undefined;
}
