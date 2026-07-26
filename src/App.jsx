import { useEffect, useState } from 'react'
import { useGeolocation, TRIP_DISTANCE_KEY } from './hooks/useGeolocation'
import { useWeather } from './hooks/useWeather'
import { useSpeedHistory, TRIP_HISTORY_KEY } from './hooks/useSpeedHistory'
import { useWakeLock } from './hooks/useWakeLock'
import { useReverseGeocode } from './hooks/useReverseGeocode'
import { describeWeatherCode } from './utils/weatherCodes'
import { readJSON, writeJSON, remove } from './utils/storage'
import SpeedDisplay from './components/SpeedDisplay'
import MapView from './components/MapView'
import VehiclePicker from './components/VehiclePicker'
import { VEHICLE_ICONS } from './utils/vehicleIcons'
import WeatherPanel from './components/WeatherPanel'
import SpeedChart from './components/SpeedChart'
import LocationBanner from './components/LocationBanner'
import WeatherFX from './components/WeatherFX'

const VEHICLE_STORAGE_KEY = 'odometer.vehicleIcon'
const UNIT_STORAGE_KEY = 'odometer.unit'

function loadStoredVehicleIcon() {
  const stored = readJSON(localStorage, VEHICLE_STORAGE_KEY, null)
  return VEHICLE_ICONS.some((v) => v.emoji === stored) ? stored : VEHICLE_ICONS[0].emoji
}

function loadStoredUnit() {
  const stored = readJSON(localStorage, UNIT_STORAGE_KEY, 'kmh')
  return stored === 'mph' ? 'mph' : 'kmh'
}

function App() {
  const [unit, setUnit] = useState(loadStoredUnit)
  const [vehicleIcon, setVehicleIcon] = useState(loadStoredVehicleIcon)

  const geo = useGeolocation()
  const weather = useWeather(geo.position?.lat, geo.position?.lon)
  const geocode = useReverseGeocode(geo.position?.lat, geo.position?.lon)
  const speedHistory = useSpeedHistory(geo.speedMs, geo.status, geo.fixSeq)
  const wakeLock = useWakeLock(geo.status === 'tracking' || geo.status === 'locating')

  useEffect(() => {
    writeJSON(localStorage, VEHICLE_STORAGE_KEY, vehicleIcon)
  }, [vehicleIcon])

  useEffect(() => {
    writeJSON(localStorage, UNIT_STORAGE_KEY, unit)
  }, [unit])

  function handleResetTrip() {
    if (!window.confirm('Reset trip distance and the speed chart? This can’t be undone.')) return
    remove(sessionStorage, TRIP_DISTANCE_KEY)
    remove(sessionStorage, TRIP_HISTORY_KEY)
    window.location.reload()
  }

  const theme = weather.data
    ? describeWeatherCode(weather.data.weather_code, weather.data.is_day).theme
    : 'default'

  const speedKmh = geo.speedMs * 3.6
  const intensity = Math.max(0, Math.min(1, speedKmh / 140))

  return (
    <div className="app" data-theme={theme} style={{ '--speed-intensity': intensity }}>
      <WeatherFX theme={theme} />

      <header className="app-header">
        <h1>Odometer</h1>
        <p className="tagline">Live GPS speed, distance &amp; weather</p>
        {wakeLock.supported && (
          <span className={`wakelock-badge${wakeLock.active ? ' is-active' : ''}`}>
            {wakeLock.active ? '📱 Screen kept awake' : '📱 Screen may sleep'}
          </span>
        )}
      </header>

      <main className="dashboard">
        <SpeedDisplay
          speedMs={geo.speedMs}
          distanceMeters={geo.distanceMeters}
          status={geo.status}
          error={geo.error}
          unit={unit}
          intensity={intensity}
          onToggleUnit={() => setUnit((u) => (u === 'kmh' ? 'mph' : 'kmh'))}
          onResetTrip={handleResetTrip}
        />

        <div className="map-wrapper">
          <MapView position={geo.position} vehicleIcon={vehicleIcon} />
          <VehiclePicker value={vehicleIcon} onChange={setVehicleIcon} />
        </div>

        <LocationBanner geocode={geocode} />

        <WeatherPanel weather={weather} />

        <div className="chart-wrapper">
          <SpeedChart samples={speedHistory.samples} startedAt={speedHistory.startedAt} unit={unit} />
        </div>
      </main>

      <footer className="app-footer">
        Map data &copy; OpenStreetMap contributors · Weather by Open-Meteo · Places by Nominatim
      </footer>
    </div>
  )
}

export default App
