import { useEffect, useState, type FormEvent } from 'react'
import { possessive } from '../format.ts'
import { QUESTIONS } from '../questions.ts'
import type { Entry, SlamBook } from '../types.ts'
import { Rings } from './Doodles.tsx'

interface SignFormProps {
  book: SlamBook
  entry?: Entry
  onCancel: () => void
  onSave: (answers: Record<string, string>) => void
}

export function SignForm({ book, entry, onCancel, onSave }: SignFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...entry?.answers }))
  const [tried, setTried] = useState(false)
  const about = QUESTIONS.filter((question) => question.page === 'about')
  const notes = QUESTIONS.filter((question) => question.page === 'note')
  const heading = entry ? 'Revise your page' : `Sign ${possessive(book.ownerName)} book`

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    const missing = QUESTIONS.some((question) => question.required && !(answers[question.id] ?? '').trim())
    if (missing) return

    const cleaned: Record<string, string> = {}
    for (const question of QUESTIONS) cleaned[question.id] = (answers[question.id] ?? '').trim()
    onSave(cleaned)
  }

  return (
    <form className="reader" onSubmit={handleSubmit}>
      <div className="toolbar">
        <button type="button" className="wordmark" onClick={onCancel}>
          E-Slam <em>Book</em>
        </button>
        <h1 className="toolbar-book">{heading}</h1>
        <p className="fine toolbar-note">Your name and a note are the two lines that matter most.</p>
      </div>

      <div className={`book theme-${book.theme}`}>
        <Rings />
        <section className="page page-left" aria-label="About you">
          <p className="page-kicker">About me</p>
          <div className="write-list">
            {about.map((question) => (
              <WriteField
                key={question.id}
                id={question.id}
                label={question.label}
                hint={question.hint}
                kind={question.kind}
                max={question.max}
                required={question.required}
                value={answers[question.id] ?? ''}
                invalid={Boolean(tried && question.required && !(answers[question.id] ?? '').trim())}
                onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
              />
            ))}
          </div>
        </section>
        <section className="page page-right" aria-label={`A note for ${book.ownerName}`}>
          <p className="page-kicker">For {book.ownerName}</p>
          <div className="write-list">
            {notes.map((question) => (
              <WriteField
                key={question.id}
                id={question.id}
                label={question.label}
                hint={question.hint}
                kind={question.kind}
                max={question.max}
                required={question.required}
                value={answers[question.id] ?? ''}
                invalid={Boolean(tried && question.required && !(answers[question.id] ?? '').trim())}
                onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="pager">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <p>Blue ink, long answers welcome.</p>
        <button type="submit" className="btn primary">
          {entry ? 'Save this page' : 'Sign the book'}
        </button>
      </div>
    </form>
  )
}

interface WriteFieldProps {
  id: string
  label: string
  hint: string
  kind: 'short' | 'long'
  max: number
  required?: boolean
  value: string
  invalid: boolean
  onChange: (value: string) => void
}

function WriteField({ id, label, hint, kind, max, required, value, invalid, onChange }: WriteFieldProps) {
  const fieldId = `sign-${id}`
  return (
    <label className={invalid ? 'write-field invalid' : 'write-field'} htmlFor={fieldId}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {kind === 'long' ? (
        <textarea
          id={fieldId}
          className="line-input"
          placeholder={hint}
          maxLength={max}
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={fieldId}
          className="line-input"
          placeholder={hint}
          maxLength={max}
          value={value}
          autoComplete={id === 'name' ? 'name' : 'off'}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {invalid && <small>Add this before you sign.</small>}
    </label>
  )
}
