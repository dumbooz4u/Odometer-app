import { metersToKm, metersToMiles } from '../utils/geo'

export default function SpeedDisplay({ speedMs, distanceMeters, status, error, unit, intensity = 0, onToggleUnit, onResetTrip }) {
  const speedKmh = speedMs * 3.6
  const speedMph = speedMs * 2.236936

  const speedValue = unit === 'mph' ? speedMph : speedKmh
  const distanceValue = unit === 'mph' ? metersToMiles(distanceMeters) : metersToKm(distanceMeters)
  const rounded = speedValue.toFixed(0)

  return (
    <div className="speed-display" style={{ '--intensity': intensity }}>
      <button className="unit-toggle" onClick={onToggleUnit} title="Toggle units">
        {unit === 'mph' ? 'mph' : 'km/h'}
      </button>

      <div className="speed-value-pulse" style={{ animationDuration: `${1.4 - intensity * 0.7}s` }}>
        <div className="speed-value" key={rounded}>
          {rounded}
        </div>
      </div>
      <div className="speed-unit">{unit === 'mph' ? 'mph' : 'km/h'}</div>

      <div className="odometer">
        <span className="odometer-value">{distanceValue.toFixed(2)}</span>
        <span className="odometer-unit">{unit === 'mph' ? 'mi' : 'km'} this session</span>
        <button className="reset-trip" onClick={onResetTrip} title="Reset trip distance and chart">
          ↺ Reset trip
        </button>
      </div>

      <div className={`gps-status gps-status--${status}`}>
        {status === 'locating' && 'Acquiring GPS…'}
        {status === 'tracking' && 'GPS locked'}
        {status === 'error' && `GPS error: ${error}`}
        {status === 'idle' && 'Starting…'}
      </div>
    </div>
  )
}
