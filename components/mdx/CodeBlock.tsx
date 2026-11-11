import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'

type Props = ComponentProps<'pre'> & {
  'data-filename'?: string
  'data-copy'?: string
  'data-language'?: string
  children?: ReactNode
}

const SHELLS = new Set(['bash', 'sh', 'shell', 'zsh'])

/** Chip text: the filename, else "terminal" for shells, else the fence language. Bare fences (none, or Nextra's plaintext default) get none. */
export function chipFor(filename: string | undefined, language: string | undefined): string | null {
  if (filename) return filename
  if (!language || language === 'plaintext') return null
  return SHELLS.has(language) ? 'terminal' : language
}

export function CodeBlock({ children, className, 'data-filename': filename, 'data-copy': copy, 'data-language': language, ...props }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [done, setDone] = useState(false)
  useEffect(() => () => clearTimeout(timer.current), [])
  const chip = chipFor(filename, language)

  async function onCopy() {
    const text = wrap.current?.querySelector('code')?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''))
    } catch {
      return
    }
    setDone(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDone(false), 1200)
  }

  return (
    <div ref={wrap} data-testid="code-block" className="dx-code">
      <div className={chip ? 'dx-code-head' : 'dx-code-head bare'}>
        {chip ? <span className="chip">{chip}</span> : null}
        {copy === '' ? (
          <>
            <button type="button" className={done ? 'dx-copy done' : 'dx-copy'} aria-label="Copy code" onClick={onCopy}>
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
                <path d="M10.5 3.5v-.2A1.8 1.8 0 0 0 8.7 1.5H3.8A1.8 1.8 0 0 0 2 3.3v4.9a1.8 1.8 0 0 0 1.8 1.8h.2" />
              </svg>
              <svg className="ok" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            </button>
            <span className="sr" aria-live="polite">
              {done ? 'Copied' : ''}
            </span>
          </>
        ) : null}
      </div>
      <pre tabIndex={0} data-language={language} className={className} {...props}>
        {children}
      </pre>
    </div>
  )
}
