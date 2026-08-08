import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';
import { FREEZING_POINT_K } from './surfaceTemperature';

const OPEN_OCEAN_SUPPLY_M_PER_MYR = 1.2e6;
const RAIN_OUT_PER_METRE_OF_RISE = 6e-4;
const OVERLAND_DECAY_PER_CELL = 0.06;
const ADVECTION_PASSES = 24;

export interface PrecipitationInputs {
  elevationM: Float64Array;
  seaLevelM: number;
  temperatureK: Float64Array;
}

export function precipitationMPerMyr(
  grid: SphereGrid,
  inputs: PrecipitationInputs,
): Float64Array {
  const moisture = evaporatedMoisture(grid, inputs);
  for (let pass = 0; pass < ADVECTION_PASSES; pass++) advectMoistureEastward(grid, inputs, moisture);
  return rainFrom(grid, inputs, moisture);
}

function evaporatedMoisture(grid: SphereGrid, inputs: PrecipitationInputs): Float64Array {
  const moisture = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    moisture[cell] = isOcean(inputs, cell) ? OPEN_OCEAN_SUPPLY_M_PER_MYR * warmthFactor(inputs, cell) : 0;
  }
  return moisture;
}

function warmthFactor(inputs: PrecipitationInputs, cell: number): number {
  const above = inputs.temperatureK[cell]! - FREEZING_POINT_K;
  return Math.max(0.05, Math.min(1.5, 1 + above / 40));
}

function advectMoistureEastward(
  grid: SphereGrid,
  inputs: PrecipitationInputs,
  moisture: Float64Array,
): void {
  const arriving = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const downwind = downwindNeighbour(grid, cell);
    if (downwind < 0) continue;
    arriving[downwind] = arriving[downwind]! + moisture[cell]! * carriedFraction(grid, inputs, cell, downwind);
  }
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (!isOcean(inputs, cell)) moisture[cell] = arriving[cell]!;
    else moisture[cell] = Math.max(moisture[cell]!, arriving[cell]!);
  }
}

function carriedFraction(
  grid: SphereGrid,
  inputs: PrecipitationInputs,
  cell: number,
  downwind: number,
): number {
  const rise = Math.max(0, heightOf(inputs, downwind) - heightOf(inputs, cell));
  const orographic = Math.exp(-rise * RAIN_OUT_PER_METRE_OF_RISE);
  const overland = isOcean(inputs, downwind) ? 1 : 1 - OVERLAND_DECAY_PER_CELL;
  return orographic * overland * (grid.neighbourCount[cell]! > 0 ? 1 : 0);
}

function downwindNeighbour(grid: SphereGrid, cell: number): number {
  const base = cell * MAX_NEIGHBOURS;
  let best = -1;
  let bestEastward = -Infinity;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    const eastward = eastwardComponent(grid, cell, other);
    if (eastward > bestEastward) {
      bestEastward = eastward;
      best = other;
    }
  }
  return best;
}

function eastwardComponent(grid: SphereGrid, cell: number, other: number): number {
  const difference = grid.longitudeRad[other]! - grid.longitudeRad[cell]!;
  const wrapped = Math.atan2(Math.sin(difference), Math.cos(difference));
  const trade = Math.cos(grid.latitudeRad[cell]! * 3) >= 0 ? 1 : -1;
  return wrapped * trade;
}

function rainFrom(
  grid: SphereGrid,
  inputs: PrecipitationInputs,
  moisture: Float64Array,
): Float64Array {
  const rain = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const downwind = downwindNeighbour(grid, cell);
    const carried = downwind < 0 ? 1 : carriedFraction(grid, inputs, cell, downwind);
    rain[cell] = moisture[cell]! * (1 - carried);
  }
  return rain;
}

function heightOf(inputs: PrecipitationInputs, cell: number): number {
  return Math.max(0, inputs.elevationM[cell]! - inputs.seaLevelM);
}

function isOcean(inputs: PrecipitationInputs, cell: number): boolean {
  return inputs.elevationM[cell]! < inputs.seaLevelM;
}
