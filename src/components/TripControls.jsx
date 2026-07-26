import { useEffect, useState } from 'react'
import { formatElapsed } from '../utils/format'

export default function TripControls({ isRecording, startedAt, onStart, onStop }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRecording) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isRecording])

  const elapsedSec = isRecording && startedAt ? (now - startedAt) / 1000 : 0

  return (
    <div className="trip-controls">
      <div className="trip-status">
        <span className={`trip-dot${isRecording ? ' is-recording' : ''}`} />
        {isRecording ? `Recording · ${formatElapsed(elapsedSec)}` : 'Not recording'}
      </div>

      {isRecording ? (
        <button className="trip-button trip-button--stop" onClick={onStop}>
          ⏹ Stop trip
        </button>
      ) : (
        <button className="trip-button trip-button--start" onClick={onStart}>
          ▶ Start trip
        </button>
      )}
    </div>
  )
}
