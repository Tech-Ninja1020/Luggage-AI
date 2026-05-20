/** Parsed Google Place mapped to `trips` destination columns. */
export type TripDestination = {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
};
