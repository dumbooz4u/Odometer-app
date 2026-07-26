import { describeWeatherCode } from '../utils/weatherCodes'

export default function WeatherPanel({ weather }) {
  const { status, error, data } = weather

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="weather-panel">
        <span className="weather-icon">⏳</span>
        <span className="weather-label">Fetching weather…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="weather-panel">
        <span className="weather-icon">⚠️</span>
        <span className="weather-label">Weather unavailable ({error})</span>
      </div>
    )
  }

  if (!data) return null

  const { label, icon } = describeWeatherCode(data.weather_code, data.is_day)

  return (
    <div className="weather-panel">
      <span className="weather-icon" aria-hidden="true">{icon}</span>
      <div className="weather-details">
        <div className="weather-temp">{Math.round(data.temperature_2m)}°C</div>
        <div className="weather-label">{label}</div>
        <div className="weather-meta">
          Feels {Math.round(data.apparent_temperature)}°C · {data.relative_humidity_2m}% humidity · wind {Math.round(data.wind_speed_10m)} km/h
        </div>
      </div>
    </div>
  )
}
