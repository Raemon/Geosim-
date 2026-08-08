import { icosphere, type SphereMesh } from './icosphere';

export const MAX_NEIGHBOURS = 6;

export interface SphereGrid {
  cellCount: number;
  positionX: Float64Array;
  positionY: Float64Array;
  positionZ: Float64Array;
  latitudeRad: Float64Array;
  longitudeRad: Float64Array;
  neighbours: Int32Array;
  neighbourCount: Int32Array;
  areaFraction: Float64Array;
}

export function sphereGrid(subdivisions: number): SphereGrid {
  const mesh = icosphere(subdivisions);
  const cellCount = mesh.positionX.length;
  const grid: SphereGrid = {
    cellCount,
    positionX: mesh.positionX,
    positionY: mesh.positionY,
    positionZ: mesh.positionZ,
    latitudeRad: new Float64Array(cellCount),
    longitudeRad: new Float64Array(cellCount),
    neighbours: new Int32Array(cellCount * MAX_NEIGHBOURS).fill(-1),
    neighbourCount: new Int32Array(cellCount),
    areaFraction: new Float64Array(cellCount),
  };
  fillSphericalCoordinates(grid);
  fillNeighbours(grid, mesh);
  fillAreaFractions(grid, mesh);
  return grid;
}

function fillSphericalCoordinates(grid: SphereGrid): void {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    grid.latitudeRad[cell] = Math.asin(grid.positionZ[cell]!);
    grid.longitudeRad[cell] = Math.atan2(grid.positionY[cell]!, grid.positionX[cell]!);
  }
}

function fillNeighbours(grid: SphereGrid, mesh: SphereMesh): void {
  for (let face = 0; face < mesh.faces.length; face += 3) {
    const corners = [mesh.faces[face]!, mesh.faces[face + 1]!, mesh.faces[face + 2]!];
    for (const corner of corners) {
      for (const other of corners) if (other !== corner) linkOnce(grid, corner, other);
    }
  }
}

function linkOnce(grid: SphereGrid, cell: number, other: number): void {
  const base = cell * MAX_NEIGHBOURS;
  const count = grid.neighbourCount[cell]!;
  for (let slot = 0; slot < count; slot++) if (grid.neighbours[base + slot] === other) return;
  if (count >= MAX_NEIGHBOURS) return;
  grid.neighbours[base + count] = other;
  grid.neighbourCount[cell] = count + 1;
}

function fillAreaFractions(grid: SphereGrid, mesh: SphereMesh): void {
  let total = 0;
  for (let face = 0; face < mesh.faces.length; face += 3) {
    const area = sphericalTriangleArea(grid, mesh, face);
    total += area;
    for (let corner = 0; corner < 3; corner++) {
      const cell = mesh.faces[face + corner]!;
      grid.areaFraction[cell] = grid.areaFraction[cell]! + area / 3;
    }
  }
  for (let cell = 0; cell < grid.cellCount; cell++) grid.areaFraction[cell] = grid.areaFraction[cell]! / total;
}

function sphericalTriangleArea(grid: SphereGrid, mesh: SphereMesh, face: number): number {
  const a = mesh.faces[face]!;
  const b = mesh.faces[face + 1]!;
  const c = mesh.faces[face + 2]!;
  const angleA = interiorAngle(grid, a, b, c);
  const angleB = interiorAngle(grid, b, c, a);
  const angleC = interiorAngle(grid, c, a, b);
  return angleA + angleB + angleC - Math.PI;
}

function interiorAngle(grid: SphereGrid, at: number, first: number, second: number): number {
  const toFirst = tangentDirection(grid, at, first);
  const toSecond = tangentDirection(grid, at, second);
  const dot = toFirst[0] * toSecond[0] + toFirst[1] * toSecond[1] + toFirst[2] * toSecond[2];
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

function tangentDirection(grid: SphereGrid, at: number, target: number): [number, number, number] {
  const ax = grid.positionX[at]!;
  const ay = grid.positionY[at]!;
  const az = grid.positionZ[at]!;
  const dx = grid.positionX[target]! - ax;
  const dy = grid.positionY[target]! - ay;
  const dz = grid.positionZ[target]! - az;
  const along = dx * ax + dy * ay + dz * az;
  return normalised(dx - along * ax, dy - along * ay, dz - along * az);
}

function normalised(x: number, y: number, z: number): [number, number, number] {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}
