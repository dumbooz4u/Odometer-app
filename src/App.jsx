import { useState } from 'react'
import OdometerApp from './OdometerApp'
import SharedTripView from './components/SharedTripView'
import LiveShareView from './components/LiveShareView'

function parseRoute() {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('s=')) return { view: 'shared-trip', payload: hash.slice(2) }
  if (hash.startsWith('live=')) return { view: 'live-share', payload: hash.slice(5) }
  return { view: 'app' }
}

function App() {
  const [route] = useState(parseRoute)

  if (route.view === 'shared-trip') return <SharedTripView encoded={route.payload} />
  if (route.view === 'live-share') return <LiveShareView shareId={route.payload} />
  return <OdometerApp />
}

export default App
