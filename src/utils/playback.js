import { bearingDeg } from './geo'

// Binary-searches to the two samples surrounding `startedAt + elapsedMs` and
// linearly interpolates position/speed between them, so playback moves
// smoothly even though archived trips are downsampled to ~240 points.
export function interpolatePosition(samples, startedAt, elapsedMs) {
  if (!samples.length) return null
  const targetT = startedAt + elapsedMs

  let lo = 0
  let hi = samples.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (samples[mid].t < targetT) lo = mid + 1
    else hi = mid
  }

  if (lo === 0) {
    const s = samples[0]
    return { t: s.t, lat: s.lat, lon: s.lon, speedMs: s.speedMs, bearing: null, index: 0 }
  }

  const a = samples[lo - 1]
  const b = samples[lo]
  const span = b.t - a.t
  const frac = span > 0 ? Math.max(0, Math.min(1, (targetT - a.t) / span)) : 1

  const hasCoords = a.lat != null && a.lon != null && b.lat != null && b.lon != null
  const lat = hasCoords ? a.lat + (b.lat - a.lat) * frac : (b.lat ?? a.lat ?? null)
  const lon = hasCoords ? a.lon + (b.lon - a.lon) * frac : (b.lon ?? a.lon ?? null)
  const speedMs = a.speedMs + (b.speedMs - a.speedMs) * frac
  const bearing = hasCoords ? bearingDeg(a.lat, a.lon, b.lat, b.lon) : null

  return { t: targetT, lat, lon, speedMs, bearing, index: lo }
}
