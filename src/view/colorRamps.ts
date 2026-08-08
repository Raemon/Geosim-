export type Rgb = readonly [number, number, number];

interface RampStop {
  at: number;
  color: Rgb;
}

const HYPSOMETRIC_LAND: readonly RampStop[] = [
  { at: 0, color: [86, 125, 70] },
  { at: 400, color: [140, 158, 88] },
  { at: 1200, color: [178, 156, 104] },
  { at: 2500, color: [150, 118, 92] },
  { at: 4500, color: [214, 210, 205] },
  { at: 9000, color: [255, 255, 255] },
];

const OCEAN_SHALLOW: Rgb = [78, 134, 168];
const OCEAN_DEEP: Rgb = [14, 38, 74];
const DEEPEST_OCEAN_M = 6000;

export function hypsometricColor(elevationM: number, seaLevelM: number): Rgb {
  const relative = elevationM - seaLevelM;
  return relative < 0 ? oceanColor(-relative) : landColor(relative);
}

function oceanColor(depthM: number): Rgb {
  return mix(OCEAN_SHALLOW, OCEAN_DEEP, Math.min(1, depthM / DEEPEST_OCEAN_M));
}

function landColor(heightM: number): Rgb {
  for (let stop = 1; stop < HYPSOMETRIC_LAND.length; stop++) {
    const lower = HYPSOMETRIC_LAND[stop - 1]!;
    const upper = HYPSOMETRIC_LAND[stop]!;
    if (heightM <= upper.at) {
      return mix(lower.color, upper.color, (heightM - lower.at) / (upper.at - lower.at));
    }
  }
  return HYPSOMETRIC_LAND[HYPSOMETRIC_LAND.length - 1]!.color;
}

export function categoricalColor(index: number): Rgb {
  const hue = (index * 137.508) % 360;
  return hueToRgb(hue, 0.55, 0.55);
}

export function sequentialColor(fraction: number): Rgb {
  return mix([16, 24, 48], [250, 232, 150], Math.max(0, Math.min(1, fraction)));
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = Math.max(0, Math.min(1, amount));
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

function hueToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const [r, g, b] = rgbSector(hue, chroma, secondary);
  return [Math.round((r + base) * 255), Math.round((g + base) * 255), Math.round((b + base) * 255)];
}

function rgbSector(hue: number, chroma: number, secondary: number): Rgb {
  if (hue < 60) return [chroma, secondary, 0];
  if (hue < 120) return [secondary, chroma, 0];
  if (hue < 180) return [0, chroma, secondary];
  if (hue < 240) return [0, secondary, chroma];
  if (hue < 300) return [secondary, 0, chroma];
  return [chroma, 0, secondary];
}
