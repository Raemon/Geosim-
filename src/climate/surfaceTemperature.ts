import type { SphereGrid } from '../sphere/sphereGrid';
import { equilibriumTemperatureK, latitudeInsolationFactor } from './insolation';

export const FREEZING_POINT_K = 273.15;

const LAPSE_RATE_K_PER_M = 0.0065;
const ICE_ALBEDO = 0.6;
const ROCK_ALBEDO = 0.25;
const OCEAN_ALBEDO = 0.08;

export interface ClimateInputs {
  fluxWM2: number;
  greenhouseK: number;
  elevationM: Float64Array;
  seaLevelM: number;
}

export function surfaceTemperatureK(grid: SphereGrid, climate: ClimateInputs): Float64Array {
  const temperature = new Float64Array(grid.cellCount);
  for (let pass = 0; pass < 2; pass++) {
    for (let cell = 0; cell < grid.cellCount; cell++) {
      temperature[cell] = cellTemperatureK(grid, climate, temperature, cell);
    }
  }
  return temperature;
}

function cellTemperatureK(
  grid: SphereGrid,
  climate: ClimateInputs,
  previous: Float64Array,
  cell: number,
): number {
  const local = climate.fluxWM2 * latitudeInsolationFactor(grid.latitudeRad[cell]!);
  const bare = equilibriumTemperatureK(local, albedoOfCell(climate, previous, cell));
  return bare + climate.greenhouseK - heightAboveSeaLevelM(climate, cell) * LAPSE_RATE_K_PER_M;
}

function albedoOfCell(climate: ClimateInputs, previous: Float64Array, cell: number): number {
  if (previous[cell]! > 0 && previous[cell]! < FREEZING_POINT_K) return ICE_ALBEDO;
  return climate.elevationM[cell]! < climate.seaLevelM ? OCEAN_ALBEDO : ROCK_ALBEDO;
}

function heightAboveSeaLevelM(climate: ClimateInputs, cell: number): number {
  return Math.max(0, climate.elevationM[cell]! - climate.seaLevelM);
}
