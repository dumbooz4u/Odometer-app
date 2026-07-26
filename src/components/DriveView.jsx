import { useEffect, useRef, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useWakeLock } from '../hooks/useWakeLock'
import { useFullscreen } from '../hooks/useFullscreen'
import { readJSON, writeJSON } from '../utils/storage'
import { loadStoredVehicleIcon, loadStoredUnit, VEHICLE_STORAGE_KEY, UNIT_STORAGE_KEY } from '../utils/preferences'
import RotatingMapView from './RotatingMapView'
import VehiclePicker from './VehiclePicker'

const COURSE_UP_KEY = 'odometer.driveView.courseUp'

function loadStoredCourseUp() {
  return readJSON(localStorage, COURSE_UP_KEY, false) === true
}

function toDisplaySpeed(speedMs, unit) {
  return unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
}

export default function DriveView() {
  const rootRef = useRef(null)
  const [unit, setUnit] = useState(loadStoredUnit)
  const [vehicleIcon, setVehicleIcon] = useState(loadStoredVehicleIcon)
  const [courseUp, setCourseUp] = useState(loadStoredCourseUp)

  // This view never accumulates trip distance itself — it's a standalone
  // live display, independent of whatever the main app's trip recorder is
  // doing (which keeps this screen simple and safe to open at any time).
  const geo = useGeolocation(false)
  const wakeLock = useWakeLock(true)
  const fullscreen = useFullscreen(rootRef)

  useEffect(() => {
    writeJSON(localStorage, VEHICLE_STORAGE_KEY, vehicleIcon)
  }, [vehicleIcon])

  useEffect(() => {
    writeJSON(localStorage, UNIT_STORAGE_KEY, unit)
  }, [unit])

  useEffect(() => {
    writeJSON(localStorage, COURSE_UP_KEY, courseUp)
  }, [courseUp])

  const speedKmh = geo.speedMs * 3.6
  const intensity = Math.max(0, Math.min(1, speedKmh / 140))
  const speedValue = toDisplaySpeed(geo.speedMs, unit)

  function handleExit() {
    if (document.fullscreenElement) fullscreen.exit()
    window.location.hash = ''
  }

  return (
    <div className="drive-view" ref={rootRef} style={{ '--speed-intensity': intensity }}>
      <RotatingMapView position={geo.position} vehicleIcon={vehicleIcon} courseUp={courseUp} />

      <div className="drive-scrim drive-scrim--top" />
      <div className="drive-scrim drive-scrim--bottom" />

      <div className="drive-topbar">
        <button className="drive-btn" onClick={handleExit} title="Exit drive view" aria-label="Exit drive view">
          ✕
        </button>

        <div className="drive-topbar-right">
          <button
            className={`drive-btn drive-btn--toggle${courseUp ? ' is-active' : ''}`}
            onClick={() => setCourseUp((v) => !v)}
            title="Toggle north-up / course-up"
          >
            {courseUp ? '🧭 Course up' : '🧭 North up'}
          </button>
          {fullscreen.supported && (
            <button className="drive-btn" onClick={fullscreen.toggle} title="Toggle full screen">
              {fullscreen.isFullscreen ? '⛶ Exit' : '⛶ Full screen'}
            </button>
          )}
        </div>
      </div>

      <div className="drive-vehicle-picker">
        <VehiclePicker value={vehicleIcon} onChange={setVehicleIcon} />
      </div>

      <div className="drive-bottombar">
        {geo.status === 'error' && <div className="drive-gps-error">GPS error: {geo.error}</div>}
        {geo.status !== 'tracking' && geo.status !== 'error' && <div className="drive-gps-status">Acquiring GPS…</div>}

        <div className="drive-speed-row">
          <div className="drive-speed-value">{speedValue.toFixed(0)}</div>
          <button className="drive-unit-toggle" onClick={() => setUnit((u) => (u === 'kmh' ? 'mph' : 'kmh'))}>
            {unit === 'mph' ? 'mph' : 'km/h'}
          </button>
        </div>

        {wakeLock.supported && (
          <div className="drive-wakelock">{wakeLock.active ? '📱 Screen kept awake' : '📱 Screen may sleep'}</div>
        )}
      </div>
    </div>
  )
}
