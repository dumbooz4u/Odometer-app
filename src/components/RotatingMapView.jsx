import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

// A full-bleed map for the Drive View, kept deliberately separate from
// MapView (which the rest of the app uses) so nothing here can affect the
// existing map. The main difference is optional "course-up" rotation: the
// whole map container is CSS-rotated by -heading so the direction of travel
// stays pointing up the screen, like a car nav unit.

function InvalidateSizeOnMount() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

function Recenter({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true })
  }, [lat, lon, map])
  return null
}

// Rotating the whole Leaflet container also rotates the vehicle marker
// riding inside it. The marker's own CSS rotation already points it at the
// compass heading (for north-up mode); combined with the container's
// counter-rotation in course-up mode, the two cancel out and the marker
// ends up pointing straight up the screen, which is the expected look.
function RotateContainer({ rotationDeg }) {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    el.style.transform = `rotate(${rotationDeg}deg)`
  }, [map, rotationDeg])
  return null
}

function useVehicleDivIcon(emoji, heading) {
  const lastHeadingRef = useRef(0)
  if (typeof heading === 'number' && !Number.isNaN(heading)) {
    lastHeadingRef.current = heading
  }
  const rotation = lastHeadingRef.current

  return useMemo(
    () =>
      L.divIcon({
        className: 'vehicle-marker-wrap',
        html: `<div class="vehicle-marker" style="transform: rotate(${rotation}deg)"><span>${emoji}</span></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emoji, rotation],
  )
}

export default function RotatingMapView({ position, vehicleIcon, traveledPath, courseUp }) {
  const icon = useVehicleDivIcon(vehicleIcon, position?.heading)
  const lastHeadingRef = useRef(0)
  if (typeof position?.heading === 'number' && !Number.isNaN(position.heading)) {
    lastHeadingRef.current = position.heading
  }
  const rotationDeg = courseUp ? -lastHeadingRef.current : 0

  if (!position) {
    return <div className="drive-map-placeholder">Waiting for GPS fix…</div>
  }

  const { lat, lon, accuracy } = position

  return (
    <div className="drive-map-shell">
      <MapContainer
        center={[lat, lon]}
        zoom={17}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        className="drive-map-container"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <InvalidateSizeOnMount />
        {traveledPath && traveledPath.length > 1 && (
          <Polyline positions={traveledPath} pathOptions={{ color: '#3987e5', weight: 4, opacity: 0.9 }} />
        )}
        <Marker position={[lat, lon]} icon={icon} />
        {accuracy && <Circle center={[lat, lon]} radius={accuracy} pathOptions={{ color: '#3987e5', weight: 1 }} />}
        <Recenter lat={lat} lon={lon} />
        <RotateContainer rotationDeg={rotationDeg} />
      </MapContainer>
      <div className="drive-map-attribution">
        &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  )
}
