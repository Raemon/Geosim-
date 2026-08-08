import { ASTRONOMICAL_UNIT_M } from '../units/constants';

export const FEEDING_ZONE_HILL_RADII = 10;

export function hillRadiusAu(massKg: number, radiusAu: number, starMassKg: number): number {
  return radiusAu * Math.cbrt(massKg / (3 * starMassKg));
}

export function isolationMassKg(
  radiusAu: number,
  solidSurfaceDensityKgM2: number,
  starMassKg: number,
): number {
  const radiusM = radiusAu * ASTRONOMICAL_UNIT_M;
  const annulus = 2 * Math.PI * FEEDING_ZONE_HILL_RADII * radiusM * radiusM * solidSurfaceDensityKgM2;
  if (annulus <= 0) return 0;
  return Math.pow(annulus, 1.5) / Math.sqrt(3 * starMassKg);
}

export function mutualHillRadiusAu(
  massA: number,
  massB: number,
  radiusA: number,
  radiusB: number,
  starMassKg: number,
): number {
  const meanRadius = 0.5 * (radiusA + radiusB);
  return meanRadius * Math.cbrt((massA + massB) / (3 * starMassKg));
}

export function separationInMutualHillRadii(
  massA: number,
  massB: number,
  radiusA: number,
  radiusB: number,
  starMassKg: number,
): number {
  const hill = mutualHillRadiusAu(massA, massB, radiusA, radiusB, starMassKg);
  return hill > 0 ? Math.abs(radiusB - radiusA) / hill : Infinity;
}
