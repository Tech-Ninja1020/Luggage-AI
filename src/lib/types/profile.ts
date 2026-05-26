export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];

export const OUTFIT_STYLE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "business_casual", label: "Business casual" },
  { value: "formal", label: "Formal" },
  { value: "sporty", label: "Sporty" },
  { value: "minimalist", label: "Minimalist" },
  { value: "bold", label: "Bold / colorful" },
  { value: "modest", label: "Modest" },
  { value: "comfort", label: "Comfort first" },
] as const;

export type OutfitStyle = (typeof OUTFIT_STYLE_OPTIONS)[number]["value"];

export type ProfileRow = {
  user_id: string;
  gender: Gender | null;
  outfit_preferences: OutfitStyle[];
  created_at: string;
  updated_at: string;
};

export type ProfileInput = {
  gender: Gender | null;
  outfitPreferences: OutfitStyle[];
};
