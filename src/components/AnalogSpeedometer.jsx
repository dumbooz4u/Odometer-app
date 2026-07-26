import { useMemo } from 'react'
import { lerpColor } from '../utils/color'

const VIEW = 240
const CENTER = VIEW / 2
const RADIUS = 96
// Classic automotive gauge sweep: starts bottom-left, arcs up over the top,
// ends bottom-right — 270 degrees measured clockwise in SVG's y-down space.
const START_ANGLE = 135
const SWEEP = 270
const GAUGE_MAX = { kmh: 200, mph: 120 }
const GAUGE_STEP = { kmh: 20, mph: 20 }
const NEEDLE_COLOR_LOW = [87, 165, 240]
const NEEDLE_COLOR_HIGH = [255, 140, 70]

function toDisplaySpeed(speedMs, unit) {
  return unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
}

function angleForFraction(frac) {
  return START_ANGLE + frac * SWEEP
}

function polar(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function arcPath(radius, fromFrac, toFrac) {
  const a0 = angleForFraction(fromFrac)
  const a1 = angleForFraction(toFrac)
  const p0 = polar(a0, radius)
  const p1 = polar(a1, radius)
  const largeArc = a1 - a0 > 180 ? 1 : 0
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

export default function AnalogSpeedometer({ speedMs, unit, intensity = 0 }) {
  const max = GAUGE_MAX[unit] ?? GAUGE_MAX.kmh
  const step = GAUGE_STEP[unit] ?? GAUGE_STEP.kmh
  const speed = toDisplaySpeed(speedMs, unit)
  const frac = Math.max(0, Math.min(1, speed / max))

  const needleColor = useMemo(() => lerpColor(intensity, NEEDLE_COLOR_LOW, NEEDLE_COLOR_HIGH), [intensity])

  const ticks = []
  for (let v = 0; v <= max; v += step) ticks.push(v)

  const needleAngle = angleForFraction(frac)
  const needleTip = polar(needleAngle, RADIUS - 16)
  const needleTail = polar(needleAngle + 180, 16)

  return (
    <div className="analog-gauge">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="analog-gauge-svg"
        role="img"
        aria-label={`Analog speedometer showing ${speed.toFixed(0)} ${unit === 'mph' ? 'mph' : 'km/h'}`}
      >
        <path d={arcPath(RADIUS, 0, 1)} className="gauge-track" />
        {frac > 0 && <path d={arcPath(RADIUS, 0, frac)} className="gauge-progress" style={{ stroke: needleColor }} />}

        {ticks.map((v) => {
          const f = v / max
          const angle = angleForFraction(f)
          const outer = polar(angle, RADIUS + 2)
          const inner = polar(angle, RADIUS - 10)
          const labelPos = polar(angle, RADIUS - 26)
          return (
            <g key={v}>
              <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className="gauge-tick" />
              <text x={labelPos.x} y={labelPos.y} className="gauge-tick-label" textAnchor="middle" dominantBaseline="middle">
                {v}
              </text>
            </g>
          )
        })}

        <line
          x1={needleTail.x}
          y1={needleTail.y}
          x2={needleTip.x}
          y2={needleTip.y}
          className="gauge-needle"
          style={{ stroke: needleColor }}
        />
        <circle cx={CENTER} cy={CENTER} r="7" className="gauge-hub" style={{ fill: needleColor }} />

        <text x={CENTER} y={CENTER + 46} className="gauge-value" textAnchor="middle">
          {speed.toFixed(0)}
        </text>
        <text x={CENTER} y={CENTER + 62} className="gauge-unit" textAnchor="middle">
          {unit === 'mph' ? 'mph' : 'km/h'}
        </text>
      </svg>
    </div>
  )
}
