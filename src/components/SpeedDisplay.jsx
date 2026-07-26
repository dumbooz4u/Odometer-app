import { metersToKm, metersToMiles } from '../utils/geo'
import AnalogSpeedometer from './AnalogSpeedometer'

export default function SpeedDisplay({
  speedMs,
  distanceMeters,
  status,
  error,
  unit,
  intensity = 0,
  mode,
  onToggleUnit,
  onToggleMode,
}) {
  const speedKmh = speedMs * 3.6
  const speedMph = speedMs * 2.236936

  const speedValue = unit === 'mph' ? speedMph : speedKmh
  const distanceValue = unit === 'mph' ? metersToMiles(distanceMeters) : metersToKm(distanceMeters)
  const rounded = speedValue.toFixed(0)

  return (
    <div className="speed-display" style={{ '--intensity': intensity }}>
      <button className="mode-toggle" onClick={onToggleMode} title="Toggle digital/analog display">
        {mode === 'analog' ? '🎛️ Analog' : '🔢 Digital'}
      </button>
      <button className="unit-toggle" onClick={onToggleUnit} title="Toggle units">
        {unit === 'mph' ? 'mph' : 'km/h'}
      </button>

      {mode === 'analog' ? (
        <AnalogSpeedometer speedMs={speedMs} unit={unit} intensity={intensity} />
      ) : (
        <>
          <div className="speed-value-pulse" style={{ animationDuration: `${1.4 - intensity * 0.7}s` }}>
            <div className="speed-value" key={rounded}>
              {rounded}
            </div>
          </div>
          <div className="speed-unit">{unit === 'mph' ? 'mph' : 'km/h'}</div>
        </>
      )}

      <div className="odometer">
        <span className="odometer-value">{distanceValue.toFixed(2)}</span>
        <span className="odometer-unit">{unit === 'mph' ? 'mi' : 'km'} this trip</span>
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
