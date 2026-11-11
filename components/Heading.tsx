import type { ComponentProps } from 'react'

type Tag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * Nextra 3.3.1 builds its heading components inside getComponents(), which its layout calls on every
 * render, so Next's post-hydration router update hands React new component types and every h2-h6 is
 * unmounted and mounted again. Module-level components keep the types stable. Same output as
 * Nextra's: the id, the permalink anchor with its label, and the sr-only mapping.
 */
function make(Tag: Tag) {
  function Heading({ children, id, className, ...props }: ComponentProps<Tag>) {
    return (
      <Tag id={id} className={className === 'sr-only' ? '_sr-only' : className} {...props}>
        {children}
        {id ? <a href={`#${id}`} className="nextra-focus subheading-anchor" aria-label="Permalink for this section" /> : null}
      </Tag>
    )
  }
  Heading.displayName = Tag
  return Heading
}

export const headings = { h2: make('h2'), h3: make('h3'), h4: make('h4'), h5: make('h5'), h6: make('h6') }
