export function normalizeActivityName(name: string) {
  return name.trim().toLowerCase();
}

export const ICON_BY_ACTIVITY: Record<string, string> = {
  beach: "beach",
  swimming: "swim",
  hiking: "hiking",
  camping: "campfire",
  bicycling: "bike",
  running: "run",
  gym: "dumbbell",
  yoga: "yoga",
  spa: "spa",
  golf: "golf",
  tennis: "tennis",
  fishing: "fish",
  surfing: "surfing",
  "scuba diving": "diving-scuba-tank",
  skiing: "ski",
  snowboarding: "snowboard",
  "business meeting": "briefcase-outline",
  conference: "account-group-outline",
  "remote work": "laptop",
  wedding: "ring",
  "formal dinner": "silverware-fork-knife",
  "night out": "glass-cocktail",
  "date night": "heart-outline",
  party: "party-popper",
  sightseeing: "binoculars",
  photography: "camera",
  shopping: "shopping-outline",
  "food tour": "food-fork-drink",
  "road trip": "car-outline",
  cruise: "ferry",
  flight: "airplane",
  "train travel": "train",
  "long drive": "car-clock",
};

export const DEFAULT_ACTIVITY_ICON = "dots-grid";

export function getActivityIconName(name: string): string {
  const key = normalizeActivityName(name);
  return ICON_BY_ACTIVITY[key] ?? DEFAULT_ACTIVITY_ICON;
}
