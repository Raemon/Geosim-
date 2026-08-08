import { mkdirSync, writeFileSync } from 'node:fs';
import { rockyPlanetFrom, type RockyPlanet } from '../src/planet/planetBody';
import { formSystem } from '../src/sim/formSystem';
import { newPlanetSurface } from '../src/sim/newPlanetSurface';
import { stepPlanet, STEP_MYR, type PlanetSurface } from '../src/sim/stepPlanet';
import { isContinental } from '../src/tectonics/crustState';
import { EARTH_MASS_KG, EARTH_OCEAN_MASS_KG } from '../src/units/constants';
import { categoricalColor, hypsometricColor, sequentialColor } from '../src/view/colorRamps';
import { equirectangularMap } from '../src/view/equirectangularMap';
import { runSurfaceCycle } from '../src/sim/erodeSurface';
import { pngBuffer } from './writePng';

const OUTPUT_DIRECTORY = 'frames';
const IMAGE_WIDTH = 1024;
const SUBDIVISIONS = 6;
const AGES_TO_RENDER_MYR = [200, 1000, 2000, 3000, 4000];

const LAYERS = {
  elevation: (surface: PlanetSurface) => (cell: number) =>
    hypsometricColor(surface.crust.elevationM[cell]!, surface.seaLevelM),
  plates: (surface: PlanetSurface) => (cell: number) => categoricalColor(surface.plateOf[cell]!),
  crustAge: (surface: PlanetSurface) => (cell: number) =>
    sequentialColor(1 - Math.min(1, surface.crust.ageMyr[cell]! / 200)),
  temperature: (surface: PlanetSurface) => {
    const climate = runSurfaceCycle(surface, 0);
    return (cell: number) => sequentialColor((climate.temperatureK[cell]! - 220) / 130);
  },
  rainfall: (surface: PlanetSurface) => {
    const climate = runSurfaceCycle(surface, 0);
    return (cell: number) => sequentialColor(climate.precipitationMPerMyr[cell]! / 6e5);
  },
  discharge: (surface: PlanetSurface) => {
    const climate = runSurfaceCycle(surface, 0);
    return (cell: number) => sequentialColor(Math.log10(1 + climate.dischargeM3PerMyr[cell]!) / 16);
  },
} as const;

main();

function main(): void {
  const seed = numberArgument('--seed', 1);
  const planet = wateredEarthMassPlanet(seed);
  mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  reportPlanet(planet);
  renderRun(planet, seed);
}

function renderRun(planet: RockyPlanet, seed: number): void {
  let surface = newPlanetSurface(planet, seed, SUBDIVISIONS);
  const finalAge = AGES_TO_RENDER_MYR[AGES_TO_RENDER_MYR.length - 1]!;
  while (surface.ageMyr < finalAge) {
    surface = stepPlanet(surface);
    if (AGES_TO_RENDER_MYR.includes(surface.ageMyr)) writeLayers(surface);
  }
}

function writeLayers(surface: PlanetSurface): void {
  for (const [name, colorFor] of Object.entries(LAYERS)) {
    const image = equirectangularMap(surface.grid, colorFor(surface), IMAGE_WIDTH);
    const path = `${OUTPUT_DIRECTORY}/${name}-${String(surface.ageMyr).padStart(4, '0')}Myr.png`;
    writeFileSync(path, pngBuffer(image));
  }
  reportSurface(surface);
}

function reportPlanet(planet: RockyPlanet): void {
  process.stdout.write(
    `planet ${(planet.massKg / EARTH_MASS_KG).toFixed(2)} earth masses, `
    + `${(planet.radiusM / 1000).toFixed(0)} km radius, `
    + `${(planet.volatiles.waterMassKg / EARTH_OCEAN_MASS_KG).toFixed(2)} earth oceans, `
    + `${(planet.radiogenicHeatWattsAt(4570) / 1e12).toFixed(1)} TW radiogenic today\n`,
  );
}

function reportSurface(surface: PlanetSurface): void {
  let continental = 0;
  let submerged = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (isContinental(surface.crust, cell)) continental += surface.grid.areaFraction[cell]!;
    if (surface.crust.elevationM[cell]! < surface.seaLevelM) submerged += surface.grid.areaFraction[cell]!;
  }
  process.stdout.write(
    `${String(surface.ageMyr).padStart(4)} Myr  `
    + `continental ${(continental * 100).toFixed(1)}%  `
    + `ocean ${(submerged * 100).toFixed(1)}%  `
    + `sea level ${surface.seaLevelM.toFixed(0)} m\n`,
  );
}

function wateredEarthMassPlanet(seed: number): RockyPlanet {
  const candidates = Array.from({ length: 40 }, (_ignored, index) => seed + index)
    .flatMap((candidateSeed) => {
      const system = formSystem(candidateSeed);
      return system.planets
        .filter((planet) => planet.kind === 'rocky' && planet.semiMajorAxisAu < system.snowLineAu)
        .map(rockyPlanetFrom)
        .filter((planet) => planet.volatiles.waterMassKg > 0);
    });
  return candidates.sort(
    (a, b) => Math.abs(a.massKg - EARTH_MASS_KG) - Math.abs(b.massKg - EARTH_MASS_KG),
  )[0]!;
}

function numberArgument(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) return fallback;
  return Number(process.argv[index + 1]) || fallback;
}

export { STEP_MYR };
