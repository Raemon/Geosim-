import type { SphereGrid } from '../sphere/sphereGrid';
import type { DrainageNetwork } from './flowRouting';

const DISCHARGE_EXPONENT = 0.5;
const SLOPE_EXPONENT = 1;
const INCISION_COEFFICIENT = 4e-6;

export function streamPowerErosionM(
  grid: SphereGrid,
  network: DrainageNetwork,
  surfaceHeightM: Float64Array,
  cellSpacingM: number,
  erodibility: Float64Array,
  stepMyr: number,
): Float64Array {
  const erosion = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    erosion[cell] = cellIncisionM(network, surfaceHeightM, cellSpacingM, erodibility, cell, stepMyr);
  }
  return erosion;
}

function cellIncisionM(
  network: DrainageNetwork,
  surfaceHeightM: Float64Array,
  cellSpacingM: number,
  erodibility: Float64Array,
  cell: number,
  stepMyr: number,
): number {
  const downstream = network.receiver[cell]!;
  if (downstream < 0) return 0;
  const drop = surfaceHeightM[cell]! - surfaceHeightM[downstream]!;
  if (drop <= 0) return 0;
  const slope = drop / cellSpacingM;
  const discharge = network.dischargeM3PerMyr[cell]!;
  const rate = INCISION_COEFFICIENT * erodibility[cell]!
    * Math.pow(discharge, DISCHARGE_EXPONENT) * Math.pow(slope, SLOPE_EXPONENT);
  return Math.min(drop, rate * stepMyr);
}
