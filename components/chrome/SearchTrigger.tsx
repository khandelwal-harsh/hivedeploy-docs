import { openSearch } from '../../lib/search-store'

/** The header's trigger is `search-trigger`; the drawer's copy (no className) is `search-trigger-menu`.
 *  Its name is its visible text (WCAG 2.5.3); where the text is hidden it is only visually hidden, so the name stays. */
export function SearchTrigger({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      data-testid={className.includes('hdr-s') || className.includes('hero-s') ? 'search-trigger' : 'search-trigger-menu'}
      className={`dx-search ${className}`.trim()}
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
