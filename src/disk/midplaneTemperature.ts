import type { RadialGrid } from './radialGrid';

const IRRADIATION_TEMPERATURE_AT_ONE_AU = 280;
const IRRADIATION_EXPONENT = 0.5;
const VISCOUS_TEMPERATURE_AT_ONE_AU = 700;
const VISCOUS_EXPONENT = 0.9;
const VISCOUS_DECAY_MYR = 0.5;

export function midplaneTemperatureK(
  grid: RadialGrid,
  luminositySolar: number,
  diskAgeMyr: number,
): Float64Array {
  const temperature = new Float64Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) {
    temperature[cell] = combinedTemperatureAt(grid.radiusAu[cell]!, luminositySolar, diskAgeMyr);
  }
  return temperature;
}

export function combinedTemperatureAt(
  radiusAu: number,
  luminositySolar: number,
  diskAgeMyr: number,
): number {
  const irradiation = irradiationTemperatureAt(radiusAu, luminositySolar);
  const viscous = viscousTemperatureAt(radiusAu, diskAgeMyr);
  return Math.pow(Math.pow(irradiation, 4) + Math.pow(viscous, 4), 0.25);
}

function irradiationTemperatureAt(radiusAu: number, luminositySolar: number): number {
  return IRRADIATION_TEMPERATURE_AT_ONE_AU
    * Math.pow(luminositySolar, 0.25)
    * Math.pow(radiusAu, -IRRADIATION_EXPONENT);
}

function viscousTemperatureAt(radiusAu: number, diskAgeMyr: number): number {
  return VISCOUS_TEMPERATURE_AT_ONE_AU
    * Math.pow(radiusAu, -VISCOUS_EXPONENT)
    * Math.exp(-diskAgeMyr / VISCOUS_DECAY_MYR);
}
