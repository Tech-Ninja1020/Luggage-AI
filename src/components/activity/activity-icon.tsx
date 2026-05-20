import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { THEME } from "@/lib/theme";

type Props = {
  name: string;
  selected?: boolean;
  size?: number;
};

function normalize(name: string) {
  return name.trim().toLowerCase();
}

const ICON_BY_ACTIVITY: Record<string, string> = {
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

export function ActivityIcon({ name, selected = false, size = 22 }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

  const iconName = useMemo(() => {
    const key = normalize(name);
    return ICON_BY_ACTIVITY[key] ?? "dots-grid";
  }, [name]);

  const color = selected ? theme.primary : theme.mutedForeground;

  return <MaterialCommunityIcons name={iconName as never} size={size} color={color} />;
}

