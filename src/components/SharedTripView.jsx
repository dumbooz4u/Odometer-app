import { useEffect, useState } from 'react'
import { decodeTripShare } from '../utils/shareLink'
import { metersToKm, metersToMiles } from '../utils/geo'
import { formatDuration } from '../utils/format'
import { placeLabel } from '../utils/place'
import SpeedChart from './SpeedChart'

function speedLabel(speedMs, unit) {
  const value = unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
  return `${value.toFixed(0)} ${unit === 'mph' ? 'mph' : 'km/h'}`
}

function distanceLabel(distanceMeters, unit) {
  const value = unit === 'mph' ? metersToMiles(distanceMeters) : metersToKm(distanceMeters)
  return `${value.toFixed(2)} ${unit === 'mph' ? 'mi' : 'km'}`
}

export default function SharedTripView({ encoded }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [unit, setUnit] = useState('kmh')

  useEffect(() => {
    decodeTripShare(encoded)
      .then((data) => {
        setUnit(data.unit === 'mph' ? 'mph' : 'kmh')
        if (Date.now() > data.expiresAt) {
          setState({ status: 'expired', data, error: null })
        } else {
          setState({ status: 'ready', data, error: null })
        }
      })
      .catch((err) => setState({ status: 'error', data: null, error: err.message }))
  }, [encoded])

  return (
    <div className="app share-view">
      <header className="app-header">
        <h1>Shared trip</h1>
        <p className="tagline">Viewed via a public Odometer link</p>
      </header>

      <main className="dashboard">
        {state.status === 'loading' && (
          <div className="chart-panel">
            <div className="chart-empty">Loading shared trip…</div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="chart-panel">
            <h2>Link couldn't be read</h2>
            <div className="chart-empty">
              This link looks broken or was created by a newer version of the app: {state.error}
            </div>
          </div>
        )}

        {state.status === 'expired' && (
          <div className="chart-panel">
            <h2>{state.data.trip.name}</h2>
            <div className="chart-empty">This shared link has expired (links are valid for 24 hours after sharing).</div>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            <div className="speed-display share-summary">
              <button className="unit-toggle" onClick={() => setUnit((u) => (u === 'kmh' ? 'mph' : 'kmh'))} title="Toggle units">
                {unit === 'mph' ? 'mph' : 'km/h'}
              </button>
              <h2 className="share-trip-name">{state.data.trip.name}</h2>
              <div className="share-trip-meta">{new Date(state.data.trip.startedAt).toLocaleString()}</div>

              <div className="share-stat-row">
                <div className="share-stat">
                  <div className="share-stat-value">{distanceLabel(state.data.trip.distanceMeters, unit)}</div>
                  <div className="share-stat-label">Distance</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-value">{formatDuration(state.data.trip.durationMs)}</div>
                  <div className="share-stat-label">Duration</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-value">{speedLabel(state.data.trip.maxSpeedMs, unit)}</div>
                  <div className="share-stat-label">Max speed</div>
                </div>
              </div>

              <div className="share-places">
                <span>{placeLabel(state.data.trip.startPlace) || 'Unknown start'}</span>
                <span> → </span>
                <span>{placeLabel(state.data.trip.endPlace) || 'Unknown end'}</span>
              </div>
            </div>

            <div className="chart-wrapper">
              <SpeedChart samples={state.data.trip.samples} startedAt={state.data.trip.startedAt} unit={unit} live={false} />
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">Shared from Odometer · This link works for 24 hours from when it was created.</footer>
    </div>
  )
}
