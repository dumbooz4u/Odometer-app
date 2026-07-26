import { useMemo, useRef, useState } from 'react'
import { formatElapsed, niceCeil } from '../utils/format'
import { downsample } from '../utils/downsample'

const VIEW_W = 600
const VIEW_H = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 40 }
const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom
const MAX_PLOTTED_POINTS = 300
const Y_STEP = { kmh: 20, mph: 10 }
const MIN_DOMAIN_SECONDS = 60

function toDisplaySpeed(speedMs, unit) {
  return unit === 'mph' ? speedMs * 2.236936 : speedMs * 3.6
}

export default function SpeedChart({ samples, startedAt, unit, live = true }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [showTable, setShowTable] = useState(false)

  const points = useMemo(() => {
    if (!startedAt || samples.length === 0) return []
    return samples.map((s) => ({
      elapsedSec: (s.t - startedAt) / 1000,
      speed: toDisplaySpeed(s.speedMs, unit),
      t: s.t,
    }))
  }, [samples, startedAt, unit])

  const plotted = useMemo(() => downsample(points, MAX_PLOTTED_POINTS), [points])

  const maxElapsed = Math.max(MIN_DOMAIN_SECONDS, points.at(-1)?.elapsedSec ?? 0)
  const maxSpeed = niceCeil(Math.max(...points.map((p) => p.speed), 1), Y_STEP[unit] ?? 20)

  const xScale = (sec) => PAD.left + (sec / maxElapsed) * PLOT_W
  const yScale = (speed) => PAD.top + PLOT_H - (speed / maxSpeed) * PLOT_H

  const linePath = plotted
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.elapsedSec).toFixed(1)},${yScale(p.speed).toFixed(1)}`)
    .join(' ')

  const areaPath = plotted.length
    ? `${linePath} L${xScale(plotted.at(-1).elapsedSec).toFixed(1)},${PAD.top + PLOT_H} L${xScale(plotted[0].elapsedSec).toFixed(1)},${PAD.top + PLOT_H} Z`
    : ''

  const last = points.at(-1)
  const maxPoint = points.reduce((best, p) => (p.speed > (best?.speed ?? -1) ? p : best), null)

  const yTicks = []
  for (let v = 0; v <= maxSpeed; v += Y_STEP[unit] ?? 20) yTicks.push(v)

  const xTickCount = 4
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => (maxElapsed / xTickCount) * i)

  function handlePointer(clientX) {
    const svg = svgRef.current
    if (!svg || points.length === 0) return
    const rect = svg.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const targetSec = ratio * maxElapsed

    // points are time-ordered, so binary-search to the insertion point
    // instead of a linear scan (matters once a long drive has thousands).
    let lo = 0
    let hi = points.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (points[mid].elapsedSec < targetSec) lo = mid + 1
      else hi = mid
    }
    const prevIdx = Math.max(0, lo - 1)
    const nearest =
      Math.abs(points[prevIdx].elapsedSec - targetSec) <= Math.abs(points[lo].elapsedSec - targetSec) ? prevIdx : lo

    setHoverIndex(nearest)
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const tableRows = points.slice(-20).reverse()

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h2>Speed over time</h2>
        <div className="chart-summary">
          {last
            ? `${last.speed.toFixed(0)} ${unit === 'mph' ? 'mph' : 'km/h'} ${live ? 'now' : 'final'}`
            : 'Waiting for data…'}
          {maxPoint && ` · max ${maxPoint.speed.toFixed(0)} ${unit === 'mph' ? 'mph' : 'km/h'}`}
        </div>
      </div>

      {points.length < 2 ? (
        <div className="chart-empty">{live ? 'Collecting speed samples…' : 'No speed data recorded'}</div>
      ) : (
        <>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="chart-svg"
            role="img"
            aria-label={`Line chart of speed over time. Current speed ${last.speed.toFixed(0)} ${unit}, max ${maxPoint.speed.toFixed(0)} ${unit}.`}
            onPointerMove={(e) => handlePointer(e.clientX)}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="speed-area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3987e5" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#3987e5" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={VIEW_W - PAD.right}
                  y1={yScale(v)}
                  y2={yScale(v)}
                  className="chart-gridline"
                />
                <text x={PAD.left - 8} y={yScale(v)} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                  {v}
                </text>
              </g>
            ))}

            {xTicks.map((sec) => (
              <text
                key={sec}
                x={xScale(sec)}
                y={VIEW_H - 8}
                className="chart-axis-label"
                textAnchor={sec === 0 ? 'start' : sec === maxElapsed ? 'end' : 'middle'}
              >
                {formatElapsed(sec)}
              </text>
            ))}

            <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + PLOT_H} className="chart-baseline" />
            <line x1={PAD.left} x2={VIEW_W - PAD.right} y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H} className="chart-baseline" />

            <path d={areaPath} className="chart-area" />
            <path d={linePath} className="chart-line" />

            {last && (
              <circle cx={xScale(last.elapsedSec)} cy={yScale(last.speed)} r="4" className="chart-live-dot" />
            )}

            {hovered && (
              <>
                <line
                  x1={xScale(hovered.elapsedSec)}
                  x2={xScale(hovered.elapsedSec)}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                  className="chart-crosshair"
                />
                <circle cx={xScale(hovered.elapsedSec)} cy={yScale(hovered.speed)} r="5" className="chart-hover-dot" />
              </>
            )}
          </svg>

          {hovered && (
            <div className="chart-tooltip">
              {formatElapsed(hovered.elapsedSec)} · {hovered.speed.toFixed(0)} {unit === 'mph' ? 'mph' : 'km/h'}
            </div>
          )}

          <button className="chart-table-toggle" onClick={() => setShowTable((v) => !v)}>
            {showTable ? 'Hide data table' : 'Show data table'}
          </button>

          {showTable && (
            <div className="chart-table-wrap">
              <table className="chart-table">
                <thead>
                  <tr>
                    <th>Elapsed</th>
                    <th>Speed ({unit === 'mph' ? 'mph' : 'km/h'})</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((p) => (
                    <tr key={p.t}>
                      <td>{formatElapsed(p.elapsedSec)}</td>
                      <td>{p.speed.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="chart-table-note">Showing the most recent {tableRows.length} of {points.length} samples.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
