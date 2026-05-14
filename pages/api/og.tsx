import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'

export const config = { runtime: 'edge' }

const COLORS = {
  surface1: '#0f0f0f',
  foreground: '#ededed',
  foregroundStrong: '#fafafa',
  foregroundMuted: '#888',
  foregroundFaint: '#555',
  info: '#60a5fa',
  border: '#1f1f1f',
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
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: COLORS.foregroundStrong,
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: COLORS.info,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.surface1,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            h
          </div>
          <span>hivedeploy</span>
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
