import type { SurfaceCycleResult } from '../sim/erodeSurface';
import type { PlanetSurface } from '../sim/stepPlanet';
import { categoricalColor, hypsometricColor, sequentialColor, type Rgb } from './colorRamps';

const YOUNG_CRUST_SPAN_MYR = 200;
const COLDEST_SHOWN_K = 220;
const TEMPERATURE_SPAN_K = 130;
const WETTEST_SHOWN_M_PER_MYR = 6e5;
const DISCHARGE_DECADES_SHOWN = 16;

export const LAYER_NAMES = [
  'elevation',
  'plates',
  'crustAge',
  'temperature',
  'rainfall',
  'discharge',
] as const;

export type LayerName = typeof LAYER_NAMES[number];

export function colorOfCellFor(
  layer: LayerName,
  surface: PlanetSurface,
  climateOf: () => SurfaceCycleResult,
): (cell: number) => Rgb {
  if (layer === 'elevation') {
    return (cell) => hypsometricColor(surface.crust.elevationM[cell]!, surface.seaLevelM);
  }
  if (layer === 'plates') return (cell) => categoricalColor(surface.plateOf[cell]!);
  if (layer === 'crustAge') {
    return (cell) => sequentialColor(1 - Math.min(1, surface.crust.ageMyr[cell]! / YOUNG_CRUST_SPAN_MYR));
  }
  return climateColorOfCell(layer, climateOf());
}

function climateColorOfCell(
  layer: 'temperature' | 'rainfall' | 'discharge',
  climate: SurfaceCycleResult,
): (cell: number) => Rgb {
  if (layer === 'temperature') {
    return (cell) => sequentialColor((climate.temperatureK[cell]! - COLDEST_SHOWN_K) / TEMPERATURE_SPAN_K);
  }
  if (layer === 'rainfall') {
    return (cell) => sequentialColor(climate.precipitationMPerMyr[cell]! / WETTEST_SHOWN_M_PER_MYR);
  }
  return (cell) => sequentialColor(
    Math.log10(1 + climate.dischargeM3PerMyr[cell]!) / DISCHARGE_DECADES_SHOWN,
  );
}
