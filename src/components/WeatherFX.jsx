import { useMemo } from 'react'

function range(n) {
  return Array.from({ length: n }, (_, i) => i)
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

export default function WeatherFX({ theme }) {
  const particles = useMemo(() => {
    switch (theme) {
      case 'rain':
        return range(36).map((i) => ({
          key: i,
          left: rand(0, 100),
          duration: rand(0.5, 1.1),
          delay: rand(0, 2),
          height: rand(14, 28),
        }))
      case 'storm':
        return range(50).map((i) => ({
          key: i,
          left: rand(0, 100),
          duration: rand(0.35, 0.8),
          delay: rand(0, 1.5),
          height: rand(16, 32),
        }))
      case 'snow':
        return range(28).map((i) => ({
          key: i,
          left: rand(0, 100),
          duration: rand(6, 14),
          delay: rand(0, 10),
          size: rand(3, 7),
          drift: rand(-30, 30),
        }))
      case 'cloudy':
      case 'fog':
        return range(theme === 'fog' ? 3 : 4).map((i) => ({
          key: i,
          top: rand(5, 70),
          duration: rand(38, 65),
          delay: rand(-30, 0),
          scale: rand(0.8, 1.6),
          opacity: theme === 'fog' ? rand(0.25, 0.4) : rand(0.12, 0.22),
        }))
      case 'clear-night':
        return range(45).map((i) => ({
          key: i,
          top: rand(0, 60),
          left: rand(0, 100),
          duration: rand(2, 5),
          delay: rand(0, 4),
          size: rand(1, 2.4),
        }))
      case 'clear':
        return range(5).map((i) => ({
          key: i,
          top: rand(0, 40),
          left: rand(0, 100),
          duration: rand(14, 24),
          delay: rand(-14, 0),
          size: rand(60, 140),
        }))
      default:
        return []
    }
  }, [theme])

  return (
    <div className="weatherfx" aria-hidden="true">
      {(theme === 'rain' || theme === 'storm') &&
        particles.map((p) => (
          <span
            key={p.key}
            className="fx-drop"
            style={{
              left: `${p.left}%`,
              height: `${p.height}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

      {theme === 'snow' &&
        particles.map((p) => (
          <span
            key={p.key}
            className="fx-flake"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}

      {(theme === 'cloudy' || theme === 'fog') &&
        particles.map((p) => (
          <span
            key={p.key}
            className={theme === 'fog' ? 'fx-fogband' : 'fx-cloud'}
            style={{
              top: `${p.top}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
              transform: `scale(${p.scale})`,
            }}
          />
        ))}

      {theme === 'clear-night' &&
        particles.map((p) => (
          <span
            key={p.key}
            className="fx-star"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

      {theme === 'clear' &&
        particles.map((p) => (
          <span
            key={p.key}
            className="fx-bokeh"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

      {theme === 'storm' && <span className="fx-flash" />}
    </div>
  )
}
