import { useEffect, useState } from 'react'
import { useGeolocation } from './hooks/useGeolocation'
import { useWeather } from './hooks/useWeather'
import { useSpeedHistory } from './hooks/useSpeedHistory'
import { useWakeLock } from './hooks/useWakeLock'
import { useReverseGeocode } from './hooks/useReverseGeocode'
import { describeWeatherCode } from './utils/weatherCodes'
import SpeedDisplay from './components/SpeedDisplay'
import MapView from './components/MapView'
import VehiclePicker from './components/VehiclePicker'
import { VEHICLE_ICONS } from './utils/vehicleIcons'
import WeatherPanel from './components/WeatherPanel'
import SpeedChart from './components/SpeedChart'
import LocationBanner from './components/LocationBanner'
import WeatherFX from './components/WeatherFX'

const VEHICLE_STORAGE_KEY = 'odometer.vehicleIcon'

function loadStoredVehicleIcon() {
  try {
    const stored = localStorage.getItem(VEHICLE_STORAGE_KEY)
    return VEHICLE_ICONS.some((v) => v.emoji === stored) ? stored : VEHICLE_ICONS[0].emoji
  } catch {
    return VEHICLE_ICONS[0].emoji
  }
}

function App() {
  const [unit, setUnit] = useState('kmh')
  const [vehicleIcon, setVehicleIcon] = useState(loadStoredVehicleIcon)

  const geo = useGeolocation()
  const weather = useWeather(geo.position?.lat, geo.position?.lon)
  const geocode = useReverseGeocode(geo.position?.lat, geo.position?.lon)
  const speedHistory = useSpeedHistory(geo.speedMs, geo.status, geo.fixSeq)
  const wakeLock = useWakeLock(geo.status === 'tracking' || geo.status === 'locating')

  useEffect(() => {
    try {
      localStorage.setItem(VEHICLE_STORAGE_KEY, vehicleIcon)
    } catch {
      /* ignore persistence failures (e.g. private browsing) */
    }
  }, [vehicleIcon])

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
