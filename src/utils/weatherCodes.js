// WMO weather interpretation codes -> { label, icon, theme }
// https://open-meteo.com/en/docs
const CODE_MAP = {
  0: { label: 'Clear sky', icon: '☀️', theme: 'clear' },
  1: { label: 'Mainly clear', icon: '🌤️', theme: 'clear' },
  2: { label: 'Partly cloudy', icon: '⛅', theme: 'cloudy' },
  3: { label: 'Overcast', icon: '☁️', theme: 'cloudy' },
  45: { label: 'Fog', icon: '🌫️', theme: 'fog' },
  48: { label: 'Depositing rime fog', icon: '🌫️', theme: 'fog' },
  51: { label: 'Light drizzle', icon: '🌦️', theme: 'rain' },
  53: { label: 'Moderate drizzle', icon: '🌦️', theme: 'rain' },
  55: { label: 'Dense drizzle', icon: '🌧️', theme: 'rain' },
  56: { label: 'Light freezing drizzle', icon: '🌧️', theme: 'rain' },
  57: { label: 'Dense freezing drizzle', icon: '🌧️', theme: 'rain' },
  61: { label: 'Slight rain', icon: '🌦️', theme: 'rain' },
  63: { label: 'Moderate rain', icon: '🌧️', theme: 'rain' },
  65: { label: 'Heavy rain', icon: '🌧️', theme: 'rain' },
  66: { label: 'Light freezing rain', icon: '🌧️', theme: 'rain' },
  67: { label: 'Heavy freezing rain', icon: '🌧️', theme: 'rain' },
  71: { label: 'Slight snow fall', icon: '🌨️', theme: 'snow' },
  73: { label: 'Moderate snow fall', icon: '🌨️', theme: 'snow' },
  75: { label: 'Heavy snow fall', icon: '❄️', theme: 'snow' },
  77: { label: 'Snow grains', icon: '❄️', theme: 'snow' },
  80: { label: 'Slight rain showers', icon: '🌦️', theme: 'rain' },
  81: { label: 'Moderate rain showers', icon: '🌧️', theme: 'rain' },
  82: { label: 'Violent rain showers', icon: '🌧️', theme: 'storm' },
  85: { label: 'Slight snow showers', icon: '🌨️', theme: 'snow' },
  86: { label: 'Heavy snow showers', icon: '❄️', theme: 'snow' },
  95: { label: 'Thunderstorm', icon: '⛈️', theme: 'storm' },
  96: { label: 'Thunderstorm, slight hail', icon: '⛈️', theme: 'storm' },
  99: { label: 'Thunderstorm, heavy hail', icon: '⛈️', theme: 'storm' },
}

export function describeWeatherCode(code, isDay) {
  const entry = CODE_MAP[code] ?? { label: 'Unknown', icon: '❔', theme: 'cloudy' }
  if (!isDay && entry.theme === 'clear') {
    return { ...entry, icon: '🌙', theme: 'clear-night' }
  }
  return entry
}
