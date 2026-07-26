export function formatElapsed(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}

export function niceCeil(value, step) {
  return Math.max(step, Math.ceil(value / step) * step)
}
