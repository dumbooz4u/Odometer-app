import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

function Recenter({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true })
  }, [lat, lon, map])
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

export default function MapView({ position, vehicleIcon, fullPath, traveledPath, autoRecenter = true }) {
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
      {fullPath && fullPath.length > 1 && (
        <Polyline positions={fullPath} pathOptions={{ color: '#ffffff', weight: 3, opacity: 0.3, dashArray: '2 8' }} />
      )}
      {traveledPath && traveledPath.length > 1 && (
        <Polyline positions={traveledPath} pathOptions={{ color: '#3987e5', weight: 4, opacity: 0.9 }} />
      )}
      <Marker position={[lat, lon]} icon={icon} />
      {accuracy && <Circle center={[lat, lon]} radius={accuracy} pathOptions={{ color: '#3987e5', weight: 1 }} />}
      {autoRecenter && <Recenter lat={lat} lon={lon} />}
    </MapContainer>
  )
}
