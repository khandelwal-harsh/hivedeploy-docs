export function SwarmMark({ className = 'swarm' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="cell" d="M32 19 46.72 27.5V44.5L32 53 17.28 44.5V27.5Z" />
      <path className="cell lit" d="M68 19 82.72 27.5V44.5L68 53 53.28 44.5V27.5Z" />
      <path className="cell" d="M50 50 64.72 58.5V75.5L50 84 35.28 75.5V58.5Z" />
    </svg>
  )
}
