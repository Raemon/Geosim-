import type { ControlActions, ControlSettings } from './controlPanel';
import { advanceOneStep, newViewerModel, type ViewerModel } from './viewerModel';

const OPENING_SETTINGS: ControlSettings = {
  seed: 1,
  subdivisions: 5,
  layer: 'elevation',
  projection: 'globe',
};

export interface ViewerSession {
  settings: ControlSettings;
  model: ViewerModel;
  playing: boolean;
  needsRedraw: boolean;
}

export function newViewerSession(): ViewerSession {
  return {
    settings: { ...OPENING_SETTINGS },
    model: newViewerModel(OPENING_SETTINGS.seed, OPENING_SETTINGS.subdivisions),
    playing: false,
    needsRedraw: true,
  };
}

export function viewerActions(session: ViewerSession): ControlActions {
  return {
    togglePlaying: () => { session.playing = !session.playing; },
    stepOnce: () => { advanceOneStep(session.model); session.needsRedraw = true; },
    reset: () => rebuildWorld(session),
    chooseSeed: (seed) => { session.settings.seed = seed; rebuildWorld(session); },
    chooseSubdivisions: (subdivisions) => {
      session.settings.subdivisions = subdivisions;
      rebuildWorld(session);
    },
    chooseLayer: (layer) => { session.settings.layer = layer; session.needsRedraw = true; },
    chooseProjection: (projection) => {
      session.settings.projection = projection;
      session.needsRedraw = true;
    },
  };
}

function rebuildWorld(session: ViewerSession): void {
  session.playing = false;
  session.model = newViewerModel(session.settings.seed, session.settings.subdivisions);
  session.needsRedraw = true;
}
