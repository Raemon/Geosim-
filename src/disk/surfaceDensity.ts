import { ASTRONOMICAL_UNIT_M } from '../units/constants';
import type { RadialGrid } from './radialGrid';

const SURFACE_DENSITY_EXPONENT = 1.5;

export function gasSurfaceDensityKgM2(
  grid: RadialGrid,
  diskMassKg: number,
  diskOuterRadiusAu: number,
): Float64Array {
  const shape = unnormalisedShape(grid, diskOuterRadiusAu);
  return scaledToTotalMass(grid, shape, diskMassKg);
}

function unnormalisedShape(grid: RadialGrid, diskOuterRadiusAu: number): Float64Array {
  const shape = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const radius = grid.radiusAu[cell]!;
    shape[cell] = Math.pow(radius, -SURFACE_DENSITY_EXPONENT)
      * Math.exp(-radius / diskOuterRadiusAu);
  }
  return shape;
}

function scaledToTotalMass(grid: RadialGrid, shape: Float64Array, diskMassKg: number): Float64Array {
  const squareMetresPerAu2 = ASTRONOMICAL_UNIT_M * ASTRONOMICAL_UNIT_M;
  let weighted = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    weighted += shape[cell]! * grid.annulusAreaAu2[cell]! * squareMetresPerAu2;
  }
  const scale = diskMassKg / weighted;
  const density = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) density[cell] = shape[cell]! * scale;
  return density;
}

export function annulusGasMassKg(grid: RadialGrid, surfaceDensity: Float64Array, cell: number): number {
  const squareMetresPerAu2 = ASTRONOMICAL_UNIT_M * ASTRONOMICAL_UNIT_M;
  return surfaceDensity[cell]! * grid.annulusAreaAu2[cell]! * squareMetresPerAu2;
}
