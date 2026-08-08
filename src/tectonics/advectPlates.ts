import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';
import type { CrustState } from './crustState';
import type { EulerPoles } from './eulerPole';

export function advectPlates(
  grid: SphereGrid,
  crust: CrustState,
  plateOf: Int32Array,
  poles: EulerPoles,
  stepMyr: number,
): { crust: CrustState; plateOf: Int32Array } {
  const source = new Int32Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    source[cell] = cellUpstreamOf(grid, plateOf, poles, stepMyr, cell);
  }
  return { crust: crustSampledFrom(grid, crust, source), plateOf: sampledInts(plateOf, source) };
}

function cellUpstreamOf(
  grid: SphereGrid,
  plateOf: Int32Array,
  poles: EulerPoles,
  stepMyr: number,
  cell: number,
): number {
  const plate = plateOf[cell]!;
  const angle = -poles.angularSpeedRadPerMyr[plate]! * stepMyr;
  const rotated = rotateAboutAxis(grid, poles, plate, cell, angle);
  return nearestWithinTwoRings(grid, cell, rotated);
}

function rotateAboutAxis(
  grid: SphereGrid,
  poles: EulerPoles,
  plate: number,
  cell: number,
  angle: number,
): [number, number, number] {
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

function nearestWithinTwoRings(
  grid: SphereGrid,
  cell: number,
  target: [number, number, number],
): number {
  let best = cell;
  let bestDot = dotWith(grid, cell, target);
  for (const candidate of twoRingOf(grid, cell)) {
    const dot = dotWith(grid, candidate, target);
    if (dot > bestDot) {
      bestDot = dot;
      best = candidate;
    }
  }
  return best;
}

function twoRingOf(grid: SphereGrid, cell: number): number[] {
  const ring: number[] = [];
  for (const first of neighboursOf(grid, cell)) {
    ring.push(first);
    for (const second of neighboursOf(grid, first)) if (!ring.includes(second)) ring.push(second);
  }
  return ring;
}

function neighboursOf(grid: SphereGrid, cell: number): number[] {
  const base = cell * MAX_NEIGHBOURS;
  const found: number[] = [];
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) found.push(grid.neighbours[base + slot]!);
  return found;
}

function dotWith(grid: SphereGrid, cell: number, target: [number, number, number]): number {
  return grid.positionX[cell]! * target[0]
    + grid.positionY[cell]! * target[1]
    + grid.positionZ[cell]! * target[2];
}

function crustSampledFrom(grid: SphereGrid, crust: CrustState, source: Int32Array): CrustState {
  return {
    thicknessM: sampledFloats(crust.thicknessM, source),
    densityKgM3: sampledFloats(crust.densityKgM3, source),
    ageMyr: sampledFloats(crust.ageMyr, source),
    elevationM: new Float64Array(grid.cellCount),
  };
}

function sampledFloats(values: Float64Array, source: Int32Array): Float64Array {
  const sampled = new Float64Array(source.length);
  for (let cell = 0; cell < source.length; cell++) sampled[cell] = values[source[cell]!]!;
  return sampled;
}

function sampledInts(values: Int32Array, source: Int32Array): Int32Array {
  const sampled = new Int32Array(source.length);
  for (let cell = 0; cell < source.length; cell++) sampled[cell] = values[source[cell]!]!;
  return sampled;
}
