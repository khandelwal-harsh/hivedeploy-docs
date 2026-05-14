type DiataxisType = 'tutorial' | 'how-to' | 'reference' | 'explanation'

interface DiataxisBadgeProps {
  type: DiataxisType
}

const labels: Record<DiataxisType, string> = {
  tutorial: 'Tutorial',
  'how-to': 'How-to',
  reference: 'Reference',
  explanation: 'Explanation',
}

const colors: Record<DiataxisType, string> = {
  tutorial: 'var(--ok)',
  'how-to': 'var(--info)',
  reference: 'var(--warn)',
  explanation: 'var(--foreground-muted)',
}

export function DiataxisBadge({ type }: DiataxisBadgeProps) {
  const color = colors[type]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        fontWeight: 500,
        color,
        background: 'color-mix(in srgb, ' + color + ' 10%, transparent)',
        border: '1px solid color-mix(in srgb, ' + color + ' 30%, transparent)',
        borderRadius: '0.375rem',
        padding: '0.125rem 0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <span
        style={{
          width: '0.375rem',
          height: '0.375rem',
          borderRadius: '50%',
          background: color,
        }}
      />
      {labels[type]}
    </span>
  )
}
