import { useRef } from 'react'
import { signatureLabel } from '../format.ts'
import type { SlamBook } from '../types.ts'

interface ShelfProps {
  books: SlamBook[]
  cloud: boolean
  onOpen: (bookId: string) => void
  onCreate: () => void
  onSample: () => void
  onExport: () => void
  onImport: (file: File) => void
}

export function Shelf({ books, cloud, onOpen, onCreate, onSample, onExport, onImport }: ShelfProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="shelf">
      <header className="hero">
        <p className="brand-kicker">A notebook that remembers</p>
        <h1>
          E-Slam <em>Book</em>
        </h1>
        <p className="lede">
          Create a slam book, pass the pages around, and keep every nickname, memory, and note your friends write back.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn primary" onClick={onCreate}>
            Start a slam book
          </button>
          <button type="button" className="btn ghost" onClick={onSample}>
            Read a sample book
          </button>
        </div>
        <p className="fine">
          {cloud
            ? 'Pages are saved in Firebase. Copy a book link when you want a friend to sign the same book.'
            : 'Pages stay in this browser. Download a backup whenever you want a copy you can keep.'}
        </p>
      </header>

      <div className="shelf-bar">
        <h2>Your shelf</h2>
        <div className="toolbar-actions">
          <button type="button" className="btn ghost small" onClick={onExport} disabled={books.length === 0}>
            Download backup
          </button>
          <button type="button" className="btn ghost small" onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onImport(file)
            }}
          />
        </div>
      </div>

      <div className="shelf-grid">
        <button type="button" className="new-card" onClick={onCreate}>
          <span className="plus" aria-hidden="true">
            +
          </span>
          <strong>New slam book</strong>
          <span>Pick a cover, write your name, leave the first page open.</span>
        </button>
        {books.map((book) => {
          const year = new Date(book.createdAt).getFullYear()
          return (
            <button key={book.id} type="button" className="cover-card" onClick={() => onOpen(book.id)}>
              <span className={`cover theme-${book.theme}`}>
                <span className="cover-spine" />
                <span className="cover-face">
                  {book.sample && <span className="sample-chip">Sample</span>}
                  <span className="cover-frame">
                    <span className="cover-kicker">Slam Book</span>
                    <span className="cover-title">{book.title}</span>
                    <span className="cover-foot">
                      <span className="cover-owner">{book.ownerName}</span>
                      <span className="cover-meta">
                        {!Number.isNaN(year) && (
                          <>
                            Est. {year}
                            <br />
                          </>
                        )}
                        {signatureLabel(book.entries.length)}
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
