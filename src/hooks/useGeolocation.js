import { useEffect, useRef, useState } from 'react'
import { haversineMeters } from '../utils/geo'

// Ignore fixes whose reported accuracy is worse than this (meters) when
// accumulating odometer distance, to keep GPS jitter from adding fake miles.
const MAX_ACCURACY_FOR_DISTANCE_M = 30
// Below this speed (m/s) we treat the vehicle as stationary and drop the
// fix from the distance total, since jitter is loudest while parked.
const MIN_SPEED_FOR_DISTANCE_MS = 0.5

export function useGeolocation() {
  const [state, setState] = useState({
    status: 'idle', // idle | locating | tracking | error
    error: null,
    position: null, // { lat, lon, accuracy, heading, altitude }
    speedMs: 0, // instantaneous speed, meters/second
    distanceMeters: 0, // accumulated odometer reading
    fixSeq: 0, // increments on every GPS fix, even if speed is unchanged
  })
  const lastFixRef = useRef(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, status: 'error', error: 'Geolocation is not supported by this browser.' }))
      return
    }

    setState((s) => ({ ...s, status: 'locating' }))

    const watchId = navigator.geolocation.watchPosition(
      (fix) => {
        const { latitude, longitude, accuracy, heading, altitude, speed } = fix.coords
        const timestamp = fix.timestamp
        const prev = lastFixRef.current

        let derivedSpeed = speed
        let distanceDeltaM = 0

        if (prev) {
          const dtSeconds = (timestamp - prev.timestamp) / 1000
          const segmentM = haversineMeters(prev.lat, prev.lon, latitude, longitude)

          if (derivedSpeed == null && dtSeconds > 0) {
            derivedSpeed = segmentM / dtSeconds
          }

          const goodFix = accuracy != null && accuracy <= MAX_ACCURACY_FOR_DISTANCE_M
          const isMoving = (derivedSpeed ?? 0) >= MIN_SPEED_FOR_DISTANCE_MS
          if (goodFix && isMoving) {
            distanceDeltaM = segmentM
          }
        }

        lastFixRef.current = { lat: latitude, lon: longitude, timestamp }

        setState((s) => ({
          ...s,
          status: 'tracking',
          error: null,
          position: { lat: latitude, lon: longitude, accuracy, heading, altitude },
          speedMs: derivedSpeed ?? 0,
          distanceMeters: s.distanceMeters + distanceDeltaM,
          fixSeq: s.fixSeq + 1,
        }))
      },
      (err) => {
        setState((s) => ({ ...s, status: 'error', error: err.message }))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 20000,
      },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return state
}
