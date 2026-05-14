'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

export function ScalarReference() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: { url: '/openapi.json' },
        theme: 'none',
        layout: 'modern',
        hideClientButton: false,
        hideDownloadButton: false,
      }}
    />
  )
}
