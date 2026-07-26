import { useEffect, useRef, useState } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

// One sample per second is plenty for a trip-long speed profile and keeps
// the point count bounded regardless of how often the GPS fix updates.
const SAMPLE_INTERVAL_MS = 1000
// Hard cap so a multi-hour drive can't grow the array without bound.
const MAX_SAMPLES = 7200 // 2 hours at 1 sample/sec
// Persisting on every 1s sample is wasted work; a refresh losing the last
// few seconds of chart resolution is an acceptable trade for far fewer writes.
const PERSIST_INTERVAL_MS = 5000

export const TRIP_HISTORY_KEY = 'odometer.trip.speedHistory'

function loadStoredHistory() {
  const stored = readJSON(sessionStorage, TRIP_HISTORY_KEY, null)
  if (!stored || !Array.isArray(stored.samples) || typeof stored.startedAt !== 'number') {
    return { samples: [], startedAt: null }
  }
  return stored
}

export function useSpeedHistory(speedMs, status, fixSeq) {
  const initial = useRef(loadStoredHistory())
  const [samples, setSamples] = useState(initial.current.samples)
  const startRef = useRef(initial.current.startedAt)
  const lastSampleRef = useRef(0)
  const lastPersistRef = useRef(0)
  const latestRef = useRef({ samples: initial.current.samples, startedAt: initial.current.startedAt })

  useEffect(() => {
    function persistNow() {
      if (latestRef.current.startedAt != null) {
        writeJSON(sessionStorage, TRIP_HISTORY_KEY, latestRef.current)
      }
    }
    window.addEventListener('pagehide', persistNow)
    document.addEventListener('visibilitychange', persistNow)
    return () => {
      window.removeEventListener('pagehide', persistNow)
      document.removeEventListener('visibilitychange', persistNow)
      persistNow()
    }
  }, [])

  useEffect(() => {
    if (status !== 'tracking') return
    if (startRef.current == null) startRef.current = Date.now()

    const now = Date.now()
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return
    lastSampleRef.current = now

    setSamples((prev) => {
      const next = [...prev, { t: now, speedMs }]
      const trimmed = next.length > MAX_SAMPLES ? next.slice(next.length - MAX_SAMPLES) : next
      latestRef.current = { samples: trimmed, startedAt: startRef.current }

      if (now - lastPersistRef.current >= PERSIST_INTERVAL_MS) {
        lastPersistRef.current = now
        writeJSON(sessionStorage, TRIP_HISTORY_KEY, latestRef.current)
      }
      return trimmed
    })
    // fixSeq increments on every GPS fix so this samples even when speed
    // itself hasn't changed (e.g. holding steady at 0 or a constant speed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixSeq, status])

  return { samples, startedAt: startRef.current }
}
