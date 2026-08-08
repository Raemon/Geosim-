import { button, fieldset, labelledRow, numberField, row, selector } from './formControls';
import type { ProjectionKind } from './surfaceCanvas';
import { LAYER_NAMES, type LayerName } from './surfaceLayers';

const SUBDIVISION_CHOICES = ['3', '4', '5', '6'] as const;
const PROJECTION_CHOICES = ['globe', 'flat'] as const;

export interface ControlSettings {
  seed: number;
  subdivisions: number;
  layer: LayerName;
  projection: ProjectionKind;
}

export interface ControlActions {
  togglePlaying: () => void;
  stepOnce: () => void;
  reset: () => void;
  chooseSeed: (seed: number) => void;
  chooseSubdivisions: (subdivisions: number) => void;
  chooseLayer: (layer: LayerName) => void;
  chooseProjection: (projection: ProjectionKind) => void;
}

export function newControlPanel(
  settings: ControlSettings,
  actions: ControlActions,
  isPlaying: () => boolean,
): HTMLElement {
  function relabel(): void {
    playButton.textContent = isPlaying() ? 'pause' : 'play';
  }
  const playButton = button('play', () => { actions.togglePlaying(); relabel(); });
  const element = document.createElement('div');
  element.append(
    fieldset('time', row(
      playButton,
      button('step', actions.stepOnce),
      button('reset', () => { actions.reset(); relabel(); }),
    )),
    worldFieldset(settings, actions),
    viewFieldset(settings, actions),
  );
  return element;
}

function worldFieldset(settings: ControlSettings, actions: ControlActions): HTMLFieldSetElement {
  return fieldset(
    'world',
    labelledRow('seed', numberField(settings.seed, actions.chooseSeed)),
    labelledRow('subdivisions', selector(
      SUBDIVISION_CHOICES,
      String(settings.subdivisions),
      (value) => actions.chooseSubdivisions(Number(value)),
    )),
  );
}

function viewFieldset(settings: ControlSettings, actions: ControlActions): HTMLFieldSetElement {
  return fieldset(
    'view',
    labelledRow('layer', selector(
      LAYER_NAMES,
      settings.layer,
      (value) => actions.chooseLayer(value as LayerName),
    )),
    labelledRow('projection', selector(
      PROJECTION_CHOICES,
      settings.projection,
      (value) => actions.chooseProjection(value as ProjectionKind),
    )),
  );
}
