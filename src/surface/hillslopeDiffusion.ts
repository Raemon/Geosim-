import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';

const CREEP_COEFFICIENT_M2_PER_MYR = 6e3;
const ANGLE_OF_REPOSE_SLOPE = 0.6;
const LANDSLIDE_SHARPNESS = 6;

export function hillslopeChangeM(
  grid: SphereGrid,
  surfaceHeightM: Float64Array,
  cellSpacingM: number,
  seaLevelM: number,
  stepMyr: number,
): Float64Array {
  const change = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (surfaceHeightM[cell]! < seaLevelM) continue;
    accumulateNeighbourExchange(grid, surfaceHeightM, cellSpacingM, stepMyr, change, cell);
  }
  return change;
}

function accumulateNeighbourExchange(
  grid: SphereGrid,
  surfaceHeightM: Float64Array,
  cellSpacingM: number,
  stepMyr: number,
  change: Float64Array,
  cell: number,
): void {
  const base = cell * MAX_NEIGHBOURS;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    const drop = surfaceHeightM[cell]! - surfaceHeightM[other]!;
    if (drop <= 0) continue;
    const moved = transportedM(drop, cellSpacingM, stepMyr);
    change[cell] = change[cell]! - moved;
    change[other] = change[other]! + moved;
  }
}

function transportedM(dropM: number, cellSpacingM: number, stepMyr: number): number {
  const slope = dropM / cellSpacingM;
  const nonlinear = 1 + Math.pow(slope / ANGLE_OF_REPOSE_SLOPE, LANDSLIDE_SHARPNESS);
  const flux = CREEP_COEFFICIENT_M2_PER_MYR * slope * nonlinear * stepMyr / cellSpacingM;
  return Math.min(dropM * 0.25, flux);
}
