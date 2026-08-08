import { SOLAR_LUMINOSITY_W, ASTRONOMICAL_UNIT_M, STEFAN_BOLTZMANN } from '../units/constants';

export function stellarFluxWM2(luminositySolar: number, semiMajorAxisAu: number): number {
  const distanceM = semiMajorAxisAu * ASTRONOMICAL_UNIT_M;
  return (luminositySolar * SOLAR_LUMINOSITY_W) / (4 * Math.PI * distanceM * distanceM);
}

export function equilibriumTemperatureK(fluxWM2: number, albedo: number): number {
  return Math.pow((fluxWM2 * (1 - albedo)) / (4 * STEFAN_BOLTZMANN), 0.25);
}

const EQUATOR_TO_POLE_CONTRAST = 0.55;

export function latitudeInsolationFactor(latitudeRad: number): number {
  const normalised = Math.cos(latitudeRad);
  return 1 - EQUATOR_TO_POLE_CONTRAST * (1 - normalised);
}
