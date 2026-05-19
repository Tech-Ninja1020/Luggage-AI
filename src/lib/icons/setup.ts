import { cssInterop } from 'nativewind';
import { Circle, G, Line, Path, Polygon, Polyline, Rect, Svg } from 'react-native-svg';

const svgComponents = [Svg, Path, Circle, Rect, Line, Polyline, Polygon, G];

for (const component of svgComponents) {
  cssInterop(component, {
    className: true,
  });
}
