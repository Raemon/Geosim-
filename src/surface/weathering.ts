import type { SphereGrid } from '../sphere/sphereGrid';
import { FREEZING_POINT_K } from '../climate/surfaceTemperature';
import { isContinental, type CrustState } from '../tectonics/crustState';

const CONTINENTAL_ERODIBILITY = 1.4;
const BASALT_ERODIBILITY = 0.7;
const RAINFALL_REFERENCE_M_PER_MYR = 1e6;
const TEMPERATURE_DOUBLING_K = 12;

export function erodibilityField(
  grid: SphereGrid,
  crust: CrustState,
  temperatureK: Float64Array,
  precipitationMPerMyr: Float64Array,
): Float64Array {
  const erodibility = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    erodibility[cell] = lithologyFactor(crust, cell)
      * rainfallFactor(precipitationMPerMyr[cell]!)
      * temperatureFactor(temperatureK[cell]!);
  }
  return erodibility;
}

function lithologyFactor(crust: CrustState, cell: number): number {
  return isContinental(crust, cell) ? CONTINENTAL_ERODIBILITY : BASALT_ERODIBILITY;
}

function rainfallFactor(precipitationMPerMyr: number): number {
  return Math.sqrt(Math.max(0, precipitationMPerMyr) / RAINFALL_REFERENCE_M_PER_MYR);
}

function temperatureFactor(temperatureK: number): number {
  if (temperatureK < FREEZING_POINT_K) return 0.25;
  return Math.pow(2, (temperatureK - FREEZING_POINT_K) / TEMPERATURE_DOUBLING_K) ** 0.5;
}
