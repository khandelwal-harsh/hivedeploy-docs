import { openSearch } from '../../lib/search-store'

export function SearchTrigger({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      data-testid="search-trigger"
      className={`dx-search ${className}`.trim()}
      aria-label="Search documentation"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => openSearch()}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <span className="ph">Search documentation…</span>
      <span className="kbd" aria-hidden="true">⌘K</span>
    </button>
  )
}
