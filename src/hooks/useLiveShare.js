import { useCallback, useEffect, useRef, useState } from 'react'
import { createLiveShare, updateLiveShare } from '../utils/liveRelay'
import { buildShareUrl, SHARE_TTL_MS } from '../utils/shareLink'

const UPDATE_INTERVAL_MS = 6000

export function useLiveShare() {
  const [state, setState] = useState({ status: 'idle', url: null, error: null })
  const idRef = useRef(null)
  const snapshotRef = useRef(null)
  const timerRef = useRef(null)
  const sharedAtRef = useRef(null)

  const setSnapshot = useCallback((snapshot) => {
    snapshotRef.current = snapshot
  }, [])

  const start = useCallback(async () => {
    if (!snapshotRef.current) return
    setState({ status: 'starting', url: null, error: null })
    try {
      const sharedAt = Date.now()
      sharedAtRef.current = sharedAt
      const id = await createLiveShare({
        ...snapshotRef.current,
        sharedAt,
        expiresAt: sharedAt + SHARE_TTL_MS,
        lastUpdate: sharedAt,
        ended: false,
      })
      idRef.current = id
      setState({ status: 'active', url: buildShareUrl('live', id), error: null })

      timerRef.current = setInterval(() => {
        if (!idRef.current || !snapshotRef.current) return
        updateLiveShare(idRef.current, {
          ...snapshotRef.current,
          sharedAt: sharedAtRef.current,
          expiresAt: sharedAtRef.current + SHARE_TTL_MS,
          lastUpdate: Date.now(),
          ended: false,
        }).catch(() => {
          // transient hiccup against the third-party relay; next tick retries
        })
      }, UPDATE_INTERVAL_MS)
    } catch (err) {
      setState({ status: 'error', url: null, error: err.message })
    }
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (idRef.current && snapshotRef.current) {
      updateLiveShare(idRef.current, { ...snapshotRef.current, ended: true, lastUpdate: Date.now() }).catch(() => {
        /* best effort */
      })
    }
    idRef.current = null
    setState({ status: 'idle', url: null, error: null })
  }, [])

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), [])

  return { status: state.status, url: state.url, error: state.error, setSnapshot, start, stop }
}
