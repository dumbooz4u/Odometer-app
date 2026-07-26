export function lerpColor(t, [r1, g1, b1], [r2, g2, b2]) {
  const k = Math.max(0, Math.min(1, t))
  const r = Math.round(r1 + (r2 - r1) * k)
  const g = Math.round(g1 + (g2 - g1) * k)
  const b = Math.round(b1 + (b2 - b1) * k)
  return `rgb(${r}, ${g}, ${b})`
}
