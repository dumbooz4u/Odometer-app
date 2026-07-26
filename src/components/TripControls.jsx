import { useEffect, useState } from 'react'
import { formatElapsed } from '../utils/format'
import ShareLinkBox from './ShareLinkBox'

export default function TripControls({ isRecording, startedAt, onStart, onStop, liveShare }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRecording) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isRecording])

  const elapsedSec = isRecording && startedAt ? (now - startedAt) / 1000 : 0

  return (
    <div className="trip-controls">
      <div className="trip-controls-row">
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

      {isRecording && (
        <div className="live-share">
          {liveShare.status === 'idle' && (
            <button className="live-share-toggle" onClick={liveShare.start}>
              🔴 Share live journey
            </button>
          )}
          {liveShare.status === 'starting' && <div className="share-status">Starting live share…</div>}
          {liveShare.status === 'active' && (
            <>
              <button className="live-share-toggle live-share-toggle--stop" onClick={liveShare.stop}>
                ⏹ Stop live sharing
              </button>
              <ShareLinkBox
                url={liveShare.url}
                note="Anyone with this link can watch your live position for 24 hours (or until you stop sharing)."
              />
            </>
          )}
          {liveShare.status === 'error' && (
            <div className="share-status share-status--error">
              Couldn't start live sharing: {liveShare.error}
              <button className="live-share-retry" onClick={liveShare.start}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
