import { useEffect, useRef, useState } from 'react'

// Nominatim's usage policy asks for at most 1 request/sec; refetching only
// after a meaningful move or a cool-down keeps us far under that.
const REFETCH_INTERVAL_MS = 30 * 1000
const MIN_MOVE_FOR_REFETCH_DEG = 0.003 // ~300m at mid-latitudes

function pickVicinity(address) {
  return (
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.village ||
    address.town ||
    address.city_district ||
    address.hamlet ||
    null
  )
}

export function useReverseGeocode(lat, lon) {
  const [state, setState] = useState({ status: 'idle', error: null, place: null })
  const lastFetchRef = useRef(null)

  useEffect(() => {
    if (lat == null || lon == null) return

    const last = lastFetchRef.current
    if (last) {
      const moved = Math.abs(last.lat - lat) > MIN_MOVE_FOR_REFETCH_DEG || Math.abs(last.lon - lon) > MIN_MOVE_FOR_REFETCH_DEG
      const stale = Date.now() - last.time > REFETCH_INTERVAL_MS
      if (!moved && !stale) return
    }

    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading' }))

    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', lat.toFixed(5))
    url.searchParams.set('lon', lon.toFixed(5))
    url.searchParams.set('zoom', '14')
    url.searchParams.set('addressdetails', '1')

    fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`Reverse geocode responded ${res.status}`)
        return res.json()
      })
      .then((json) => {
        lastFetchRef.current = { lat, lon, time: Date.now() }
        const address = json.address ?? {}
        setState({
          status: 'ready',
          error: null,
          place: {
            vicinity: pickVicinity(address),
            city: address.city || address.town || address.village || address.municipality || null,
            state: address.state || address.region || null,
            country: address.country || null,
          },
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setState((s) => ({ ...s, status: 'error', error: err.message }))
      })

    return () => controller.abort()
  }, [lat, lon])

  return state
}
