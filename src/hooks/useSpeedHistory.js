import { useEffect, useRef, useState } from 'react'

// One sample per second is plenty for a trip-long speed profile and keeps
// the point count bounded regardless of how often the GPS fix updates.
const SAMPLE_INTERVAL_MS = 1000
// Hard cap so a multi-hour drive can't grow the array without bound.
const MAX_SAMPLES = 7200 // 2 hours at 1 sample/sec

export function useSpeedHistory(speedMs, status, fixSeq) {
  const [samples, setSamples] = useState([])
  const startRef = useRef(null)
  const lastSampleRef = useRef(0)

  useEffect(() => {
    if (status !== 'tracking') return
    if (startRef.current == null) startRef.current = Date.now()

    const now = Date.now()
    if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) return
    lastSampleRef.current = now

    setSamples((prev) => {
      const next = [...prev, { t: now, speedMs }]
      return next.length > MAX_SAMPLES ? next.slice(next.length - MAX_SAMPLES) : next
    })
    // fixSeq increments on every GPS fix so this samples even when speed
    // itself hasn't changed (e.g. holding steady at 0 or a constant speed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixSeq, status])

  return { samples, startedAt: startRef.current }
}
