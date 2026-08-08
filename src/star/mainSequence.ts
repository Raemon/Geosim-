import {
  SOLAR_EFFECTIVE_TEMPERATURE_K,
  SOLAR_LUMINOSITY_W,
  SOLAR_MASS_KG,
  SOLAR_RADIUS_M,
  SUN_AGE_MYR,
} from '../units/constants';

export interface Star {
  massSolar: number;
  luminositySolar: number;
  radiusSolar: number;
  effectiveTemperatureK: number;
  mainSequenceLifetimeMyr: number;
}

const LOW_MASS_BREAK_SOLAR = 0.43;
const SOLAR_LIFETIME_MYR = 10000;

export function starOfMass(massKg: number): Star {
  const massSolar = massKg / SOLAR_MASS_KG;
  const luminositySolar = luminosityOf(massSolar);
  const radiusSolar = radiusOf(massSolar);
  return {
    massSolar,
    luminositySolar,
    radiusSolar,
    effectiveTemperatureK: effectiveTemperatureOf(luminositySolar, radiusSolar),
    mainSequenceLifetimeMyr: SOLAR_LIFETIME_MYR * Math.pow(massSolar, -2.5),
  };
}

function luminosityOf(massSolar: number): number {
  if (massSolar < LOW_MASS_BREAK_SOLAR) return 0.23 * Math.pow(massSolar, 2.3);
  return Math.pow(massSolar, 3.5);
}

function radiusOf(massSolar: number): number {
  return massSolar < 1 ? Math.pow(massSolar, 0.8) : Math.pow(massSolar, 0.57);
}

function effectiveTemperatureOf(luminositySolar: number, radiusSolar: number): number {
  return SOLAR_EFFECTIVE_TEMPERATURE_K
    * Math.pow(luminositySolar / (radiusSolar * radiusSolar), 0.25);
}

export function luminosityWatts(star: Star): number {
  return star.luminositySolar * SOLAR_LUMINOSITY_W;
}

export function radiusMetres(star: Star): number {
  return star.radiusSolar * SOLAR_RADIUS_M;
}

export function ageFractionOfLifetime(star: Star, ageMyr: number): number {
  return ageMyr / star.mainSequenceLifetimeMyr;
}

export const SOLAR_AGE_FRACTION_TODAY = SUN_AGE_MYR / SOLAR_LIFETIME_MYR;
