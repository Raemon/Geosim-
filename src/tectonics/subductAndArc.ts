import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';
import { CONVERGENT, type PlateBoundaries } from './boundaryClassification';
import {
  CONTINENTAL_CRUST_DENSITY,
  OCEANIC_CRUST_DENSITY,
  OCEANIC_CRUST_THICKNESS_M,
  isContinental,
  type CrustState,
} from './crustState';

const ARC_ACCRETION_EFFICIENCY = 0.04;
const FELSIFICATION_PER_MYR = 20;
const MAXIMUM_CRUST_THICKNESS_M = 40000;

export function subductAndBuildArcs(
  grid: SphereGrid,
  crust: CrustState,
  boundaries: PlateBoundaries,
  plateOf: Int32Array,
  stepMyr: number,
  mantleVigour: number,
): void {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (boundaries.kind[cell] !== CONVERGENT) continue;
    if (subductsBeneathNeighbour(grid, crust, plateOf, cell)) recycleAsFreshOcean(crust, cell);
    else growArcCrust(crust, boundaries, cell, stepMyr, mantleVigour);
  }
}

function subductsBeneathNeighbour(
  grid: SphereGrid,
  crust: CrustState,
  plateOf: Int32Array,
  cell: number,
): boolean {
  if (isContinental(crust, cell)) return false;
  const base = cell * MAX_NEIGHBOURS;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    if (plateOf[other] === plateOf[cell]) continue;
    if (outranksForSubduction(crust, other, cell)) return true;
  }
  return false;
}

function outranksForSubduction(crust: CrustState, overriding: number, subducting: number): boolean {
  if (isContinental(crust, overriding)) return true;
  return crust.ageMyr[subducting]! > crust.ageMyr[overriding]!;
}

function recycleAsFreshOcean(crust: CrustState, cell: number): void {
  crust.thicknessM[cell] = OCEANIC_CRUST_THICKNESS_M;
  crust.densityKgM3[cell] = OCEANIC_CRUST_DENSITY;
  crust.ageMyr[cell] = 0;
}

function growArcCrust(
  crust: CrustState,
  boundaries: PlateBoundaries,
  cell: number,
  stepMyr: number,
  mantleVigour: number,
): void {
  const added = Math.abs(boundaries.closingRateMPerMyr[cell]!)
    * ARC_ACCRETION_EFFICIENCY * stepMyr * mantleVigour;
  crust.thicknessM[cell] = Math.min(MAXIMUM_CRUST_THICKNESS_M, crust.thicknessM[cell]! + added);
  crust.densityKgM3[cell] = Math.max(
    CONTINENTAL_CRUST_DENSITY,
    crust.densityKgM3[cell]! - FELSIFICATION_PER_MYR * stepMyr * mantleVigour,
  );
}
