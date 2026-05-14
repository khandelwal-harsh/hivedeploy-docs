import { ReactNode } from 'react'
import { Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'

type CalloutType = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  type?: CalloutType
  children: ReactNode
}

const config: Record<CalloutType, { color: string; icon: typeof Info; label: string }> = {
  info: { color: 'var(--info)', icon: Info, label: 'Note' },
  warning: { color: 'var(--warn)', icon: AlertTriangle, label: 'Warning' },
  error: { color: 'var(--fail)', icon: XCircle, label: 'Error' },
  success: { color: 'var(--ok)', icon: CheckCircle2, label: 'Success' },
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const { color, icon: Icon, label } = config[type]
  return (
    <div
      role="note"
      aria-label={label}
      style={{
        background: 'var(--surface-1)',
        borderLeft: `3px solid ${color}`,
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        margin: '1.5rem 0',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}
    >
      <Icon
        size={20}
        style={{ color, flexShrink: 0, marginTop: '0.125rem' }}
        aria-hidden="true"
      />
      <div style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}
