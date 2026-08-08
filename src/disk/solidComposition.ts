import type { ElementAmounts } from '../cloud/elementAbundances';
import { totalSpecies, type SpeciesAmounts } from './condensateSpecies';
import { solidSpeciesAt } from './condensationSequence';
import { midplaneTemperatureK } from './midplaneTemperature';
import { partitionElementsIntoSpecies, speciesMassesFrom } from './partitionElements';
import type { RadialGrid } from './radialGrid';
import { gasSurfaceDensityKgM2 } from './surfaceDensity';

export interface DiskSolids {
  temperatureK: Float64Array;
  gasSurfaceDensityKgM2: Float64Array;
  solidSurfaceDensityKgM2: Float64Array;
  solidFractionOfTotal: Float64Array;
  speciesAtRadius: SpeciesAmounts[];
}

export interface DiskConditions {
  grid: RadialGrid;
  diskMassKg: number;
  diskOuterRadiusAu: number;
  luminositySolar: number;
  diskAgeMyr: number;
  elementMassFractions: ElementAmounts;
}

export function diskSolids(conditions: DiskConditions): DiskSolids {
  const allSpecies = speciesMassesFrom(partitionElementsIntoSpecies(conditions.elementMassFractions));
  const temperatureK = midplaneTemperatureK(
    conditions.grid,
    conditions.luminositySolar,
    conditions.diskAgeMyr,
  );
  const gas = gasSurfaceDensityKgM2(
    conditions.grid,
    conditions.diskMassKg,
    conditions.diskOuterRadiusAu,
  );
  return solidsFromTemperature(conditions.grid, allSpecies, temperatureK, gas);
}

function solidsFromTemperature(
  grid: RadialGrid,
  allSpecies: SpeciesAmounts,
  temperatureK: Float64Array,
  gas: Float64Array,
): DiskSolids {
  const solids: DiskSolids = {
    temperatureK,
    gasSurfaceDensityKgM2: gas,
    solidSurfaceDensityKgM2: new Float64Array(grid.cellCount),
    solidFractionOfTotal: new Float64Array(grid.cellCount),
    speciesAtRadius: [],
  };
  for (let cell = 0; cell < grid.cellCount; cell++) {
    fillSolidCell(solids, allSpecies, cell);
  }
  return solids;
}

function fillSolidCell(solids: DiskSolids, allSpecies: SpeciesAmounts, cell: number): void {
  const solid = solidSpeciesAt(allSpecies, solids.temperatureK[cell]!);
  const fraction = totalSpecies(solid);
  solids.speciesAtRadius.push(solid);
  solids.solidFractionOfTotal[cell] = fraction;
  solids.solidSurfaceDensityKgM2[cell] = solids.gasSurfaceDensityKgM2[cell]! * fraction;
}
