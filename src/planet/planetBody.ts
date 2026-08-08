import type { Planet } from '../accretion/gasCapture';
import { EARTH_MASS_KG, EARTH_RADIUS_M, GRAVITATIONAL_CONSTANT } from '../units/constants';
import { differentiateByDensity, type DifferentiatedInterior } from './coreFormation';
import { degasVolatiles, type VolatileInventory } from './degassing';
import { mantleMineralogyOf, type MantleMineralogy } from './mantleMineralogy';
import { radiogenicHeatWatts } from './radiogenicHeat';

export interface RockyPlanet {
  semiMajorAxisAu: number;
  massKg: number;
  radiusM: number;
  surfaceGravityMS2: number;
  interior: DifferentiatedInterior;
  mineralogy: MantleMineralogy;
  volatiles: VolatileInventory;
  radiogenicHeatWattsAt: (ageMyr: number) => number;
}

const ROCKY_MASS_RADIUS_EXPONENT = 0.27;

export function rockyPlanetFrom(planet: Planet): RockyPlanet {
  const radiusM = rockyRadiusM(planet.massKg);
  return {
    semiMajorAxisAu: planet.semiMajorAxisAu,
    massKg: planet.massKg,
    radiusM,
    surfaceGravityMS2: GRAVITATIONAL_CONSTANT * planet.massKg / (radiusM * radiusM),
    interior: differentiateByDensity(planet.species),
    mineralogy: mantleMineralogyOf(planet.species),
    volatiles: degasVolatiles(planet.species),
    radiogenicHeatWattsAt: (ageMyr) => radiogenicHeatWatts(planet.species, ageMyr),
  };
}

function rockyRadiusM(massKg: number): number {
  return EARTH_RADIUS_M * Math.pow(massKg / EARTH_MASS_KG, ROCKY_MASS_RADIUS_EXPONENT);
}

export function meanDensityKgM3(planet: RockyPlanet): number {
  return planet.massKg / ((4 / 3) * Math.PI * Math.pow(planet.radiusM, 3));
}

export function oceanDepthIfSpreadEvenlyM(planet: RockyPlanet): number {
  const oceanVolumeM3 = planet.volatiles.waterMassKg / 1000;
  return oceanVolumeM3 / (4 * Math.PI * planet.radiusM * planet.radiusM);
}
