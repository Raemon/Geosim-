export interface RadialGrid {
  cellCount: number;
  radiusAu: Float64Array;
  innerEdgeAu: Float64Array;
  outerEdgeAu: Float64Array;
  annulusAreaAu2: Float64Array;
}

const INNERMOST_RADIUS_AU = 0.08;

export function logarithmicRadialGrid(outerRadiusAu: number, cellCount: number): RadialGrid {
  const edges = logarithmicEdges(INNERMOST_RADIUS_AU, outerRadiusAu, cellCount);
  const grid: RadialGrid = {
    cellCount,
    radiusAu: new Float64Array(cellCount),
    innerEdgeAu: new Float64Array(cellCount),
    outerEdgeAu: new Float64Array(cellCount),
    annulusAreaAu2: new Float64Array(cellCount),
  };
  for (let cell = 0; cell < cellCount; cell++) fillCell(grid, edges, cell);
  return grid;
}

function logarithmicEdges(innerAu: number, outerAu: number, cellCount: number): Float64Array {
  const edges = new Float64Array(cellCount + 1);
  const ratio = Math.log(outerAu / innerAu) / cellCount;
  for (let edge = 0; edge <= cellCount; edge++) edges[edge] = innerAu * Math.exp(ratio * edge);
  return edges;
}

function fillCell(grid: RadialGrid, edges: Float64Array, cell: number): void {
  const inner = edges[cell]!;
  const outer = edges[cell + 1]!;
  grid.innerEdgeAu[cell] = inner;
  grid.outerEdgeAu[cell] = outer;
  grid.radiusAu[cell] = Math.sqrt(inner * outer);
  grid.annulusAreaAu2[cell] = Math.PI * (outer * outer - inner * inner);
}

export function cellContaining(grid: RadialGrid, radiusAu: number): number {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (radiusAu < grid.outerEdgeAu[cell]!) return cell;
  }
  return grid.cellCount - 1;
}
