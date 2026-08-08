import type { SphereGrid } from '../sphere/sphereGrid';
import type { EulerPoles } from './eulerPole';

export interface SurfaceVelocity {
  eastX: Float64Array;
  eastY: Float64Array;
  eastZ: Float64Array;
}

export function plateVelocityMPerMyr(
  grid: SphereGrid,
  plateOf: Int32Array,
  poles: EulerPoles,
  planetRadiusM: number,
): SurfaceVelocity {
  const velocity: SurfaceVelocity = {
    eastX: new Float64Array(grid.cellCount),
    eastY: new Float64Array(grid.cellCount),
    eastZ: new Float64Array(grid.cellCount),
  };
  for (let cell = 0; cell < grid.cellCount; cell++) {
    fillCellVelocity(velocity, grid, plateOf, poles, planetRadiusM, cell);
  }
  return velocity;
}

function fillCellVelocity(
  velocity: SurfaceVelocity,
  grid: SphereGrid,
  plateOf: Int32Array,
  poles: EulerPoles,
  planetRadiusM: number,
  cell: number,
): void {
  const plate = plateOf[cell]!;
  const scale = poles.angularSpeedRadPerMyr[plate]! * planetRadiusM;
  const ax = poles.axisX[plate]!;
  const ay = poles.axisY[plate]!;
  const az = poles.axisZ[plate]!;
  const px = grid.positionX[cell]!;
  const py = grid.positionY[cell]!;
  const pz = grid.positionZ[cell]!;
  velocity.eastX[cell] = scale * (ay * pz - az * py);
  velocity.eastY[cell] = scale * (az * px - ax * pz);
  velocity.eastZ[cell] = scale * (ax * py - ay * px);
}

export function speedMPerMyr(velocity: SurfaceVelocity, cell: number): number {
  return Math.hypot(velocity.eastX[cell]!, velocity.eastY[cell]!, velocity.eastZ[cell]!);
}

export function speedCmPerYear(velocity: SurfaceVelocity, cell: number): number {
  return speedMPerMyr(velocity, cell) * 100 / 1e6;
}
