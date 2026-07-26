import { useCallback, useState } from 'react'
import { readJSON, writeJSON, remove } from '../utils/storage'
import { buildTripName } from '../utils/place'
import { downsample } from '../utils/downsample'
import { saveTrip, MAX_ARCHIVED_SAMPLES } from '../utils/tripStorage'

// The in-progress recording marker survives a refresh (sessionStorage) so a
// mid-trip reload resumes recording instead of silently dropping it.
const RECORDING_KEY = 'odometer.trip.recording'

function loadStoredRecording() {
  return readJSON(sessionStorage, RECORDING_KEY, null)
}

export function useTripRecorder() {
  const [recording, setRecording] = useState(loadStoredRecording)

  const start = useCallback((startPlace) => {
    const info = { startedAt: Date.now(), startPlace: startPlace ?? null }
    writeJSON(sessionStorage, RECORDING_KEY, info)
    setRecording(info)
  }, [])

  const stop = useCallback(
    ({ endPlace, distanceMeters, samples, vehicleIcon }) => {
      if (!recording) return null
      const endedAt = Date.now()
      const maxSpeedMs = samples.reduce((m, s) => Math.max(m, s.speedMs), 0)

      const trip = {
        name: buildTripName(recording.startPlace, endPlace),
        startedAt: recording.startedAt,
        endedAt,
        durationMs: endedAt - recording.startedAt,
        distanceMeters,
        maxSpeedMs,
        startPlace: recording.startPlace,
        endPlace: endPlace ?? null,
        vehicleIcon: vehicleIcon ?? '🚙',
        samples: downsample(samples, MAX_ARCHIVED_SAMPLES),
      }

      saveTrip(trip)
      remove(sessionStorage, RECORDING_KEY)
      setRecording(null)
      return trip
    },
    [recording],
  )

  return {
    isRecording: recording != null,
    startedAt: recording?.startedAt ?? null,
    startPlace: recording?.startPlace ?? null,
    start,
    stop,
  }
}
