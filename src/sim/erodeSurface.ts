import { areaWeightedMeanK, carbonDioxideAfterWeathering, landAreaFraction } from '../climate/carbonateSilicateThermostat';
import { greenhouseWarmingK, partialPressureBar } from '../climate/greenhouse';
import { stellarFluxWM2 } from '../climate/insolation';
import { precipitationMPerMyr } from '../climate/orographicPrecipitation';
import { surfaceTemperatureK } from '../climate/surfaceTemperature';
import { meanCellSpacingM } from '../sphere/cellSpacing';
import { routeFlow } from '../surface/flowRouting';
import { hillslopeChangeM } from '../surface/hillslopeDiffusion';
import { routeSedimentDownstream } from '../surface/sedimentTransport';
import { streamPowerErosionM } from '../surface/streamPowerIncision';
import { erodibilityField } from '../surface/weathering';
import type { PlanetSurface } from './stepPlanet';

export interface SurfaceCycleResult {
  temperatureK: Float64Array;
  precipitationMPerMyr: Float64Array;
  dischargeM3PerMyr: Float64Array;
  erodedM: Float64Array;
  depositedM: Float64Array;
  carbonDioxideMassKg: number;
}

export function runSurfaceCycle(surface: PlanetSurface, stepMyr: number): SurfaceCycleResult {
  const temperatureK = climateTemperature(surface);
  const precipitation = precipitationMPerMyr(surface.grid, {
    elevationM: surface.crust.elevationM,
    seaLevelM: surface.seaLevelM,
    temperatureK,
  });
  const eroded = erodeAndDeposit(surface, temperatureK, precipitation, stepMyr);
  return { ...eroded, carbonDioxideMassKg: thermostattedCarbonDioxide(surface, temperatureK, stepMyr) };
}

function thermostattedCarbonDioxide(
  surface: PlanetSurface,
  temperatureK: Float64Array,
  stepMyr: number,
): number {
  return carbonDioxideAfterWeathering(
    surface.carbonDioxideMassKg,
    carbonDioxidePressureBar(surface),
    areaWeightedMeanK(surface.grid, temperatureK),
    landAreaFraction(surface.grid, surface.crust.elevationM, surface.seaLevelM),
    surface.mantleVigourAt(surface.ageMyr),
    stepMyr,
  );
}

function carbonDioxidePressureBar(surface: PlanetSurface): number {
  return partialPressureBar(
    surface.carbonDioxideMassKg,
    surface.surfaceGravityMS2,
    surface.planetRadiusM,
  );
}

function climateTemperature(surface: PlanetSurface): Float64Array {
  const flux = stellarFluxWM2(surface.luminositySolar, surface.semiMajorAxisAu);
  const pressure = carbonDioxidePressureBar(surface);
  return surfaceTemperatureK(surface.grid, {
    fluxWM2: flux,
    greenhouseK: greenhouseWarmingK(pressure, surface.waterMassKg > 0),
    elevationM: surface.crust.elevationM,
    seaLevelM: surface.seaLevelM,
  });
}

function erodeAndDeposit(
  surface: PlanetSurface,
  temperatureK: Float64Array,
  precipitation: Float64Array,
  stepMyr: number,
): SurfaceCycleResult {
  const areas = cellAreasM2(surface);
  const spacing = meanCellSpacingM(surface.grid, surface.planetRadiusM);
  const network = routeFlow(
    surface.grid, surface.crust.elevationM, precipitation, areas, surface.seaLevelM,
  );
  const erodibility = erodibilityField(surface.grid, surface.crust, temperatureK, precipitation);
  const incision = streamPowerErosionM(
    surface.grid, network, surface.crust.elevationM, spacing, erodibility, stepMyr,
  );
  const hillslope = hillslopeChangeM(
    surface.grid, surface.crust.elevationM, spacing, surface.seaLevelM, stepMyr,
  );
  return applyToCrust(surface, network, incision, hillslope, areas, {
    temperatureK, precipitation,
  });
}

function applyToCrust(
  surface: PlanetSurface,
  network: ReturnType<typeof routeFlow>,
  incision: Float64Array,
  hillslope: Float64Array,
  areas: Float64Array,
  climate: { temperatureK: Float64Array; precipitation: Float64Array },
): SurfaceCycleResult {
  const eroded = new Float64Array(surface.grid.cellCount);
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    eroded[cell] = incision[cell]!;
  }
  const sediment = routeSedimentDownstream(
    surface.grid, network, eroded, areas, surface.crust.elevationM, surface.seaLevelM,
  );
  thinAndThickenCrust(surface, eroded, hillslope, sediment.depositedM);
  return {
    temperatureK: climate.temperatureK,
    precipitationMPerMyr: climate.precipitation,
    dischargeM3PerMyr: network.dischargeM3PerMyr,
    erodedM: eroded,
    depositedM: sediment.depositedM,
    carbonDioxideMassKg: surface.carbonDioxideMassKg,
  };
}

function thinAndThickenCrust(
  surface: PlanetSurface,
  eroded: Float64Array,
  hillslope: Float64Array,
  deposited: Float64Array,
): void {
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    const netM = deposited[cell]! + hillslope[cell]! - eroded[cell]!;
    surface.crust.thicknessM[cell] = Math.max(1000, surface.crust.thicknessM[cell]! + netM);
  }
}

function cellAreasM2(surface: PlanetSurface): Float64Array {
  const total = 4 * Math.PI * surface.planetRadiusM * surface.planetRadiusM;
  const areas = new Float64Array(surface.grid.cellCount);
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    areas[cell] = surface.grid.areaFraction[cell]! * total;
  }
  return areas;
}


