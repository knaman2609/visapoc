/* Shared geometry helpers for the map generator. */

export const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`

/** Drop every edge that appears twice in opposite directions — the interior. */
export function dissolve(rings) {
  const seen = new Map()
  for (const r of rings) {
    for (let i = 0; i < r.length - 1; i++) {
      const a = key(r[i]); const b = key(r[i + 1])
      if (a === b) continue
      if (seen.has(`${b}|${a}`)) seen.delete(`${b}|${a}`)
      else seen.set(`${a}|${b}`, [r[i], r[i + 1]])
    }
  }
  return seen
}

/** Walk the surviving edges back into closed rings. */
export function stitch(edges) {
  const from = new Map()
  for (const [, e] of edges) {
    const k = key(e[0])
    if (!from.has(k)) from.set(k, [])
    from.get(k).push(e)
  }
  const used = new Set()
  const rings = []
  for (const [, list] of from) {
    for (const start of list) {
      if (used.has(start)) continue
      const ring = [start[0]]
      let cur = start
      while (cur && !used.has(cur)) {
        used.add(cur)
        ring.push(cur[1])
        cur = (from.get(key(cur[1])) || []).find((x) => !used.has(x))
      }
      if (ring.length > 3) rings.push(ring)
    }
  }
  return rings
}

/** Douglas–Peucker, run on projected pixels so the tolerance means something. */
export function simplify(pts, tol) {
  if (pts.length < 3) return pts
  const keep = new Uint8Array(pts.length)
  keep[0] = 1; keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [lo, hi] = stack.pop()
    let far = -1; let best = tol
    const [ax, ay] = pts[lo]; const [bx, by] = pts[hi]
    const dx = bx - ax; const dy = by - ay
    const len = Math.hypot(dx, dy)
    for (let i = lo + 1; i < hi; i++) {
      const [px, py] = pts[i]
      const d = len
        ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len
        : Math.hypot(px - ax, py - ay)
      if (d > best) { best = d; far = i }
    }
    if (far !== -1) { keep[far] = 1; stack.push([lo, far], [far, hi]) }
  }
  return pts.filter((_, i) => keep[i])
}

export const mercator = ([lon, lat]) => [
  lon,
  (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
]

// Robinson, from the published table at five-degree steps.
const RX = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962,
  0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322]
const RY = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571,
  0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1]

export const robinson = ([lon, lat]) => {
  const a = Math.min(Math.abs(lat), 90) / 5
  const i = Math.min(17, Math.floor(a))
  const t = a - i
  const x = RX[i] + (RX[i + 1] - RX[i]) * t
  const y = RY[i] + (RY[i + 1] - RY[i]) * t
  return [0.8487 * x * lon, 1.3523 * y * 57.29577951308232 * Math.sign(lat || 1)]
}

/** Fit a set of rings into a viewBox of the given width, y down. */
export function fitter(ringSets, width, pad = 0) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity
  for (const rs of ringSets) for (const r of rs) for (const [x, y] of r) {
    if (x < x0) x0 = x; if (x > x1) x1 = x
    if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  const k = (width - pad * 2) / (x1 - x0)
  const height = (y1 - y0) * k + pad * 2
  return {
    height,
    at: ([x, y]) => [pad + (x - x0) * k, pad + (y1 - y) * k],
  }
}

export const path = (rings, dp = 1) => rings
  .map((r) => `M${r.map(([x, y]) => `${x.toFixed(dp)},${y.toFixed(dp)}`).join('L')}Z`)
  .join('')

/* ── The antimeridian ───────────────────────────────────────────────── */

/** Sutherland–Hodgman against a vertical line; the clip region is convex. */
function clipX(poly, inside, x0) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]; const b = poly[(i + 1) % poly.length]
    const ain = inside(a[0]); const bin = inside(b[0])
    if (ain) out.push(a)
    if (ain !== bin) {
      const t = (x0 - a[0]) / (b[0] - a[0])
      out.push([x0, a[1] + (b[1] - a[1]) * t])
    }
  }
  return out
}

/**
 * Natural Earth stores Russia and Fiji as rings that run straight through
 * ±180°, which any flat projection draws as a band across the whole map. Each
 * ring is unwrapped into one continuous span, then the copies of it that fall
 * inside the map are cut out at the seam.
 */
export function acrossSeam(ring) {
  const un = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    let [lon, lat] = ring[i]
    const prev = un[i - 1][0]
    while (lon - prev > 180) lon -= 360
    while (lon - prev < -180) lon += 360
    un.push([lon, lat])
  }
  const out = []
  for (const shift of [-360, 0, 360]) {
    const moved = un.map(([lon, lat]) => [lon + shift, lat])
    const lo = Math.min(...moved.map((p) => p[0]))
    const hi = Math.max(...moved.map((p) => p[0]))
    if (hi <= -180 || lo >= 180) continue
    const cut = clipX(clipX(moved, (x) => x >= -180, -180), (x) => x <= 180, 180)
    if (cut.length > 3) out.push(cut)
  }
  return out.length ? out : [ring]
}

/** Twice the signed area — used to throw away slivers left by the cut. */
export const area2 = (r) => Math.abs(r.reduce((n, p, i) => {
  const q = r[(i + 1) % r.length]
  return n + p[0] * q[1] - q[0] * p[1]
}, 0))

/** Is a point inside a ring? Ray casting, used to spot enclave boundaries. */
export function inside([px, py], ring) {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}
