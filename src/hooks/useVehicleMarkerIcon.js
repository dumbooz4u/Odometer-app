import { useMemo, useRef } from 'react'
import L from 'leaflet'

// Shared by MapView and RotatingMapView so the main app's map and the
// full-screen Drive View render the vehicle marker identically. Besides
// rotating the vehicle emoji itself, a separate arrow overlay always points
// in the direction of travel — some vehicle emoji (a train, a bike) don't
// read as "rotated" at a glance the way a car does, so the arrow keeps the
// heading unambiguous no matter which icon is picked.
export function useVehicleDivIcon(emoji, heading) {
  const lastHeadingRef = useRef(0)
  if (typeof heading === 'number' && !Number.isNaN(heading)) {
    lastHeadingRef.current = heading
  }
  const rotation = lastHeadingRef.current

  return useMemo(
    () =>
      L.divIcon({
        className: 'vehicle-marker-wrap',
        html:
          `<div class="vehicle-marker-heading" style="transform: rotate(${rotation}deg)">` +
          `<span class="vehicle-marker-heading-arrow"></span>` +
          `</div>` +
          `<div class="vehicle-marker" style="transform: rotate(${rotation}deg)"><span>${emoji}</span></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emoji, rotation],
  )
}
