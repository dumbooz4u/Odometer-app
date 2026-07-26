import { useEffect, useState } from 'react'
import OdometerApp from './OdometerApp'
import SharedTripView from './components/SharedTripView'
import LiveShareView from './components/LiveShareView'
import DriveView from './components/DriveView'

function parseRoute() {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('s=')) return { view: 'shared-trip', payload: hash.slice(2) }
  if (hash.startsWith('live=')) return { view: 'live-share', payload: hash.slice(5) }
  if (hash === 'drive') return { view: 'drive' }
  return { view: 'app' }
}

function App() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseRoute())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (route.view === 'shared-trip') return <SharedTripView encoded={route.payload} />
  if (route.view === 'live-share') return <LiveShareView shareId={route.payload} />
  if (route.view === 'drive') return <DriveView />
  return <OdometerApp />
}

export default App
