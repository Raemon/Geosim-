import { newControlPanel } from './controlPanel';
import { newReadoutPanel, type ReadoutPanel } from './readoutPanel';
import { newSurfaceCanvas, type SurfaceCanvas } from './surfaceCanvas';
import { advanceOneStep } from './viewerModel';
import { newViewerSession, viewerActions, type ViewerSession } from './viewerSession';

export function mountViewer(root: HTMLElement): void {
  const session = newViewerSession();
  const canvas = newSurfaceCanvas(() => { session.needsRedraw = true; });
  const readout = newReadoutPanel();
  const controls = newControlPanel(session.settings, viewerActions(session), () => session.playing);
  root.append(viewerLayout(canvas.element, sidePanel(controls, readout.element)));
  startRedrawLoop(session, canvas, readout);
}

function viewerLayout(canvas: HTMLCanvasElement, side: HTMLElement): HTMLElement {
  const element = document.createElement('div');
  element.className = 'viewer';
  element.append(canvas, side);
  return element;
}

function sidePanel(controls: HTMLElement, readout: HTMLElement): HTMLElement {
  const element = document.createElement('div');
  element.className = 'panel';
  element.append(controls, readout);
  return element;
}

function startRedrawLoop(
  session: ViewerSession,
  canvas: SurfaceCanvas,
  readout: ReadoutPanel,
): void {
  const frame = (): void => {
    if (session.playing) {
      advanceOneStep(session.model);
      session.needsRedraw = true;
    }
    if (session.needsRedraw) redraw(session, canvas, readout);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function redraw(session: ViewerSession, canvas: SurfaceCanvas, readout: ReadoutPanel): void {
  session.needsRedraw = false;
  canvas.draw(session.model, session.settings.layer, session.settings.projection);
  readout.show(session.model);
}
