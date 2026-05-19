import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { type ThemeColor } from '@/lib/theme';

type SharedVectorIconProps = {
  size?: number;
  color?: string;
  themeColor?: ThemeColor;
};

export type VectorIconProps =
  | (SharedVectorIconProps & {
    family: 'ionicons';
    name: ComponentProps<typeof Ionicons>['name'];
  })
  | (SharedVectorIconProps & {
    family: 'material-community';
    name: ComponentProps<typeof MaterialCommunityIcons>['name'];
  })
  | (SharedVectorIconProps & {
    family: 'material';
    name: ComponentProps<typeof MaterialIcons>['name'];
  })
  | (SharedVectorIconProps & {
    family: 'feather';
    name: ComponentProps<typeof Feather>['name'];
  })
  | (SharedVectorIconProps & {
    family?: undefined;
    name: ComponentProps<typeof MaterialCommunityIcons>['name'];
  });

export const vectorIconFamilies = {
  ionicons: Ionicons,
  'material-community': MaterialCommunityIcons,
  material: MaterialIcons,
  feather: Feather,
} as const;

export type VectorIconFamily = keyof typeof vectorIconFamilies;

export function VectorIcon(props: VectorIconProps) {
  const theme = useTheme();
  const resolvedColor = props.color ?? theme[props.themeColor ?? 'text'];
  const size = props.size ?? 24;

  if (props.family === 'ionicons') {
    return <Ionicons name={props.name} size={size} color={resolvedColor} />;
  }

  if (props.family === 'material') {
    return <MaterialIcons name={props.name} size={size} color={resolvedColor} />;
  }

  if (props.family === 'feather') {
    return <Feather name={props.name} size={size} color={resolvedColor} />;
  }

  return <MaterialCommunityIcons name={props.name} size={size} color={resolvedColor} />;
}
