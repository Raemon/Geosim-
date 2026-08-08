import type { SphereGrid } from '../sphere/sphereGrid';

export interface GlobeRotation {
  yawRad: number;
  pitchRad: number;
}

export interface DiskProjection {
  rightOfCentre: Float64Array;
  belowCentre: Float64Array;
  towardViewer: Float64Array;
}

export function newDiskProjection(cellCount: number): DiskProjection {
  return {
    rightOfCentre: new Float64Array(cellCount),
    belowCentre: new Float64Array(cellCount),
    towardViewer: new Float64Array(cellCount),
  };
}

export function projectOntoDisk(
  grid: SphereGrid,
  rotation: GlobeRotation,
  into: DiskProjection,
): void {
  const cosYaw = Math.cos(rotation.yawRad);
  const sinYaw = Math.sin(rotation.yawRad);
  const cosPitch = Math.cos(rotation.pitchRad);
  const sinPitch = Math.sin(rotation.pitchRad);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const spunTowardViewer = grid.positionX[cell]! * cosYaw - grid.positionY[cell]! * sinYaw;
    const polar = grid.positionZ[cell]!;
    into.rightOfCentre[cell] = grid.positionX[cell]! * sinYaw + grid.positionY[cell]! * cosYaw;
    into.belowCentre[cell] = -(spunTowardViewer * sinPitch + polar * cosPitch);
    into.towardViewer[cell] = spunTowardViewer * cosPitch - polar * sinPitch;
  }
}
