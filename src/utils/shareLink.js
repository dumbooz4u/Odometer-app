import { encodeCompact, decodeCompact } from './compression'

export const SHARE_TTL_MS = 24 * 60 * 60 * 1000

function toCompactSamples(samples, startedAt) {
  return samples.map((s) => [Math.round((s.t - startedAt) / 1000), Math.round(s.speedMs * 10) / 10])
}

function fromCompactSamples(compact, startedAt) {
  return compact.map(([elapsedSec, speedMs]) => ({ t: startedAt + elapsedSec * 1000, speedMs }))
}

export async function encodeTripShare(trip, unit) {
  const payload = {
    v: 1,
    n: trip.name,
    st: trip.startedAt,
    et: trip.endedAt,
    d: trip.distanceMeters,
    m: trip.maxSpeedMs,
    sp: trip.startPlace,
    ep: trip.endPlace,
    u: unit,
    sa: Date.now(),
    s: toCompactSamples(trip.samples, trip.startedAt),
  }
  return encodeCompact(payload)
}

export async function decodeTripShare(encoded) {
  const p = await decodeCompact(encoded)
  if (p.v !== 1) throw new Error('Unsupported share link version')

  return {
    trip: {
      name: p.n,
      startedAt: p.st,
      endedAt: p.et,
      durationMs: p.et - p.st,
      distanceMeters: p.d,
      maxSpeedMs: p.m,
      startPlace: p.sp,
      endPlace: p.ep,
      samples: fromCompactSamples(p.s, p.st),
    },
    unit: p.u,
    sharedAt: p.sa,
    expiresAt: p.sa + SHARE_TTL_MS,
  }
}

export function buildShareUrl(hashParam, value) {
  const url = new URL(window.location.href)
  url.hash = `${hashParam}=${value}`
  return url.toString()
}
