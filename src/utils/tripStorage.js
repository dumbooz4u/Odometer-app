import { readJSON, writeJSON } from './storage'

const TRIPS_KEY = 'odometer.trips'
// Archived trips keep a downsampled chart, not the full 1Hz sample stream,
// so a long history of trips doesn't blow past localStorage's quota.
const MAX_ARCHIVED_SAMPLES = 240
// Backstop on trip count, independent of per-trip size.
const MAX_TRIPS = 200

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function loadTrips() {
  return readJSON(localStorage, TRIPS_KEY, [])
}

export function saveTrip(trip) {
  const trips = loadTrips()
  trips.unshift({ ...trip, id: makeId() })
  writeJSON(localStorage, TRIPS_KEY, trips.slice(0, MAX_TRIPS))
}

export function deleteTrip(id) {
  const trips = loadTrips().filter((t) => t.id !== id)
  writeJSON(localStorage, TRIPS_KEY, trips)
}

export { MAX_ARCHIVED_SAMPLES }
