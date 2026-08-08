import type { Rgb } from './colorRamps';

export function cssColor(color: Rgb): string {
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}
