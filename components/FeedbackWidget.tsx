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
      <div className="dx-fb">
        <span className="q">Thanks for the feedback.</span>
      </div>
    )
  }

  if (stage === 'comment') {
    return (
      <form onSubmit={handleSubmitComment} className="dx-fb comment">
        <label htmlFor="feedback-comment" className="q">
          What&apos;s missing or wrong? (optional)
        </label>
        <textarea id="feedback-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={1000} />
        <div className="acts">
          <button type="submit" disabled={submitting} className="btn glass">
            Submit
          </button>
          <button type="button" onClick={handleSkip} disabled={submitting} className="btn ghost">
            Skip
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="dx-fb">
      <span className="q">Was this page helpful?</span>
      <button type="button" onClick={handleUp} aria-label="Yes, this page was helpful" className="btn glass">
        <ThumbsUp size={14} aria-hidden="true" /> Yes
      </button>
      <button type="button" onClick={handleDown} aria-label="No, this page was not helpful" className="btn glass">
        <ThumbsDown size={14} aria-hidden="true" /> No
      </button>
    </div>
  )
}
