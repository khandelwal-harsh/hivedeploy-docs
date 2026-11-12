const W = 1440
const H = 420
const R = 26
// Honeycomb cells (col, row) that carry the accent: wireframe docs.py `_hexsvg`.
const LIT = new Set(['3,1', '6,3', '8,0', '23,1', '26,3', '29,0', '4,5', '25,5'])

function cells() {
  const dx = Math.sqrt(3) * R
  const dy = 1.5 * R
  const out: { key: string; points: string; lit: boolean }[] = []
  for (let row = 0; row < Math.floor(H / dy) + 2; row++) {
    for (let col = 0; col < Math.floor(W / dx) + 2; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0)
      const cy = row * dy
      const points = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k + Math.PI / 6
        return `${(cx + (R - 3) * Math.cos(a)).toFixed(1)},${(cy + (R - 3) * Math.sin(a)).toFixed(1)}`
      }).join(' ')
      out.push({ key: `${col},${row}`, points, lit: LIT.has(`${col},${row}`) })
    }
  }
  return out
}
const CELLS = cells()

/** The hero's decorative honeycomb: static, hidden from assistive tech. */
export function HexGrid() {
  return (
    <svg className="hexsvg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <g fill="none" stroke="rgba(255,255,255,.075)" strokeWidth="1">
        {CELLS.map((c) => (
          <polygon key={c.key} points={c.points} className={c.lit ? 'lit' : undefined} />
        ))}
      </g>
    </svg>
  )
}
