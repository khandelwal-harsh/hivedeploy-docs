'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { track } from '@vercel/analytics'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

type Stage = 'initial' | 'comment' | 'thanks'

export function FeedbackWidget() {
  const router = useRouter()
  const page = router.asPath
  const [stage, setStage] = useState<Stage>('initial')
  const [verdict, setVerdict] = useState<'up' | 'down' | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(v: 'up' | 'down', commentText: string) {
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, verdict: v, comment: commentText }),
      })
      track(v === 'up' ? 'docs_feedback_up' : 'docs_feedback_down', { page })
    } catch {
      // Best effort; we don't block UI on failure
    } finally {
      setSubmitting(false)
      setStage('thanks')
    }
  }

  function handleUp() {
    setVerdict('up')
    void submit('up', '')
  }

  function handleDown() {
    setVerdict('down')
    setStage('comment')
  }

  function handleSubmitComment(e: FormEvent) {
    e.preventDefault()
    void submit('down', comment)
  }

  function handleSkip() {
    void submit('down', '')
  }

  if (stage === 'thanks') {
    return (
      <div style={feedbackContainerStyle}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground-muted)' }}>
          Thanks for the feedback.
        </span>
      </div>
    )
  }

  if (stage === 'comment') {
    return (
      <form onSubmit={handleSubmitComment} style={feedbackContainerStyle}>
        <label
          htmlFor="feedback-comment"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground-muted)', display: 'block', marginBottom: '0.5rem' }}
        >
          What&apos;s missing or wrong? (optional)
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.75rem',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button type="submit" disabled={submitting} style={buttonStyle}>
            Submit
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitting}
            style={{ ...buttonStyle, background: 'transparent', border: 'none', color: 'var(--foreground-muted)' }}
          >
            Skip
          </button>
        </div>
      </form>
    )
  }

  return (
    <div style={feedbackContainerStyle}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--foreground-muted)',
          marginRight: '1rem',
        }}
      >
        Was this page helpful?
      </span>
      <button type="button" onClick={handleUp} aria-label="Yes, this page was helpful" style={buttonStyle}>
        <ThumbsUp size={14} /> Yes
      </button>
      <button type="button" onClick={handleDown} aria-label="No, this page was not helpful" style={buttonStyle}>
        <ThumbsDown size={14} /> No
      </button>
    </div>
  )
}

const feedbackContainerStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  padding: '1rem 0',
  marginTop: '3rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const buttonStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-strong)',
  borderRadius: '0.375rem',
  padding: '0.375rem 0.75rem',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
}
