/**
 * Shapes aligned with `supabase/create_trips_table.sql`,
 * `supabase/create_trip_activities_table.sql`, and
 * `supabase/create_activity_options_table.sql`.
 */

export type TripRow = {
  id: string;
  user_id: string;
  destination_place_id: string | null;
  destination_name: string | null;
  destination_formatted_address: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_city: string | null;
  destination_region: string | null;
  destination_country: string | null;
  destination_country_code: string | null;
  destination_timezone: string | null;
  destination_utc_offset_minutes: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityOptionRow = {
  id: string;
  user_id: string | null;
  name: string;
  is_default: boolean;
  created_at: string;
};

/** Trip with nested packing list summary from a PostgREST select. */
export type TripListItem = TripRow & {
  packing_lists: {
    packing_categories: {
      packing_items: { id: string; is_packed: boolean }[];
    }[];
  }[];
};
