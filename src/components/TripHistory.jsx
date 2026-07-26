import { useEffect, useState } from 'react'
import { loadTrips, deleteTrip } from '../utils/tripStorage'
import { metersToKm, metersToMiles } from '../utils/geo'
import { formatDuration } from '../utils/format'
import { encodeTripShare, buildShareUrl } from '../utils/shareLink'
import SpeedChart from './SpeedChart'
import ShareLinkBox from './ShareLinkBox'

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
  const [shares, setShares] = useState({})

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

  async function handleShare(trip) {
    setShares((s) => ({ ...s, [trip.id]: { status: 'loading' } }))
    try {
      const encoded = await encodeTripShare(trip, unit)
      const url = buildShareUrl('s', encoded)
      setShares((s) => ({ ...s, [trip.id]: { status: 'ready', url } }))
    } catch (err) {
      setShares((s) => ({ ...s, [trip.id]: { status: 'error', error: err.message } }))
    }
  }

  return (
    <div className="trip-history">
      <button className="trip-history-toggle" onClick={handleToggleOpen}>
        🗂 Past trips ({trips.length}){open ? ' ▲' : ' ▼'}
      </button>

      {open && (
        <div className="trip-history-list">
          {trips.length === 0 && <div className="trip-history-empty">No saved trips yet — start a trip to record one.</div>}

          {trips.map((trip) => {
            const share = shares[trip.id]
            return (
              <div className="trip-card" key={trip.id}>
                <button className="trip-card-header" onClick={() => setExpandedId((id) => (id === trip.id ? null : trip.id))}>
                  <div className="trip-card-name">{trip.name}</div>
                  <div className="trip-card-meta">
                    {new Date(trip.startedAt).toLocaleString()} · {formatDuration(trip.durationMs)} ·{' '}
                    {distanceLabel(trip.distanceMeters, unit)} · max {speedLabel(trip.maxSpeedMs, unit)}
                  </div>
                </button>

                <div className="trip-card-actions">
                  <button className="trip-card-share" onClick={() => handleShare(trip)} title="Share trip" aria-label="Share trip">
                    🔗
                  </button>
                  <button className="trip-card-delete" onClick={() => handleDelete(trip.id)} title="Delete trip" aria-label="Delete trip">
                    🗑
                  </button>
                </div>

                {share?.status === 'loading' && <div className="share-status">Generating link…</div>}
                {share?.status === 'ready' && (
                  <div className="share-status">
                    <ShareLinkBox url={share.url} note="Anyone with this link can view this trip for 24 hours." />
                  </div>
                )}
                {share?.status === 'error' && <div className="share-status share-status--error">Couldn't create link: {share.error}</div>}

                {expandedId === trip.id && (
                  <div className="trip-card-detail">
                    <SpeedChart samples={trip.samples} startedAt={trip.startedAt} unit={unit} live={false} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
