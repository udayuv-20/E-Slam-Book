import { useEffect } from 'react'
import { displayName, firstName, formatDate, monogram } from '../format.ts'
import { QUESTIONS, type Question } from '../questions.ts'
import type { Entry, SlamBook } from '../types.ts'
import { EmptyDoodle, Rings, Sticker } from './Doodles.tsx'

interface OpenBookProps {
  book: SlamBook
  spread: number
  onSpread: (spread: number) => void
  onBack: () => void
  onSign: () => void
  onEditCover: () => void
  onEditEntry: (entryId: string) => void
  onDeleteEntry: (entry: Entry) => void
  onDeleteBook: () => void
  onCopyEntry: (entry: Entry) => void
  onDownload: () => void
  onShare?: () => void
  hotkeys: boolean
}

export function OpenBook({
  book,
  spread,
  onSpread,
  onBack,
  onSign,
  onEditCover,
  onEditEntry,
  onDeleteEntry,
  onDeleteBook,
  onCopyEntry,
  onDownload,
  onShare,
  hotkeys,
}: OpenBookProps) {
  const safeSpread = Math.min(Math.max(spread, 0), book.entries.length)
  const entry = safeSpread === 0 ? undefined : book.entries[safeSpread - 1]

  useEffect(() => {
    if (!hotkeys) return
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowLeft' && safeSpread > 0) {
        event.preventDefault()
        onSpread(safeSpread - 1)
      }
      if (event.key === 'ArrowRight' && safeSpread < book.entries.length) {
        event.preventDefault()
        onSpread(safeSpread + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [book.entries.length, hotkeys, onSpread, safeSpread])

  const pageLabel = entry ? displayName(entry) : 'Inside cover'

  return (
    <div className="reader">
      <div className="toolbar">
        <button type="button" className="wordmark" onClick={onBack}>
          E-Slam <em>Book</em>
          <span className="sr-only">Back to the shelf</span>
        </button>
        <h1 className="toolbar-book">
          {book.title}
          {book.sample ? ' · Sample' : ''}
        </h1>
        <div className="toolbar-actions">
          {onShare && (
            <button type="button" className="btn ghost small" onClick={onShare}>
              Copy link
            </button>
          )}
          <button type="button" className="btn primary small" onClick={onSign}>
            Sign this book
          </button>
        </div>
      </div>

      <div className={`book theme-${book.theme}`} key={safeSpread}>
        <Rings />
        {entry ? (
          <EntrySpread
            book={book}
            entry={entry}
            index={safeSpread}
            onEdit={() => onEditEntry(entry.id)}
            onCopy={() => onCopyEntry(entry)}
            onDelete={() => onDeleteEntry(entry)}
          />
        ) : (
          <IntroSpread book={book} onSpread={onSpread} onSign={onSign} onEditCover={onEditCover} onDownload={onDownload} onDeleteBook={onDeleteBook} />
        )}
      </div>

      <div className="pager">
        <button type="button" className="btn ghost" onClick={() => onSpread(safeSpread - 1)} disabled={safeSpread === 0}>
          Previous
        </button>
        <p aria-live="polite">
          {pageLabel}
          <span className="pager-count">
            {' '}
            · {safeSpread + 1} / {book.entries.length + 1}
          </span>
        </p>
        <button
          type="button"
          className="btn ghost"
          onClick={() => onSpread(safeSpread + 1)}
          disabled={safeSpread >= book.entries.length}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function IntroSpread({
  book,
  onSpread,
  onSign,
  onEditCover,
  onDownload,
  onDeleteBook,
}: {
  book: SlamBook
  onSpread: (spread: number) => void
  onSign: () => void
  onEditCover: () => void
  onDownload: () => void
  onDeleteBook: () => void
}) {
  return (
    <>
      <section className="page page-left">
        <p className="page-kicker">This book belongs to</p>
        <div className="monogram" aria-hidden="true">
          {monogram(book.ownerName)}
        </div>
        <h2 className="owner-name">{book.ownerName}</h2>
        {book.dedication && <blockquote className="dedication">{book.dedication}</blockquote>}
        <p className="meta">Started {formatDate(book.createdAt)}</p>
        <div className="inside-actions">
          <button type="button" className="btn ghost small" onClick={onEditCover}>
            Change the cover
          </button>
          <button type="button" className="btn ghost small" onClick={onDownload}>
            Download this book
          </button>
          <button type="button" className="btn danger" onClick={onDeleteBook}>
            Take off the shelf
          </button>
        </div>
        <span className="page-no">i</span>
      </section>
      <section className="page page-right">
        <p className="page-kicker">Who has signed</p>
        {book.entries.length === 0 ? (
          <div className="empty-page">
            <EmptyDoodle />
            <h2>The first page is still blank.</h2>
            <p>Ask a friend to fill it in, or write the first one yourself.</p>
            <button type="button" className="btn primary" onClick={onSign}>
              Leave the first signature
            </button>
          </div>
        ) : (
          <div className="toc">
            {book.entries.map((entry, index) => (
              <button key={entry.id} type="button" className="toc-row" onClick={() => onSpread(index + 1)}>
                <span className="toc-num">{pad(index + 1)}</span>
                <span className="toc-name">{displayName(entry)}</span>
                <span className="toc-date">{formatDate(entry.signedAt)}</span>
              </button>
            ))}
            <button type="button" className="text-btn toc-add" onClick={onSign}>
              Add another page
            </button>
          </div>
        )}
        <span className="page-no">ii</span>
      </section>
    </>
  )
}

function EntrySpread({
  book,
  entry,
  index,
  onEdit,
  onCopy,
  onDelete,
}: {
  book: SlamBook
  entry: Entry
  index: number
  onEdit: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const about = QUESTIONS.filter((question) => question.page === 'about' && question.id !== 'name')
  const notes = QUESTIONS.filter((question) => question.page === 'note' && question.id !== 'message')
  const message = entry.answers.message?.trim()

  return (
    <>
      <section className="page page-left">
        <p className="page-kicker">Signature {pad(index)}</p>
        <h2 className="signer-name">{displayName(entry)}</h2>
        <WrittenFields questions={about} answers={entry.answers} />
        <span className="page-no">{pad(index)}</span>
      </section>
      <section className="page page-right">
        <Sticker seed={entry.id} />
        <p className="page-kicker">For {firstName(book.ownerName)}</p>
        <WrittenFields questions={notes} answers={entry.answers} />
        <article className="note-card">
          <h3>A note, just for you</h3>
          <p className={message ? undefined : 'blank'}>{message || '—'}</p>
        </article>
        <p className="signed-on">Signed {formatDate(entry.signedAt)}</p>
        <div className="entry-actions">
          <button type="button" className="text-btn" onClick={onEdit}>
            Revise this page
          </button>
          <button type="button" className="text-btn" onClick={onCopy}>
            Copy the words
          </button>
          <button type="button" className="text-btn" onClick={onDelete}>
            Tear out
          </button>
        </div>
        <span className="page-no">{pad(index)}</span>
      </section>
    </>
  )
}

function WrittenFields({ questions, answers }: { questions: Question[]; answers: Record<string, string> }) {
  return (
    <dl className="facts">
      {questions.map((question) => {
        const value = answers[question.id]?.trim()
        return (
          <div className={question.kind === 'long' ? 'fact fact-long' : 'fact'} key={question.id}>
            <dt>{question.label}</dt>
            <dd className={value ? 'hand' : 'blank'}>{value || '—'}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}
