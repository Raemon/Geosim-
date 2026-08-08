import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';
import type { CrustState } from './crustState';
import type { EulerPoles } from './eulerPole';

type UnitVector = readonly [number, number, number];

export function advectPlates(
  grid: SphereGrid,
  crust: CrustState,
  plateOf: Int32Array,
  poles: EulerPoles,
  pendingRotationRad: Float64Array,
  stepMyr: number,
): CrustState {
  const spacingRad = Math.sqrt((4 * Math.PI) / grid.cellCount);
  const moving = accumulateUntilAWholeCell(poles, pendingRotationRad, stepMyr, spacingRad);
  if (!moving.some((angle) => angle !== 0)) return crust;
  const sampled = emptyCrust(grid);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    sampleUpstreamInto(sampled, grid, crust, plateOf, poles, moving, cell);
  }
  return sampled;
}

function accumulateUntilAWholeCell(
  poles: EulerPoles,
  pendingRotationRad: Float64Array,
  stepMyr: number,
  spacingRad: number,
): Float64Array {
  const moving = new Float64Array(pendingRotationRad.length);
  for (let plate = 0; plate < pendingRotationRad.length; plate++) {
    const pending = pendingRotationRad[plate]! + poles.angularSpeedRadPerMyr[plate]! * stepMyr;
    if (pending < spacingRad) {
      pendingRotationRad[plate] = pending;
      continue;
    }
    moving[plate] = pending;
    pendingRotationRad[plate] = 0;
  }
  return moving;
}

function sampleUpstreamInto(
  sampled: CrustState,
  grid: SphereGrid,
  crust: CrustState,
  plateOf: Int32Array,
  poles: EulerPoles,
  moving: Float64Array,
  cell: number,
): void {
  const plate = plateOf[cell]!;
  const target = rotateAboutAxis(grid, poles, plate, cell, -moving[plate]!);
  const source = walkToNearestCell(grid, cell, target);
  sampled.thicknessM[cell] = crust.thicknessM[source]!;
  sampled.densityKgM3[cell] = crust.densityKgM3[source]!;
  sampled.ageMyr[cell] = crust.ageMyr[source]!;
}

function walkToNearestCell(grid: SphereGrid, from: number, target: UnitVector): number {
  let best = from;
  let bestDot = dotWith(grid, from, target);
  for (;;) {
    const closer = closerNeighbour(grid, best, target, bestDot);
    if (closer.cell === best) return best;
    best = closer.cell;
    bestDot = closer.dot;
  }
}

function closerNeighbour(
  grid: SphereGrid,
  cell: number,
  target: UnitVector,
  currentDot: number,
): { cell: number; dot: number } {
  const base = cell * MAX_NEIGHBOURS;
  let bestCell = cell;
  let bestDot = currentDot;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    const dot = dotWith(grid, other, target);
    if (dot > bestDot) {
      bestDot = dot;
      bestCell = other;
    }
  }
  return { cell: bestCell, dot: bestDot };
}

function rotateAboutAxis(
  grid: SphereGrid,
  poles: EulerPoles,
  plate: number,
  cell: number,
  angle: number,
): UnitVector {
  const ax = poles.axisX[plate]!;
  const ay = poles.axisY[plate]!;
  const az = poles.axisZ[plate]!;
  const px = grid.positionX[cell]!;
  const py = grid.positionY[cell]!;
  const pz = grid.positionZ[cell]!;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = ax * px + ay * py + az * pz;
  return [
    px * cos + (ay * pz - az * py) * sin + ax * dot * (1 - cos),
    py * cos + (az * px - ax * pz) * sin + ay * dot * (1 - cos),
    pz * cos + (ax * py - ay * px) * sin + az * dot * (1 - cos),
  ];
}

function dotWith(grid: SphereGrid, cell: number, target: UnitVector): number {
  return grid.positionX[cell]! * target[0]
    + grid.positionY[cell]! * target[1]
    + grid.positionZ[cell]! * target[2];
}

function emptyCrust(grid: SphereGrid): CrustState {
  return {
    thicknessM: new Float64Array(grid.cellCount),
    densityKgM3: new Float64Array(grid.cellCount),
    ageMyr: new Float64Array(grid.cellCount),
    elevationM: new Float64Array(grid.cellCount),
  };
}
