import type { LucideIcon as LucideIconComponent, LucideProps } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';
import { registerLucideIcon } from '@/lib/icons/register-lucide';
import { type ThemeColor } from '@/lib/theme';
import { cn } from '@/lib/utils';

export type AppLucideIconProps = LucideProps & {
  icon: LucideIconComponent;
  themeColor?: ThemeColor;
  className?: string;
};

export function LucideIcon({
  icon,
  themeColor = 'text',
  size = 24,
  color,
  className,
  ...props
}: AppLucideIconProps) {
  const theme = useTheme();
  const Icon = registerLucideIcon(icon);

  return (
    <Icon
      size={size}
      color={color ?? theme[themeColor]}
      className={cn(className)}
      {...props}
    />
  );
}
