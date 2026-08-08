export interface SphereMesh {
  positionX: Float64Array;
  positionY: Float64Array;
  positionZ: Float64Array;
  faces: Int32Array;
}

interface MeshBuilder {
  x: number[];
  y: number[];
  z: number[];
  midpoints: Map<number, number>;
}

export function icosphere(subdivisions: number): SphereMesh {
  const builder = icosahedronBuilder();
  let faces = ICOSAHEDRON_FACES.slice();
  for (let level = 0; level < subdivisions; level++) faces = subdivideFaces(builder, faces);
  return {
    positionX: Float64Array.from(builder.x),
    positionY: Float64Array.from(builder.y),
    positionZ: Float64Array.from(builder.z),
    faces: Int32Array.from(faces),
  };
}

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

const ICOSAHEDRON_VERTICES: readonly (readonly [number, number, number])[] = [
  [-1, GOLDEN_RATIO, 0], [1, GOLDEN_RATIO, 0], [-1, -GOLDEN_RATIO, 0], [1, -GOLDEN_RATIO, 0],
  [0, -1, GOLDEN_RATIO], [0, 1, GOLDEN_RATIO], [0, -1, -GOLDEN_RATIO], [0, 1, -GOLDEN_RATIO],
  [GOLDEN_RATIO, 0, -1], [GOLDEN_RATIO, 0, 1], [-GOLDEN_RATIO, 0, -1], [-GOLDEN_RATIO, 0, 1],
];

const ICOSAHEDRON_FACES: readonly number[] = [
  0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
  1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
  3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
  4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
];

function icosahedronBuilder(): MeshBuilder {
  const builder: MeshBuilder = { x: [], y: [], z: [], midpoints: new Map() };
  for (const vertex of ICOSAHEDRON_VERTICES) pushNormalised(builder, vertex[0], vertex[1], vertex[2]);
  return builder;
}

function pushNormalised(builder: MeshBuilder, x: number, y: number, z: number): number {
  const length = Math.hypot(x, y, z);
  builder.x.push(x / length);
  builder.y.push(y / length);
  builder.z.push(z / length);
  return builder.x.length - 1;
}

function subdivideFaces(builder: MeshBuilder, faces: readonly number[]): number[] {
  const next: number[] = [];
  for (let face = 0; face < faces.length; face += 3) {
    const a = faces[face]!;
    const b = faces[face + 1]!;
    const c = faces[face + 2]!;
    const ab = midpointIndex(builder, a, b);
    const bc = midpointIndex(builder, b, c);
    const ca = midpointIndex(builder, c, a);
    next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
  }
  return next;
}

function midpointIndex(builder: MeshBuilder, a: number, b: number): number {
  const key = a < b ? a * 1e7 + b : b * 1e7 + a;
  const existing = builder.midpoints.get(key);
  if (existing !== undefined) return existing;
  const created = pushNormalised(
    builder,
    builder.x[a]! + builder.x[b]!,
    builder.y[a]! + builder.y[b]!,
    builder.z[a]! + builder.z[b]!,
  );
  builder.midpoints.set(key, created);
  return created;
}
