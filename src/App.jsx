import { useState } from 'react'
import { useGeolocation } from './hooks/useGeolocation'
import { useWeather } from './hooks/useWeather'
import { useSpeedHistory } from './hooks/useSpeedHistory'
import { describeWeatherCode } from './utils/weatherCodes'
import SpeedDisplay from './components/SpeedDisplay'
import MapView from './components/MapView'
import WeatherPanel from './components/WeatherPanel'
import SpeedChart from './components/SpeedChart'

function App() {
  const [unit, setUnit] = useState('kmh')
  const geo = useGeolocation()
  const weather = useWeather(geo.position?.lat, geo.position?.lon)
  const speedHistory = useSpeedHistory(geo.speedMs, geo.status, geo.fixSeq)

  const theme = weather.data
    ? describeWeatherCode(weather.data.weather_code, weather.data.is_day).theme
    : 'default'

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <h1>Odometer</h1>
        <p className="tagline">Live GPS speed, distance &amp; weather</p>
      </header>

      <main className="dashboard">
        <SpeedDisplay
          speedMs={geo.speedMs}
          distanceMeters={geo.distanceMeters}
          status={geo.status}
          error={geo.error}
          unit={unit}
          onToggleUnit={() => setUnit((u) => (u === 'kmh' ? 'mph' : 'kmh'))}
        />

        <div className="map-wrapper">
          <MapView position={geo.position} />
        </div>

        <WeatherPanel weather={weather} />

        <div className="chart-wrapper">
          <SpeedChart samples={speedHistory.samples} startedAt={speedHistory.startedAt} unit={unit} />
        </div>
      </main>

      <footer className="app-footer">
        Map data &copy; OpenStreetMap contributors · Weather by Open-Meteo
      </footer>
    </div>
  )
}

export default App
