import { useEffect, useState } from 'react'
import { loadTrips, deleteTrip } from '../utils/tripStorage'
import { metersToKm, metersToMiles } from '../utils/geo'
import { formatDuration } from '../utils/format'
import SpeedChart from './SpeedChart'

function speedLabel(speedMs, unit) {
  const value = unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
  return `${value.toFixed(0)} ${unit === 'mph' ? 'mph' : 'km/h'}`
}

function distanceLabel(distanceMeters, unit) {
  const value = unit === 'mph' ? metersToMiles(distanceMeters) : metersToKm(distanceMeters)
  return `${value.toFixed(2)} ${unit === 'mph' ? 'mi' : 'km'}`
}

export default function TripHistory({ unit, refreshToken }) {
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [trips, setTrips] = useState(loadTrips)

  useEffect(() => {
    setTrips(loadTrips())
  }, [refreshToken])

  function handleToggleOpen() {
    setOpen((v) => !v)
  }

  function handleDelete(id) {
    deleteTrip(id)
    setTrips(loadTrips())
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="trip-history">
      <button className="trip-history-toggle" onClick={handleToggleOpen}>
        🗂 Past trips ({trips.length}){open ? ' ▲' : ' ▼'}
      </button>

      {open && (
        <div className="trip-history-list">
          {trips.length === 0 && <div className="trip-history-empty">No saved trips yet — start a trip to record one.</div>}

          {trips.map((trip) => (
            <div className="trip-card" key={trip.id}>
              <button className="trip-card-header" onClick={() => setExpandedId((id) => (id === trip.id ? null : trip.id))}>
                <div className="trip-card-name">{trip.name}</div>
                <div className="trip-card-meta">
                  {new Date(trip.startedAt).toLocaleString()} · {formatDuration(trip.durationMs)} ·{' '}
                  {distanceLabel(trip.distanceMeters, unit)} · max {speedLabel(trip.maxSpeedMs, unit)}
                </div>
              </button>

              <button className="trip-card-delete" onClick={() => handleDelete(trip.id)} title="Delete trip" aria-label="Delete trip">
                🗑
              </button>

              {expandedId === trip.id && (
                <div className="trip-card-detail">
                  <SpeedChart samples={trip.samples} startedAt={trip.startedAt} unit={unit} live={false} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
