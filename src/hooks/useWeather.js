import { useEffect, useRef, useState } from 'react'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000
// Only re-fetch once the device has moved this far, to avoid hammering the
// API every time a GPS fix jitters by a few meters.
const MIN_MOVE_FOR_REFETCH_DEG = 0.02 // ~2km at mid-latitudes

export function useWeather(lat, lon) {
  const [state, setState] = useState({ status: 'idle', error: null, data: null })
  const lastFetchRef = useRef(null)

  useEffect(() => {
    if (lat == null || lon == null) return

    const last = lastFetchRef.current
    if (last) {
      const moved = Math.abs(last.lat - lat) > MIN_MOVE_FOR_REFETCH_DEG || Math.abs(last.lon - lon) > MIN_MOVE_FOR_REFETCH_DEG
      const stale = Date.now() - last.time > REFRESH_INTERVAL_MS
      if (!moved && !stale) return
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
  }, [lat, lon])

  return state
}
