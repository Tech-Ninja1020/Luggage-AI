import { generateAndSaveOutfitsForTrip } from "@/lib/services/outfits";
import {
  createPackingListForTrip,
  packingListNameFromDestination,
} from "@/lib/services/packing";
import { supabase } from "@/lib/supabase";
import type { TripDestination } from "@/lib/types/destination";
import type { ActivityOptionRow, TripListItem } from "@/lib/types/trips";

export async function fetchTripsForUser(
  userId: string
): Promise<{ data: TripListItem[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, trip_activities ( id )")
    .eq("user_id", userId)
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as TripListItem[], error: null };
}

/**
 * Activity options: global defaults (`is_default`) plus rows owned by the user.
 * Selected values are stored in `trip_activities` as `activity_id` FKs — not free text.
 */
export async function fetchActivityOptionsForUser(
  userId: string
): Promise<{ data: ActivityOptionRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("activity_options")
    .select("id, user_id, name, is_default, created_at")
    .or(`is_default.eq.true,user_id.eq.${userId}`)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as ActivityOptionRow[], error: null };
}

export type CreateTripInput = {
  userId: string;
  destination: TripDestination;
  startDate: string | null;
  endDate: string | null;
  notes?: string | null;
  activityIds: string[];
};

export async function createTrip(
  input: CreateTripInput
): Promise<{ tripId: string | null; error: Error | null }> {
  const dest = input.destination;
  if (!dest.placeId?.trim()) {
    return { tripId: null, error: new Error("Select a destination from search results.") };
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: input.userId,
      destination_place_id: dest.placeId,
      destination_name: dest.name,
      destination_formatted_address: dest.formattedAddress,
      destination_lat: dest.lat,
      destination_lng: dest.lng,
      destination_city: dest.city,
      destination_region: dest.region,
      destination_country: dest.country,
      destination_country_code: dest.countryCode,
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (tripError || !trip) {
    return {
      tripId: null,
      error: new Error(tripError?.message ?? "Could not create trip."),
    };
  }

  const tripId = trip.id as string;

  const listName = packingListNameFromDestination(dest.name, dest.city);
  const { data: packingList, error: packingError } = await createPackingListForTrip(
    tripId,
    input.userId,
    listName
  );

  if (packingError || !packingList) {
    await supabase.from("trips").delete().eq("id", tripId);
    return { tripId: null, error: packingError };
  }

  const uniqueActivityIds = [...new Set(input.activityIds)];

  if (uniqueActivityIds.length > 0) {
    const rows = uniqueActivityIds.map((activity_id) => ({
      trip_id: tripId,
      activity_id,
    }));

    const { error: linkError } = await supabase.from("trip_activities").insert(rows);

    if (linkError) {
      await supabase.from("trips").delete().eq("id", tripId);
      return { tripId: null, error: new Error(linkError.message) };
    }
  }

  const destinationLabel =
    dest.name?.trim() ||
    dest.city?.trim() ||
    dest.formattedAddress?.trim() ||
    "Trip destination";

  const { error: outfitError } = await generateAndSaveOutfitsForTrip({
    packingListId: packingList.id,
    destinationLabel,
    startDate: input.startDate,
    endDate: input.endDate,
    activityIds: uniqueActivityIds,
    notes: input.notes,
  });

  if (outfitError) {
    console.warn("Outfit recommendations could not be saved:", outfitError.message);
  }

  return { tripId, error: null };
}
