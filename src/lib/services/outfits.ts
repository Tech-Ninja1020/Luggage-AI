import { buildTravelerProfile, fetchProfileForUser } from "@/lib/services/profile";
import { supabase } from "@/lib/supabase";
import type {
  TravelOutfitGroup,
  TravelOutfitPlan,
  TravelOutfitsRequest,
  TravelOutfitsResponse,
} from "@/lib/types/outfits";
import type { Gender, OutfitStyle } from "@/lib/types/profile";

const TRAVEL_OUTFITS_FUNCTION = "travel-outfits";
const DEFAULT_OCCASIONS = ["Travel"];

export async function fetchTravelOutfits(
  input: TravelOutfitsRequest
): Promise<{ data: TravelOutfitPlan | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke<TravelOutfitsResponse>(
    TRAVEL_OUTFITS_FUNCTION,
    { body: input }
  );

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (data?.error) {
    return { data: null, error: new Error(data.error) };
  }

  const outfits = data?.data?.outfits;
  if (!outfits?.length) {
    return {
      data: null,
      error: new Error("Outfit recommendations were empty."),
    };
  }

  return { data: { outfits }, error: null };
}

export async function saveOutfitPlanToPackingList(
  packingListId: string,
  outfits: TravelOutfitGroup[]
): Promise<{ error: Error | null }> {
  for (let occasionIndex = 0; occasionIndex < outfits.length; occasionIndex++) {
    const outfit = outfits[occasionIndex];
    const occasion = outfit.occasion.trim() || `Occasion ${occasionIndex + 1}`;

    const { data: category, error: categoryError } = await supabase
      .from("packing_categories")
      .insert({
        packing_list_id: packingListId,
        name: occasion,
        sort_order: occasionIndex,
        is_custom: false,
      })
      .select("id")
      .single();

    if (categoryError || !category) {
      return {
        error: new Error(
          categoryError?.message ?? `Could not save outfit category "${occasion}".`
        ),
      };
    }

    const items = outfit.items.filter((item) => item.name.trim());
    if (items.length === 0) {
      continue;
    }

    const { error: itemsError } = await supabase.from("packing_items").insert(
      items.map((item, itemIndex) => ({
        packing_category_id: category.id,
        name: item.name.trim(),
        quantity: Math.max(1, Math.floor(item.quantity)),
        notes: null,
        is_packed: false,
        is_custom: false,
        sort_order: itemIndex,
      }))
    );

    if (itemsError) {
      return { error: new Error(itemsError.message) };
    }
  }

  return { error: null };
}

export async function fetchActivityNamesByIds(
  activityIds: string[]
): Promise<{ data: string[]; error: Error | null }> {
  if (activityIds.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("activity_options")
    .select("name")
    .in("id", activityIds);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const names = (data ?? [])
    .map((row) => row.name.trim())
    .filter((name) => name.length > 0);

  return { data: names, error: null };
}

export function resolveTripDatesForOutfits(
  startDate: string | null,
  endDate: string | null
): { startDate: string; endDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  const start = startDate?.trim() || today;
  const end = endDate?.trim() || start;
  return start <= end ? { startDate: start, endDate: end } : { startDate: end, endDate: start };
}

export function occasionsFromActivityNames(names: string[]): string[] {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  return unique.length > 0 ? unique : DEFAULT_OCCASIONS;
}

export async function generateAndSaveOutfitsForTrip(input: {
  userId?: string;
  packingListId: string;
  destinationLabel: string;
  startDate: string | null;
  endDate: string | null;
  activityIds: string[];
  notes?: string | null;
}): Promise<{ error: Error | null }> {
  const destination = input.destinationLabel.trim();
  if (!destination) {
    return { error: null };
  }

  const { data: activityNames, error: namesError } = await fetchActivityNamesByIds(
    input.activityIds
  );
  if (namesError) {
    return { error: namesError };
  }

  const { startDate, endDate } = resolveTripDatesForOutfits(
    input.startDate,
    input.endDate
  );
  const occasions = occasionsFromActivityNames(activityNames);

  let gender: Gender | null = null;
  let outfitPreferences: OutfitStyle[] = [];
  if (input.userId) {
    const { data: profile } = await fetchProfileForUser(input.userId);
    gender = profile?.gender ?? null;
    outfitPreferences = profile?.outfit_preferences ?? [];
  }

  const travelerProfile = buildTravelerProfile({
    notes: input.notes,
    gender,
    outfitPreferences,
  });

  const { data: plan, error: fetchError } = await fetchTravelOutfits({
    destination,
    startDate,
    endDate,
    occasions,
    travelerProfile,
    weatherSummary: null,
  });

  if (fetchError || !plan) {
    return { error: fetchError };
  }

  return saveOutfitPlanToPackingList(input.packingListId, plan.outfits);
}
