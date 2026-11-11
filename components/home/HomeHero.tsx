import { useConfig } from 'nextra-theme-docs'
import { SearchTrigger } from '../chrome/SearchTrigger'
import { HexGrid } from './HexGrid'

/** The home's masthead: the page's own title and description over a honeycomb, and a wide search. */
export function HomeHero() {
  const fm = useConfig().frontMatter as Record<string, string | undefined>
  return (
    <section data-testid="home-hero" className="dx-hero">
      <HexGrid />
      <div className="in">
        <span className="kicker">Welcome</span>
        <h1>{fm['title']}</h1>
        <p className="lead">{fm['description']}</p>
        <SearchTrigger className="hero-s" />
      </div>
    </section>
  )
}
