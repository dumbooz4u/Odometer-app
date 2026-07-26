import { useEffect, useRef, useState } from 'react'
import { fetchLiveShare } from '../utils/liveRelay'
import { metersToKm, metersToMiles } from '../utils/geo'
import { placeLabel } from '../utils/place'
import MapView from './MapView'

const POLL_INTERVAL_MS = 6000
const STALE_AFTER_MS = 30000

function speedLabel(speedMs, unit) {
  const value = unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
  return `${value.toFixed(0)} ${unit === 'mph' ? 'mph' : 'km/h'}`
}

function distanceLabel(distanceMeters, unit) {
  const value = unit === 'mph' ? metersToMiles(distanceMeters) : metersToKm(distanceMeters)
  return `${value.toFixed(2)} ${unit === 'mph' ? 'mi' : 'km'}`
}

export default function LiveShareView({ shareId }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [now, setNow] = useState(() => Date.now())
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false

    async function poll() {
      try {
        const data = await fetchLiveShare(shareId)
        if (cancelledRef.current) return
        setNow(Date.now())
        if (!data) {
          setState({ status: 'notfound', data: null, error: null })
        } else if (Date.now() > data.expiresAt) {
          setState({ status: 'expired', data, error: null })
        } else {
          setState({ status: 'ready', data, error: null })
        }
      } catch (err) {
        if (!cancelledRef.current) setState((s) => ({ ...s, status: 'error', error: err.message }))
      }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelledRef.current = true
      clearInterval(id)
    }
  }, [shareId])

  const data = state.data
  const unit = data?.unit === 'mph' ? 'mph' : 'kmh'
  const isStale = data && !data.ended && now - data.lastUpdate > STALE_AFTER_MS

  return (
    <div className="app share-view">
      <header className="app-header">
        <h1>Live journey</h1>
        <p className="tagline">Watching a live-shared Odometer trip</p>
      </header>

      <main className="dashboard">
        {state.status === 'loading' && (
          <div className="chart-panel">
            <div className="chart-empty">Connecting…</div>
          </div>
        )}

        {state.status === 'notfound' && (
          <div className="chart-panel">
            <h2>Link not found</h2>
            <div className="chart-empty">This live link doesn't exist, or sharing hasn't started yet.</div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="chart-panel">
            <h2>Can't reach the sharing service</h2>
            <div className="chart-empty">{state.error} — this will keep retrying automatically.</div>
          </div>
        )}

        {(state.status === 'expired' || state.status === 'ready') && data && (
          <>
            <div className="speed-display share-summary">
              <div className={`live-badge${data.ended ? ' is-ended' : isStale ? ' is-stale' : ' is-live'}`}>
                {data.ended ? '⚫ Sharing ended' : isStale ? '🟡 Connection stale' : '🔴 Live'}
              </div>
              <div className="share-trip-meta">{placeLabel(data.place) || 'Location unknown'}</div>

              <div className="speed-value">{speedLabel(data.speedMs, unit)}</div>

              <div className="share-stat-row">
                <div className="share-stat">
                  <div className="share-stat-value">{distanceLabel(data.distanceMeters, unit)}</div>
                  <div className="share-stat-label">Distance so far</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-value">{new Date(data.lastUpdate).toLocaleTimeString()}</div>
                  <div className="share-stat-label">Last update</div>
                </div>
              </div>

              {state.status === 'expired' && (
                <div className="chart-empty">This live link has expired (links are valid for 24 hours).</div>
              )}
            </div>

            {data.lat != null && data.lon != null && (
              <div className="map-wrapper">
                <MapView
                  position={{ lat: data.lat, lon: data.lon, accuracy: null, heading: data.heading, altitude: null }}
                  vehicleIcon={data.vehicleIcon || '🚙'}
                />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">Shared from Odometer · Updates roughly every few seconds.</footer>
    </div>
  )
}
