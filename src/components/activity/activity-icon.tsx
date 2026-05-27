import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getActivityIconName } from "@/lib/activities/icon-names";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { THEME } from "@/lib/theme";

type Props = {
  name: string;
  selected?: boolean;
  size?: number;
};

export function ActivityIcon({ name, selected = false, size = 22 }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

  const iconName = useMemo(() => getActivityIconName(name), [name]);

  const color = selected ? theme.primary : theme.mutedForeground;

  return <MaterialCommunityIcons name={iconName as never} size={size} color={color} />;
}
