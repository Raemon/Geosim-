import type { GlobeRotation } from './orthographicProjection';

const RADIANS_PER_PIXEL = 0.008;
const MAX_PITCH_RAD = Math.PI / 2;

export function attachGlobeRotationDrag(
  canvas: HTMLCanvasElement,
  rotation: GlobeRotation,
  onRotated: () => void,
): void {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointerup', (event) => {
    dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    turn(rotation, event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
    onRotated();
  });
}

function turn(rotation: GlobeRotation, movedXPx: number, movedYPx: number): void {
  rotation.yawRad -= movedXPx * RADIANS_PER_PIXEL;
  rotation.pitchRad = clampedPitch(rotation.pitchRad + movedYPx * RADIANS_PER_PIXEL);
}

function clampedPitch(pitchRad: number): number {
  return Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, pitchRad));
}
