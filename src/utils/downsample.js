export function downsample(points, maxPoints) {
  if (points.length <= maxPoints) return points
  const stride = points.length / maxPoints
  const out = []
  for (let i = 0; i < maxPoints; i++) {
    out.push(points[Math.floor(i * stride)])
  }
  out.push(points[points.length - 1])
  return out
}
