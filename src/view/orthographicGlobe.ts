import type { SphereGrid } from '../sphere/sphereGrid';
import type { Rgb } from './colorRamps';
import { cssColor } from './cssColor';
import { projectOntoDisk, type DiskProjection, type GlobeRotation } from './orthographicProjection';

const CELL_OVERDRAW = 1.6;
const DISK_MARGIN_FRACTION = 0.96;
const SPACE_COLOR = '#05070c';
const LIMB_COLOR = '#2a3444';

interface GlobeDisk {
  centreXPx: number;
  centreYPx: number;
  radiusPx: number;
}

export function drawOrthographicGlobe(
  context: CanvasRenderingContext2D,
  grid: SphereGrid,
  colorOfCell: (cell: number) => Rgb,
  rotation: GlobeRotation,
  projection: DiskProjection,
): void {
  projectOntoDisk(grid, rotation, projection);
  const disk = diskFilling(context.canvas);
  clearToSpace(context);
  context.save();
  clipToDisk(context, disk);
  paintCellsFacingViewer(context, grid, colorOfCell, projection, disk);
  context.restore();
  strokeLimb(context, disk);
}

function diskFilling(canvas: HTMLCanvasElement): GlobeDisk {
  return {
    centreXPx: canvas.width / 2,
    centreYPx: canvas.height / 2,
    radiusPx: (Math.min(canvas.width, canvas.height) / 2) * DISK_MARGIN_FRACTION,
  };
}

function clearToSpace(context: CanvasRenderingContext2D): void {
  context.fillStyle = SPACE_COLOR;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

function clipToDisk(context: CanvasRenderingContext2D, disk: GlobeDisk): void {
  context.beginPath();
  context.arc(disk.centreXPx, disk.centreYPx, disk.radiusPx, 0, 2 * Math.PI);
  context.clip();
}

function strokeLimb(context: CanvasRenderingContext2D, disk: GlobeDisk): void {
  context.beginPath();
  context.arc(disk.centreXPx, disk.centreYPx, disk.radiusPx, 0, 2 * Math.PI);
  context.strokeStyle = LIMB_COLOR;
  context.stroke();
}

function paintCellsFacingViewer(
  context: CanvasRenderingContext2D,
  grid: SphereGrid,
  colorOfCell: (cell: number) => Rgb,
  projection: DiskProjection,
  disk: GlobeDisk,
): void {
  const sidePx = cellSidePx(grid.cellCount, disk.radiusPx);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (projection.towardViewer[cell]! <= 0) continue;
    context.fillStyle = cssColor(colorOfCell(cell));
    const x = disk.centreXPx + projection.rightOfCentre[cell]! * disk.radiusPx;
    const y = disk.centreYPx + projection.belowCentre[cell]! * disk.radiusPx;
    context.fillRect(x - sidePx / 2, y - sidePx / 2, sidePx, sidePx);
  }
}

function cellSidePx(cellCount: number, radiusPx: number): number {
  return radiusPx * Math.sqrt((4 * Math.PI) / cellCount) * CELL_OVERDRAW;
}
