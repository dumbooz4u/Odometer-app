export function placeLabel(place) {
  if (!place) return null
  const cityState = [place.city, place.state].filter(Boolean).join(', ')
  return cityState || place.vicinity || place.country || null
}

export function buildTripName(startPlace, endPlace) {
  const start = placeLabel(startPlace) || 'Unknown start'
  const end = placeLabel(endPlace) || 'Unknown end'
  return start === end ? `${start} loop` : `${start} → ${end}`
}
