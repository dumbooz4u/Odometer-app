import { useEffect, useMemo, useState } from 'react'
import { useGeolocation } from './hooks/useGeolocation'
import { useWeather } from './hooks/useWeather'
import { useSpeedHistory } from './hooks/useSpeedHistory'
import { useWakeLock } from './hooks/useWakeLock'
import { useReverseGeocode } from './hooks/useReverseGeocode'
import { useTripRecorder } from './hooks/useTripRecorder'
import { useLiveShare } from './hooks/useLiveShare'
import { describeWeatherCode } from './utils/weatherCodes'
import { readJSON, writeJSON } from './utils/storage'
import SpeedDisplay from './components/SpeedDisplay'
import MapView from './components/MapView'
import VehiclePicker from './components/VehiclePicker'
import { VEHICLE_ICONS } from './utils/vehicleIcons'
import WeatherPanel from './components/WeatherPanel'
import SpeedChart from './components/SpeedChart'
import LocationBanner from './components/LocationBanner'
import WeatherFX from './components/WeatherFX'
import TripControls from './components/TripControls'
import TripHistory from './components/TripHistory'

const VEHICLE_STORAGE_KEY = 'odometer.vehicleIcon'
const UNIT_STORAGE_KEY = 'odometer.unit'
const SPEED_MODE_STORAGE_KEY = 'odometer.speedMode'

function loadStoredVehicleIcon() {
  const stored = readJSON(localStorage, VEHICLE_STORAGE_KEY, null)
  return VEHICLE_ICONS.some((v) => v.emoji === stored) ? stored : VEHICLE_ICONS[0].emoji
}

function loadStoredUnit() {
  const stored = readJSON(localStorage, UNIT_STORAGE_KEY, 'kmh')
  return stored === 'mph' ? 'mph' : 'kmh'
}

function loadStoredSpeedMode() {
  const stored = readJSON(localStorage, SPEED_MODE_STORAGE_KEY, 'digital')
  return stored === 'analog' ? 'analog' : 'digital'
}

export default function OdometerApp() {
  const [unit, setUnit] = useState(loadStoredUnit)
  const [vehicleIcon, setVehicleIcon] = useState(loadStoredVehicleIcon)
  const [speedMode, setSpeedMode] = useState(loadStoredSpeedMode)
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0)

  const trip = useTripRecorder()
  const geo = useGeolocation(trip.isRecording)
  const weather = useWeather(geo.position?.lat, geo.position?.lon)
  const geocode = useReverseGeocode(geo.position?.lat, geo.position?.lon)
  const speedHistory = useSpeedHistory(geo.speedMs, geo.status, geo.fixSeq, trip.isRecording, geo.position)
  const wakeLock = useWakeLock(geo.status === 'tracking' || geo.status === 'locating')
  const liveShare = useLiveShare()

  useEffect(() => {
    writeJSON(localStorage, VEHICLE_STORAGE_KEY, vehicleIcon)
  }, [vehicleIcon])

  useEffect(() => {
    writeJSON(localStorage, UNIT_STORAGE_KEY, unit)
  }, [unit])

  useEffect(() => {
    writeJSON(localStorage, SPEED_MODE_STORAGE_KEY, speedMode)
  }, [speedMode])

  useEffect(() => {
    liveShare.setSnapshot({
      lat: geo.position?.lat ?? null,
      lon: geo.position?.lon ?? null,
      heading: geo.position?.heading ?? null,
      speedMs: geo.speedMs,
      distanceMeters: geo.distanceMeters,
      unit,
      vehicleIcon,
      place: geocode.place,
      startedAt: trip.startedAt,
    })
    // liveShare.setSnapshot's identity is stable (useCallback with no deps);
    // omitting `liveShare` here avoids re-running this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.position, geo.speedMs, geo.distanceMeters, unit, vehicleIcon, geocode.place, trip.startedAt])

  function handleStartTrip() {
    geo.resetDistance()
    speedHistory.resetHistory()
    trip.start(geocode.place)
  }

  function handleStopTrip() {
    trip.stop({
      endPlace: geocode.place,
      distanceMeters: geo.distanceMeters,
      samples: speedHistory.samples,
      vehicleIcon,
    })
    liveShare.stop()
    geo.resetDistance()
    speedHistory.resetHistory()
    setHistoryRefreshToken((t) => t + 1)
  }

  const theme = weather.data
    ? describeWeatherCode(weather.data.weather_code, weather.data.is_day).theme
    : 'default'

  const speedKmh = geo.speedMs * 3.6
  const intensity = Math.max(0, Math.min(1, speedKmh / 140))

  const traveledPath = useMemo(
    () =>
      trip.isRecording
        ? speedHistory.samples.filter((s) => s.lat != null && s.lon != null).map((s) => [s.lat, s.lon])
        : undefined,
    [trip.isRecording, speedHistory.samples],
  )

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
        <TripControls
          isRecording={trip.isRecording}
          startedAt={trip.startedAt}
          onStart={handleStartTrip}
          onStop={handleStopTrip}
          liveShare={liveShare}
        />

        <SpeedDisplay
          speedMs={geo.speedMs}
          distanceMeters={geo.distanceMeters}
          status={geo.status}
          error={geo.error}
          unit={unit}
          intensity={intensity}
          mode={speedMode}
          onToggleUnit={() => setUnit((u) => (u === 'kmh' ? 'mph' : 'kmh'))}
          onToggleMode={() => setSpeedMode((m) => (m === 'digital' ? 'analog' : 'digital'))}
        />

        <div className="map-wrapper">
          <MapView position={geo.position} vehicleIcon={vehicleIcon} traveledPath={traveledPath} />
          <VehiclePicker value={vehicleIcon} onChange={setVehicleIcon} />
        </div>

        <LocationBanner geocode={geocode} />

        <WeatherPanel weather={weather} />

        <div className="chart-wrapper">
          {trip.isRecording ? (
            <SpeedChart samples={speedHistory.samples} startedAt={speedHistory.startedAt} unit={unit} />
          ) : (
            <div className="chart-panel">
              <h2>Speed over time</h2>
              <div className="chart-empty">Press "Start trip" to begin recording a speed chart.</div>
            </div>
          )}
        </div>

        <TripHistory unit={unit} refreshToken={historyRefreshToken} />
      </main>

      <footer className="app-footer">
        Map data &copy; OpenStreetMap contributors · Weather by Open-Meteo · Places by Nominatim
      </footer>
    </div>
  )
}
