const SUBSIDENCE_COEFFICIENT_M_PER_ROOT_MYR = 350;
const PLATE_EQUILIBRIUM_AGE_MYR = 80;

export function thermalSubsidenceM(ageMyr: number): number {
  const effectiveAge = Math.min(Math.max(ageMyr, 0), PLATE_EQUILIBRIUM_AGE_MYR);
  return SUBSIDENCE_COEFFICIENT_M_PER_ROOT_MYR * Math.sqrt(effectiveAge);
}
