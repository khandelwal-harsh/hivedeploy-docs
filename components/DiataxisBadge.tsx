export type DiataxisType = 'tutorial' | 'how-to' | 'reference' | 'explanation'

interface DiataxisBadgeProps {
  type: DiataxisType
}

export const DIATAXIS_LABELS: Record<DiataxisType, string> = {
  tutorial: 'Tutorial',
  'how-to': 'How-to',
  reference: 'Reference',
  explanation: 'Explanation',
}

export function isDiataxis(v: unknown): v is DiataxisType {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(DIATAXIS_LABELS, v)
}

/** One neutral pill; the four kinds differ by the word only. */
export function DiataxisBadge({ type }: DiataxisBadgeProps) {
  return (
    <span className="dx-badge">
      <i aria-hidden="true" />
      {DIATAXIS_LABELS[type]}
    </span>
  )
}
