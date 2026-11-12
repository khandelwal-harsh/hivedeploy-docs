import Link from 'next/link'
import { FOOTER, WWW } from '../../lib/site'
import { SwarmMark } from './SwarmMark'

function FootLink({ href, children }: { href: string; children: string }) {
  return href.startsWith('/') ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>
}

export function SiteFooter() {
  return (
    <footer className="dx-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="brand" href={WWW}>
              <SwarmMark />
              HiveDeploy
            </a>
            <p className="blurb">{FOOTER.blurb}</p>
            <a className="email" href={`mailto:${FOOTER.email}`}>{FOOTER.email}</a>
          </div>
          {FOOTER.cols.map((c) => (
            <div key={c.title}>
              <h2>{c.title}</h2>
              <ul>
                {c.links.map((l) => (
                  <li key={`${c.title}-${l.label}`}><FootLink href={l.href}>{l.label}</FootLink></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="wordmark" data-text="HIVEDEPLOY" aria-hidden="true">HIVEDEPLOY</div>
        <div className="legal">
          <span>{FOOTER.legal}</span>
          <span>{FOOTER.made}</span>
        </div>
      </div>
    </footer>
  )
}
