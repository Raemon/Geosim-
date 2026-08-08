import { EARTH_MASS_KG, EARTH_OCEAN_MASS_KG } from '../units/constants';
import { fieldset } from './formControls';
import { surfaceAreaFractions } from './surfaceStatistics';
import type { ViewerModel } from './viewerModel';

export interface ReadoutPanel {
  element: HTMLElement;
  show: (model: ViewerModel) => void;
}

export function newReadoutPanel(): ReadoutPanel {
  const surfaceGrid = readoutGrid();
  const planetGrid = readoutGrid();
  const element = document.createElement('div');
  element.append(fieldset('surface', surfaceGrid), fieldset('planet', planetGrid));
  return {
    element,
    show: (model) => {
      fillRows(surfaceGrid, surfaceRows(model));
      fillRows(planetGrid, planetRows(model));
    },
  };
}

function readoutGrid(): HTMLDivElement {
  const element = document.createElement('div');
  element.className = 'readout';
  return element;
}

function fillRows(grid: HTMLDivElement, rows: readonly (readonly [string, string])[]): void {
  grid.replaceChildren();
  for (const [name, value] of rows) {
    grid.append(textSpan(name), textSpan(value));
  }
}

function textSpan(text: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.textContent = text;
  return element;
}

function surfaceRows(model: ViewerModel): readonly (readonly [string, string])[] {
  const areas = surfaceAreaFractions(model.surface);
  return [
    ['age', `${model.surface.ageMyr} Myr`],
    ['sea level', `${model.surface.seaLevelM.toFixed(0)} m`],
    ['continental', `${(areas.continental * 100).toFixed(1)} %`],
    ['ocean', `${(areas.submerged * 100).toFixed(1)} %`],
  ];
}

function planetRows(model: ViewerModel): readonly (readonly [string, string])[] {
  const planet = model.planet;
  return [
    ['mass', `${(planet.massKg / EARTH_MASS_KG).toFixed(2)} earths`],
    ['radius', `${(planet.radiusM / 1000).toFixed(0)} km`],
    ['water', `${(planet.volatiles.waterMassKg / EARTH_OCEAN_MASS_KG).toFixed(2)} oceans`],
    ['radiogenic', `${(planet.radiogenicHeatWattsAt(model.surface.ageMyr) / 1e12).toFixed(1)} TW`],
    ['orbit', `${planet.semiMajorAxisAu.toFixed(2)} AU`],
  ];
}
