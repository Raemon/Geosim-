import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';

export interface DrainageNetwork {
  receiver: Int32Array;
  orderedByHeight: Int32Array;
  dischargeM3PerMyr: Float64Array;
}

export function routeFlow(
  grid: SphereGrid,
  surfaceHeightM: Float64Array,
  precipitationMPerMyr: Float64Array,
  cellAreaM2: Float64Array,
  seaLevelM: number,
): DrainageNetwork {
  const receiver = steepestDescentReceivers(grid, surfaceHeightM, seaLevelM);
  const orderedByHeight = cellsSortedByDescendingHeight(grid, surfaceHeightM);
  return {
    receiver,
    orderedByHeight,
    dischargeM3PerMyr: accumulateDownstream(
      grid, receiver, orderedByHeight, precipitationMPerMyr, cellAreaM2,
    ),
  };
}

function steepestDescentReceivers(
  grid: SphereGrid,
  surfaceHeightM: Float64Array,
  seaLevelM: number,
): Int32Array {
  const receiver = new Int32Array(grid.cellCount).fill(-1);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (surfaceHeightM[cell]! < seaLevelM) continue;
    receiver[cell] = lowestNeighbourBelow(grid, surfaceHeightM, cell);
  }
  return receiver;
}

function lowestNeighbourBelow(
  grid: SphereGrid,
  surfaceHeightM: Float64Array,
  cell: number,
): number {
  const base = cell * MAX_NEIGHBOURS;
  let best = -1;
  let bestHeight = surfaceHeightM[cell]!;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    if (surfaceHeightM[other]! < bestHeight) {
      bestHeight = surfaceHeightM[other]!;
      best = other;
    }
  }
  return best;
}

function cellsSortedByDescendingHeight(grid: SphereGrid, surfaceHeightM: Float64Array): Int32Array {
  const order = new Int32Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) order[cell] = cell;
  const sorted = Array.from(order).sort((a, b) => surfaceHeightM[b]! - surfaceHeightM[a]!);
  return Int32Array.from(sorted);
}

function accumulateDownstream(
  grid: SphereGrid,
  receiver: Int32Array,
  orderedByHeight: Int32Array,
  precipitationMPerMyr: Float64Array,
  cellAreaM2: Float64Array,
): Float64Array {
  const discharge = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    discharge[cell] = precipitationMPerMyr[cell]! * cellAreaM2[cell]!;
  }
  for (let index = 0; index < orderedByHeight.length; index++) {
    const cell = orderedByHeight[index]!;
    const downstream = receiver[cell]!;
    if (downstream >= 0) discharge[downstream] = discharge[downstream]! + discharge[cell]!;
  }
  return discharge;
}
