import type { TripDestination } from "@/lib/types/destination";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

export function isGooglePlacesConfigured(): boolean {
  return API_KEY.length > 0;
}

export type PlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function component(
  components: AddressComponent[],
  type: string,
  useShort = false
): string | null {
  const c = components.find((x) => x.types.includes(type));
  if (!c) return null;
  return useShort ? c.short_name : c.long_name;
}

function parseDestination(
  placeId: string,
  result: {
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    address_components?: AddressComponent[];
  }
): TripDestination {
  const components = result.address_components ?? [];
  const lat = result.geometry?.location?.lat ?? 0;
  const lng = result.geometry?.location?.lng ?? 0;

  return {
    placeId,
    name: result.name ?? result.formatted_address ?? "Destination",
    formattedAddress: result.formatted_address ?? "",
    lat,
    lng,
    city:
      component(components, "locality") ??
      component(components, "postal_town") ??
      component(components, "administrative_area_level_2"),
    region: component(components, "administrative_area_level_1"),
    country: component(components, "country"),
    countryCode: component(components, "country", true),
  };
}

export async function fetchPlacePredictions(
  input: string,
  signal?: AbortSignal
): Promise<{ predictions: PlacePrediction[]; error: string | null }> {
  const query = input.trim();
  if (!query || query.length < 2) {
    return { predictions: [], error: null };
  }
  if (!isGooglePlacesConfigured()) {
    return {
      predictions: [],
      error: "Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to enable destination search.",
    };
  }

  const params = new URLSearchParams({
    input: query,
    key: API_KEY,
    language: "en",
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { signal }
    );
    const json = (await res.json()) as {
      status: string;
      error_message?: string;
      predictions?: {
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text: string;
          secondary_text: string;
        };
      }[];
    };

    if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      return {
        predictions: [],
        error: json.error_message ?? `Places API: ${json.status}`,
      };
    }

    const predictions: PlacePrediction[] = (json.predictions ?? []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? "",
    }));

    return { predictions, error: null };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { predictions: [], error: null };
    }
    return {
      predictions: [],
      error: e instanceof Error ? e.message : "Could not search destinations.",
    };
  }
}

export async function fetchPlaceDetails(
  placeId: string
): Promise<{ destination: TripDestination | null; error: string | null }> {
  if (!isGooglePlacesConfigured()) {
    return {
      destination: null,
      error: "Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to enable destination search.",
    };
  }

  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "geometry",
    "address_components",
  ].join(",");

  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key: API_KEY,
    language: "en",
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );
    const json = (await res.json()) as {
      status: string;
      error_message?: string;
      result?: {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
        address_components?: AddressComponent[];
      };
    };

    if (json.status !== "OK" || !json.result) {
      return {
        destination: null,
        error: json.error_message ?? `Place details: ${json.status}`,
      };
    }

    return {
      destination: parseDestination(placeId, json.result),
      error: null,
    };
  } catch (e) {
    return {
      destination: null,
      error: e instanceof Error ? e.message : "Could not load place details.",
    };
  }
}
