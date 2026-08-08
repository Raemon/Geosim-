import type { SphereGrid } from '../sphere/sphereGrid';

const SET_POINT_K = 288;
const TEMPERATURE_SENSITIVITY_K = 13;
const PRESSURE_EXPONENT = 0.3;
const REFERENCE_PARTIAL_PRESSURE_BAR = 3e-4;
const OUTGASSING_FRACTION_PER_MYR = 2e-3;
const MINIMUM_ATMOSPHERIC_FRACTION = 1e-6;

export function carbonDioxideAfterWeathering(
  carbonDioxideMassKg: number,
  partialPressureBar: number,
  meanSurfaceTemperatureK: number,
  landFraction: number,
  mantleVigour: number,
  stepMyr: number,
): number {
  const outgassed = carbonDioxideMassKg * OUTGASSING_FRACTION_PER_MYR * mantleVigour * stepMyr;
  const drawn = outgassed
    * weatheringResponse(partialPressureBar, meanSurfaceTemperatureK)
    * Math.max(0.05, landFraction / 0.3);
  const floor = carbonDioxideMassKg * MINIMUM_ATMOSPHERIC_FRACTION;
  return Math.max(floor, carbonDioxideMassKg + outgassed - drawn);
}

function weatheringResponse(partialPressureBar: number, meanSurfaceTemperatureK: number): number {
  const pressureTerm = Math.pow(
    Math.max(partialPressureBar, 1e-12) / REFERENCE_PARTIAL_PRESSURE_BAR,
    PRESSURE_EXPONENT,
  );
  const temperatureTerm = Math.exp((meanSurfaceTemperatureK - SET_POINT_K) / TEMPERATURE_SENSITIVITY_K);
  return pressureTerm * temperatureTerm;
}

export function areaWeightedMeanK(grid: SphereGrid, temperatureK: Float64Array): number {
  let total = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    total += temperatureK[cell]! * grid.areaFraction[cell]!;
  }
  return total;
}

export function landAreaFraction(
  grid: SphereGrid,
  elevationM: Float64Array,
  seaLevelM: number,
): number {
  let land = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (elevationM[cell]! >= seaLevelM) land += grid.areaFraction[cell]!;
  }
  return land;
}
