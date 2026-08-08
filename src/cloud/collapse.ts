import { streamFor } from '../random/mulberry32';
import { ASTRONOMICAL_UNIT_M, GRAVITATIONAL_CONSTANT } from '../units/constants';
import type { MolecularCloud } from './molecularCloud';

export interface CollapsedSystem {
  starMassKg: number;
  diskMassKg: number;
  diskOuterRadiusAu: number;
  diskLifetimeMyr: number;
}

const STAR_FORMATION_EFFICIENCY = 0.3;
const DISK_MASS_FRACTION_OF_STAR = 0.02;
const DISK_LIFETIME_RANGE_MYR = [3, 10] as const;

export function collapseCloud(cloud: MolecularCloud, seed: number): CollapsedSystem {
  const random = streamFor(seed, 'collapse');
  const starMassKg = cloud.massKg * STAR_FORMATION_EFFICIENCY;
  return {
    starMassKg,
    diskMassKg: starMassKg * DISK_MASS_FRACTION_OF_STAR,
    diskOuterRadiusAu: centrifugalRadiusAu(cloud.specificAngularMomentum, starMassKg),
    diskLifetimeMyr: random.between(...DISK_LIFETIME_RANGE_MYR),
  };
}

function centrifugalRadiusAu(specificAngularMomentum: number, starMassKg: number): number {
  const radiusM = (specificAngularMomentum * specificAngularMomentum)
    / (GRAVITATIONAL_CONSTANT * starMassKg);
  return radiusM / ASTRONOMICAL_UNIT_M;
}
