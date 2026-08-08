import { equirectangularMap } from './equirectangularMap';
import { drawOrthographicGlobe } from './orthographicGlobe';
import { newDiskProjection, type DiskProjection, type GlobeRotation } from './orthographicProjection';
import { attachGlobeRotationDrag } from './globeRotationDrag';
import { drawRasterImageStretched } from './rasterCanvas';
import { colorOfCellFor, type LayerName } from './surfaceLayers';
import { climateOf, type ViewerModel } from './viewerModel';

const GLOBE_SIZE_PX = 640;
const FLAT_MAP_WIDTH_PX = 720;

export type ProjectionKind = 'globe' | 'flat';

export interface SurfaceCanvas {
  element: HTMLCanvasElement;
  draw: (model: ViewerModel, layer: LayerName, projection: ProjectionKind) => void;
}

export function newSurfaceCanvas(onRotated: () => void): SurfaceCanvas {
  const element = document.createElement('canvas');
  const context = element.getContext('2d')!;
  const rotation: GlobeRotation = { yawRad: 0, pitchRad: 0 };
  attachGlobeRotationDrag(element, rotation, onRotated);
  let projectionBuffer = newDiskProjection(0);
  return {
    element,
    draw: (model, layer, projection) => {
      projectionBuffer = bufferForGrid(projectionBuffer, model.surface.grid.cellCount);
      resizeFor(element, projection);
      drawSurface(context, model, layer, projection, rotation, projectionBuffer);
    },
  };
}

function resizeFor(element: HTMLCanvasElement, projection: ProjectionKind): void {
  const width = projection === 'globe' ? GLOBE_SIZE_PX : FLAT_MAP_WIDTH_PX;
  const height = projection === 'globe' ? GLOBE_SIZE_PX : FLAT_MAP_WIDTH_PX / 2;
  if (element.width !== width) element.width = width;
  if (element.height !== height) element.height = height;
}

function bufferForGrid(buffer: DiskProjection, cellCount: number): DiskProjection {
  return buffer.towardViewer.length === cellCount ? buffer : newDiskProjection(cellCount);
}

function drawSurface(
  context: CanvasRenderingContext2D,
  model: ViewerModel,
  layer: LayerName,
  projection: ProjectionKind,
  rotation: GlobeRotation,
  projectionBuffer: DiskProjection,
): void {
  const colorOfCell = colorOfCellFor(layer, model.surface, () => climateOf(model));
  if (projection === 'globe') {
    drawOrthographicGlobe(context, model.surface.grid, colorOfCell, rotation, projectionBuffer);
    return;
  }
  drawRasterImageStretched(
    context,
    equirectangularMap(model.surface.grid, colorOfCell, FLAT_MAP_WIDTH_PX),
  );
}
