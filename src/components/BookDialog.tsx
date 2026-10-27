import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { THEMES, type BookDraft } from '../types.ts'

interface BookDialogProps {
  heading: string
  submitLabel: string
  initial: BookDraft
  onCancel: () => void
  onSave: (draft: BookDraft) => void
}

export function BookDialog({ heading, submitLabel, initial, onCancel, onSave }: BookDialogProps) {
  const titleId = useId()
  const firstField = useRef<HTMLInputElement>(null)
  const onCancelRef = useRef(onCancel)
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')

  useEffect(() => {
    onCancelRef.current = onCancel
  })

  useEffect(() => {
    firstField.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancelRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const ownerName = draft.ownerName.trim()
    const title = draft.title.trim()
    if (!ownerName || !title) {
      setError('Add your name and a title for the cover.')
      return
    }
    onSave({
      ownerName,
      title,
      dedication: draft.dedication.trim(),
      theme: draft.theme,
    })
  }

  return (
    <div className="overlay" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="brand-kicker">Stationery</p>
        <h2 id={titleId}>{heading}</h2>
        <form onSubmit={handleSubmit}>
          <label className="stack">
            <span>Your name</span>
            <input
              ref={firstField}
              value={draft.ownerName}
              maxLength={80}
              autoComplete="name"
              onChange={(event) => setDraft({ ...draft, ownerName: event.target.value })}
            />
          </label>
          <label className="stack">
            <span>Title on the cover</span>
            <input
              value={draft.title}
              maxLength={80}
              placeholder="The Long Recess"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label className="stack">
            <span>A line for the inside cover</span>
            <textarea
              rows={3}
              maxLength={180}
              value={draft.dedication}
              onChange={(event) => setDraft({ ...draft, dedication: event.target.value })}
            />
          </label>
          <fieldset className="swatch-field">
            <legend>Cover color</legend>
            <div className="swatches">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`swatch theme-${theme.id}`}
                  aria-label={theme.label}
                  aria-pressed={draft.theme === theme.id}
                  onClick={() => setDraft({ ...draft, theme: theme.id })}
                />
              ))}
            </div>
          </fieldset>
          {error && <p className="form-error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
