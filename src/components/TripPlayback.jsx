import { useEffect, useMemo, useRef, useState } from 'react'
import MapView from './MapView'
import { interpolatePosition } from '../utils/playback'
import { formatElapsed } from '../utils/format'

const SPEED_OPTIONS = [1, 2, 5, 10]

function toDisplaySpeed(speedMs, unit) {
  return unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
}

export default function TripPlayback({ trip, unit }) {
  const { samples, startedAt, durationMs } = trip

  const [elapsedMs, setElapsedMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [multiplier, setMultiplier] = useState(1)

  const rafRef = useRef(null)
  const baseRef = useRef({ wallClock: 0, elapsed: 0 })

  useEffect(() => {
    if (!playing) return
    baseRef.current = { wallClock: performance.now(), elapsed: elapsedMs }

    function tick(now) {
      const next = baseRef.current.elapsed + (now - baseRef.current.wallClock) * multiplier
      if (next >= durationMs) {
        setElapsedMs(durationMs)
        setPlaying(false)
        return
      }
      setElapsedMs(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => rafRef.current != null && cancelAnimationFrame(rafRef.current)
    // Only the play/pause toggle and speed multiplier should restart the
    // clock's baseline — elapsedMs itself is written by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, multiplier, durationMs])

  const fullPath = useMemo(
    () => samples.filter((s) => s.lat != null && s.lon != null).map((s) => [s.lat, s.lon]),
    [samples],
  )

  const current = useMemo(() => interpolatePosition(samples, startedAt, elapsedMs), [samples, startedAt, elapsedMs])

  const traveledPath = useMemo(() => {
    if (!current || current.lat == null) return []
    const upToPrev = fullPath.slice(0, current.index)
    return [...upToPrev, [current.lat, current.lon]]
  }, [fullPath, current])

  function handleScrub(e) {
    setPlaying(false)
    setElapsedMs(Number(e.target.value))
  }

  function handlePlayPause() {
    if (elapsedMs >= durationMs) setElapsedMs(0)
    setPlaying((p) => !p)
  }

  const displaySpeed = current ? toDisplaySpeed(current.speedMs, unit) : 0
  const hasRoute = fullPath.length > 1

  return (
    <div className="playback-panel">
      {hasRoute ? (
        <div className="map-wrapper playback-map">
          <MapView
            position={{ lat: current.lat, lon: current.lon, accuracy: null, heading: current.bearing }}
            vehicleIcon={trip.vehicleIcon || '🚙'}
            fullPath={fullPath}
            traveledPath={traveledPath}
            autoRecenter={false}
          />
        </div>
      ) : (
        <div className="chart-empty">No route coordinates were recorded for this trip.</div>
      )}

      <div className="playback-controls">
        <button className="playback-play" onClick={handlePlayPause} disabled={!hasRoute}>
          {playing ? '⏸' : elapsedMs >= durationMs && durationMs > 0 ? '↺ Replay' : '▶ Play'}
        </button>

        <input
          type="range"
          className="playback-scrub"
          min={0}
          max={durationMs || 1}
          step={Math.max(1, durationMs / 500 || 1)}
          value={elapsedMs}
          onChange={handleScrub}
          disabled={!hasRoute}
        />

        <div className="playback-time">
          {formatElapsed(elapsedMs / 1000)} / {formatElapsed(durationMs / 1000)}
        </div>
      </div>

      {hasRoute && (
        <div className="playback-meta">
          <span className="playback-speed-value">
            {displaySpeed.toFixed(0)} {unit === 'mph' ? 'mph' : 'km/h'}
          </span>
          <div className="playback-speeds">
            {SPEED_OPTIONS.map((m) => (
              <button
                key={m}
                className={`playback-speed-btn${multiplier === m ? ' is-active' : ''}`}
                onClick={() => setMultiplier(m)}
              >
                {m}×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
