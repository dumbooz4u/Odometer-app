export default function LocationBanner({ geocode }) {
  const { status, place } = geocode

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="location-banner">
        <span className="location-pin">📍</span>
        <span className="location-text location-text--muted">Finding your location…</span>
      </div>
    )
  }

  if (status === 'error' || !place) {
    return (
      <div className="location-banner">
        <span className="location-pin">📍</span>
        <span className="location-text location-text--muted">Location name unavailable</span>
      </div>
    )
  }

  const parts = [place.vicinity, place.city, place.state].filter(Boolean)

  return (
    <div className="location-banner">
      <span className="location-pin">📍</span>
      <span className="location-text">{parts.length ? parts.join(' · ') : 'Unnamed area'}</span>
    </div>
  )
}
