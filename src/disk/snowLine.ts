import { condensateById } from './condensateSpecies';
import { combinedTemperatureAt } from './midplaneTemperature';

const SEARCH_INNER_AU = 0.05;
const SEARCH_OUTER_AU = 500;
const BISECTION_STEPS = 60;

export function snowLineAu(luminositySolar: number, diskAgeMyr: number): number {
  return radiusWhereTemperatureFallsBelow(
    condensateById('waterIce').condensationK,
    luminositySolar,
    diskAgeMyr,
  );
}

export function radiusWhereTemperatureFallsBelow(
  targetK: number,
  luminositySolar: number,
  diskAgeMyr: number,
): number {
  let inner = SEARCH_INNER_AU;
  let outer = SEARCH_OUTER_AU;
  for (let step = 0; step < BISECTION_STEPS; step++) {
    const middle = Math.sqrt(inner * outer);
    if (combinedTemperatureAt(middle, luminositySolar, diskAgeMyr) > targetK) inner = middle;
    else outer = middle;
  }
  return Math.sqrt(inner * outer);
}
