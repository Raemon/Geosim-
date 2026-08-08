import type { SphereGrid } from '../sphere/sphereGrid';
import type { DrainageNetwork } from './flowRouting';

export interface SedimentBudget {
  depositedM: Float64Array;
  deliveredToOceanM3: number;
}

const OVERBANK_DEPOSITION_FRACTION = 0.12;

export function routeSedimentDownstream(
  grid: SphereGrid,
  network: DrainageNetwork,
  erodedM: Float64Array,
  cellAreaM2: Float64Array,
  surfaceHeightM: Float64Array,
  seaLevelM: number,
): SedimentBudget {
  const carrying = new Float64Array(grid.cellCount);
  const budget: SedimentBudget = {
    depositedM: new Float64Array(grid.cellCount),
    deliveredToOceanM3: 0,
  };
  for (let cell = 0; cell < grid.cellCount; cell++) carrying[cell] = erodedM[cell]! * cellAreaM2[cell]!;
  for (let index = 0; index < network.orderedByHeight.length; index++) {
    passLoadDownstream(grid, network, carrying, budget, cellAreaM2, surfaceHeightM, seaLevelM, index);
  }
  return budget;
}

function passLoadDownstream(
  grid: SphereGrid,
  network: DrainageNetwork,
  carrying: Float64Array,
  budget: SedimentBudget,
  cellAreaM2: Float64Array,
  surfaceHeightM: Float64Array,
  seaLevelM: number,
  index: number,
): void {
  const cell = network.orderedByHeight[index]!;
  const load = carrying[cell]!;
  if (load <= 0) return;
  const downstream = network.receiver[cell]!;
  if (downstream < 0 || surfaceHeightM[cell]! < seaLevelM) {
    budget.deliveredToOceanM3 += load;
    depositInPlace(budget, cellAreaM2, cell, load);
    carrying[cell] = 0;
    return;
  }
  const dropped = load * OVERBANK_DEPOSITION_FRACTION;
  depositInPlace(budget, cellAreaM2, cell, dropped);
  carrying[downstream] = carrying[downstream]! + load - dropped;
  carrying[cell] = 0;
}

function depositInPlace(
  budget: SedimentBudget,
  cellAreaM2: Float64Array,
  cell: number,
  volumeM3: number,
): void {
  budget.depositedM[cell] = budget.depositedM[cell]! + volumeM3 / cellAreaM2[cell]!;
}
