import { useCallback, useEffect, useState } from 'react'

export function useFullscreen(ref) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const supported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const enter = useCallback(async () => {
    if (!ref.current) return
    try {
      await ref.current.requestFullscreen()
    } catch {
      // Fullscreen can be denied or unsupported (notably iOS Safari, which
      // doesn't support the Fullscreen API for ordinary page content) — the
      // view still works edge-to-edge within the browser chrome either way.
    }
  }, [ref])

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) exit()
    else enter()
  }, [enter, exit])

  return { isFullscreen, supported, enter, exit, toggle }
}
