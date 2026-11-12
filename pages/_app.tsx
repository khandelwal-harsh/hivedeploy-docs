import type { AppProps } from 'next/app'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import { SearchPalette } from '../components/search/SearchPalette'
import '../styles/globals.css'
import '../styles/nextra-overrides.css'
import '../styles/components.css'
import '../styles/scalar-overrides.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        html {
          --font-geist-sans: ${GeistSans.style.fontFamily};
          --font-geist-mono: ${GeistMono.style.fontFamily};
        }
      `}</style>
      <div className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Component {...pageProps} />
        <SearchPalette />
      </div>
      <Analytics />
    </>
  )
}
