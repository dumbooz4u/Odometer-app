import { readJSON } from './storage'
import { VEHICLE_ICONS } from './vehicleIcons'

export const VEHICLE_STORAGE_KEY = 'odometer.vehicleIcon'
export const UNIT_STORAGE_KEY = 'odometer.unit'

export function loadStoredVehicleIcon() {
  const stored = readJSON(localStorage, VEHICLE_STORAGE_KEY, null)
  return VEHICLE_ICONS.some((v) => v.emoji === stored) ? stored : VEHICLE_ICONS[0].emoji
}

export function loadStoredUnit() {
  const stored = readJSON(localStorage, UNIT_STORAGE_KEY, 'kmh')
  return stored === 'mph' ? 'mph' : 'kmh'
}
