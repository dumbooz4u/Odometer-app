import { useEffect, useRef, useState } from 'react'

const REFRESH_INTERVAL_MS = 3 * 60 * 1000
// Only re-fetch once the device has moved this far, to avoid hammering the
// API every time a GPS fix jitters by a few meters. Tighter than before so
// driving into/out of a localized rain cell updates the reading sooner.
const MIN_MOVE_FOR_REFETCH_DEG = 0.01 // ~1.1km at mid-latitudes
// Skip the very first fetch until the fix is reasonably precise, so we don't
// lock onto weather for a wildly-off coarse location (e.g. a cell/Wi-Fi
// fallback fix before GPS has locked on).
const MAX_ACCURACY_FOR_FIRST_FETCH_M = 500

export function useWeather(lat, lon, accuracy) {
  const [state, setState] = useState({ status: 'idle', error: null, data: null })
  const lastFetchRef = useRef(null)
  // Read via a ref (not a dependency) so a fast-changing accuracy value can't
  // retrigger this effect mid-fetch and abort it in a loop — lat/lon jitter
  // on virtually every fix anyway, which re-runs this with the latest value.
  const accuracyRef = useRef(accuracy)
  accuracyRef.current = accuracy

  useEffect(() => {
    if (lat == null || lon == null) return

    const last = lastFetchRef.current
    if (last) {
      const moved = Math.abs(last.lat - lat) > MIN_MOVE_FOR_REFETCH_DEG || Math.abs(last.lon - lon) > MIN_MOVE_FOR_REFETCH_DEG
      const stale = Date.now() - last.time > REFRESH_INTERVAL_MS
      if (!moved && !stale) return
    } else if (typeof accuracyRef.current === 'number' && accuracyRef.current > MAX_ACCURACY_FOR_FIRST_FETCH_M) {
      // No fetch yet and this fix is too coarse to trust — wait for a better one.
      return
    }

    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading' }))

    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', lat.toFixed(4))
    url.searchParams.set('longitude', lon.toFixed(4))
    url.searchParams.set(
      'current',
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day',
    )
    url.searchParams.set('timezone', 'auto')

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Weather API responded ${res.status}`)
        return res.json()
      })
      .then((json) => {
        lastFetchRef.current = { lat, lon, time: Date.now() }
        setState({ status: 'ready', error: null, data: json.current })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setState((s) => ({ ...s, status: 'error', error: err.message }))
      })

    return () => controller.abort()
    // accuracy is intentionally excluded — see accuracyRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon])

  return state
}
