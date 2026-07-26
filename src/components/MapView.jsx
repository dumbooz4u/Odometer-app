import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet'
import { useVehicleDivIcon } from '../hooks/useVehicleMarkerIcon'

// Leaflet measures its container's size once at creation. When a map mounts
// inside a conditionally-rendered tab (e.g. trip playback), that measurement
// can be taken before layout has settled, leaving Leaflet's internal size
// cache wrong — every later setView/center calculation is then off by
// whatever the discrepancy is. invalidateSize() re-measures and fixes it.
function InvalidateSizeOnMount() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

function Recenter({ lat, lon, instant }) {
  const map = useMap()
  useEffect(() => {
    // Live tracking updates roughly once a second, so an animated pan has
    // time to finish. Playback drives this every animation frame, where a
    // fresh animated pan on top of the previous one would fight itself and
    // look jittery — snapping instantly there tracks the marker smoothly.
    map.setView([lat, lon], map.getZoom(), { animate: !instant })
  }, [lat, lon, map, instant])
  return null
}

export default function MapView({ position, vehicleIcon, fullPath, traveledPath, autoRecenter = true, instantRecenter = false }) {
  const icon = useVehicleDivIcon(vehicleIcon, position?.heading)

  if (!position) {
    return <div className="map-placeholder">Waiting for GPS fix…</div>
  }

  const { lat, lon, accuracy } = position

  return (
    <MapContainer center={[lat, lon]} zoom={16} scrollWheelZoom className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InvalidateSizeOnMount />
      {fullPath && fullPath.length > 1 && (
        <Polyline positions={fullPath} pathOptions={{ color: '#ffffff', weight: 3, opacity: 0.3, dashArray: '2 8' }} />
      )}
      {traveledPath && traveledPath.length > 1 && (
        <Polyline positions={traveledPath} pathOptions={{ color: '#3987e5', weight: 4, opacity: 0.9 }} />
      )}
      <Marker position={[lat, lon]} icon={icon} />
      {accuracy && <Circle center={[lat, lon]} radius={accuracy} pathOptions={{ color: '#3987e5', weight: 1 }} />}
      {autoRecenter && <Recenter lat={lat} lon={lon} instant={instantRecenter} />}
    </MapContainer>
  )
}
