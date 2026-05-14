import type { AppProps } from 'next/app'
import { JetBrains_Mono, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import '../styles/globals.css'
import '../styles/nextra-overrides.css'
import '../styles/scalar-overrides.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        html {
          --font-mono: ${mono.style.fontFamily};
          --font-sans: ${sans.style.fontFamily};
        }
        body {
          font-family: var(--font-sans);
        }
      `}</style>
      <div className={`${mono.variable} ${sans.variable}`}>
        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  )
}
