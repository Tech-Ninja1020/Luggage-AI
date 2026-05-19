import type { LucideIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

const registered = new WeakSet<LucideIcon>();

/** Enable NativeWind `className` on a Lucide icon component. */
export function registerLucideIcon(icon: LucideIcon) {
  if (registered.has(icon)) return icon;

  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        width: true,
        height: true,
        opacity: true,
      },
    },
  });

  registered.add(icon);
  return icon;
}
