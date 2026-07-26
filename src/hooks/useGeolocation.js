import { useCallback, useEffect, useRef, useState } from 'react'
import { haversineMeters } from '../utils/geo'
import { readJSON, writeJSON, remove } from '../utils/storage'

// Ignore fixes whose reported accuracy is worse than this (meters) when
// accumulating odometer distance, to keep GPS jitter from adding fake miles.
const MAX_ACCURACY_FOR_DISTANCE_M = 30
// Below this speed (m/s) we treat the vehicle as stationary and drop the
// fix from the distance total, since jitter is loudest while parked.
const MIN_SPEED_FOR_DISTANCE_MS = 0.5

// Distance only accumulates while `recording` is true, and survives a
// refresh mid-trip via sessionStorage (cleared when the tab actually closes).
export const TRIP_DISTANCE_KEY = 'odometer.trip.distanceMeters'

export function useGeolocation(recording) {
  const [state, setState] = useState(() => ({
    status: 'idle', // idle | locating | tracking | error
    error: null,
    position: null, // { lat, lon, accuracy, heading, altitude }
    speedMs: 0, // instantaneous speed, meters/second
    distanceMeters: readJSON(sessionStorage, TRIP_DISTANCE_KEY, 0), // accumulated odometer reading
    fixSeq: 0, // increments on every GPS fix, even if speed is unchanged
  }))
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
          if (recording && goodFix && isMoving) {
            distanceDeltaM = segmentM
          }
        }

        lastFixRef.current = { lat: latitude, lon: longitude, timestamp }

        setState((s) => {
          const distanceMeters = s.distanceMeters + distanceDeltaM
          if (distanceDeltaM > 0) writeJSON(sessionStorage, TRIP_DISTANCE_KEY, distanceMeters)
          return {
            ...s,
            status: 'tracking',
            error: null,
            position: { lat: latitude, lon: longitude, accuracy, heading, altitude },
            speedMs: derivedSpeed ?? 0,
            distanceMeters,
            fixSeq: s.fixSeq + 1,
          }
        })
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
  }, [recording])

  const resetDistance = useCallback(() => {
    remove(sessionStorage, TRIP_DISTANCE_KEY)
    setState((s) => ({ ...s, distanceMeters: 0 }))
  }, [])

  return { ...state, resetDistance }
}
