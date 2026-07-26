import { useEffect, useRef, useState } from 'react'

export function useWakeLock(enabled) {
  const [status, setStatus] = useState(() => ({
    supported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    active: false,
    error: null,
  }))
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!status.supported || !enabled) return

    let cancelled = false

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        setStatus((s) => ({ ...s, active: true, error: null }))
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
          if (!cancelled) setStatus((s) => ({ ...s, active: false }))
        })
      } catch (err) {
        setStatus((s) => ({ ...s, active: false, error: err.message }))
      }
    }

    acquire()

    function handleVisibility() {
      if (document.visibilityState === 'visible' && sentinelRef.current == null) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      sentinelRef.current?.release()
      sentinelRef.current = null
    }
  }, [enabled, status.supported])

  return status
}
