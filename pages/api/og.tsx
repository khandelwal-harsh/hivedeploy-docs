import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'

export const config = { runtime: 'edge' }

const COLORS = {
  surface1: '#08080A',
  foreground: '#D6D6D2',
  foregroundStrong: '#F5F5F2',
  foregroundMuted: '#9A9A96',
  foregroundFaint: '#82827F',
  accent: '#F5B301',
  onAccent: '#1A1200',
  border: 'rgba(255,255,255,0.16)',
}

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') ?? 'Hivedeploy docs').slice(0, 100)
  const section = (searchParams.get('section') ?? '').slice(0, 40)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: COLORS.surface1,
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: COLORS.foregroundStrong,
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 100 100">
            <path d="M32 19 46.72 27.5V44.5L32 53 17.28 44.5V27.5Z" fill="none" stroke={COLORS.border} strokeWidth="5.5" strokeLinejoin="round" />
            <path d="M68 19 82.72 27.5V44.5L68 53 53.28 44.5V27.5Z" fill={COLORS.accent} />
            <path d="M50 50 64.72 58.5V75.5L50 84 35.28 75.5V58.5Z" fill="none" stroke={COLORS.border} strokeWidth="5.5" strokeLinejoin="round" />
          </svg>
          <span>HiveDeploy</span>
          <span style={{ color: COLORS.foregroundFaint }}>/</span>
          <span style={{ color: COLORS.foregroundMuted }}>docs</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexGrow: 1,
            gap: '24px',
            maxWidth: '900px',
          }}
        >
          {section && (
            <div
              style={{
                fontSize: 24,
                color: COLORS.foregroundMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {section}
            </div>
          )}
          <div
            style={{
              fontSize: 64,
              color: COLORS.foregroundStrong,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 80,
            fontSize: 20,
            color: COLORS.foregroundFaint,
          }}
        >
          docs.hivedeploy.in
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=31536000',
      },
    },
  )
}
