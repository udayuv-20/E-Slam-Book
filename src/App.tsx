import { useEffect, useRef, useState } from 'react'
import {
  cloudErrorMessage,
  createBook,
  mergeRemote,
  migrateLocalShelf,
  removeBook as deleteCloudBook,
  removeEntry as deleteCloudEntry,
  replaceBook,
  saveEntry,
  subscribeLibrary,
  updateCover,
} from './cloud.ts'
import { BookDialog } from './components/BookDialog.tsx'
import { ConfirmDialog } from './components/ConfirmDialog.tsx'
import { OpenBook } from './components/OpenBook.tsx'
import { Shelf } from './components/Shelf.tsx'
import { SignForm } from './components/SignForm.tsx'
import { entryAsText, slugify } from './format.ts'
import { track } from './firebase.ts'
import { createSampleBook, SAMPLE_BOOK_ID } from './sample.ts'
import { createId, downloadJson, loadBooks, mergeBooks, normalizeImport, saveBooks } from './storage.ts'
import type { BookDraft, Entry, SlamBook } from './types.ts'

type Screen =
  | { kind: 'shelf' }
  | { kind: 'read'; bookId: string; spread: number }
  | { kind: 'sign'; bookId: string; entryId?: string }

type Editor = { mode: 'create' } | { mode: 'edit'; bookId: string } | null

type ConfirmState =
  | { kind: 'book'; bookId: string; title: string }
  | { kind: 'entry'; bookId: string; entryId: string; name: string }
  | null

const EMPTY_DRAFT: BookDraft = {
  ownerName: '',
  title: '',
  dedication: 'For the people who saved me a seat.',
  theme: 'rose',
}

function screenFromLocation(): Screen {
  const bookId = new URLSearchParams(window.location.search).get('book')
  return bookId ? { kind: 'read', bookId, spread: 0 } : { kind: 'shelf' }
}

function rememberBook(bookId: string | null) {
  const url = new URL(window.location.href)
  if (bookId) url.searchParams.set('book', bookId)
  else url.searchParams.delete('book')
  window.history.replaceState({}, '', url)
}

export default function App() {
  const [books, setBooks] = useState<SlamBook[]>([])
  const [source, setSource] = useState<'loading' | 'cloud' | 'local'>('loading')
  const [screen, setScreen] = useState<Screen>(screenFromLocation)
  const [editor, setEditor] = useState<Editor>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null)
  const pendingOps = useRef(new Set<string>())
  const migrated = useRef(false)

  const activeBook = screen.kind === 'shelf' ? undefined : books.find((book) => book.id === screen.bookId)
  const editingBook = editor?.mode === 'edit' ? books.find((book) => book.id === editor.bookId) : undefined
  const signingEntry =
    screen.kind === 'sign' && screen.entryId
      ? activeBook?.entries.find((entry) => entry.id === screen.entryId)
      : undefined

  useEffect(() => {
    let settled = false
    let unsubscribe = () => {}
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      unsubscribe()
      setBooks(loadBooks())
      setSource('local')
      setNotice({
        id: Date.now(),
        text: 'Firebase has not answered yet. Pages are staying in this browser until Firestore is on.',
      })
    }, 12000)

    unsubscribe = subscribeLibrary({
      onChange: (remote) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        setSource('cloud')
        setBooks((local) => {
          const merged = mergeRemote(local, remote, pendingOps.current)
          pendingOps.current = merged.pending
          return merged.books
        })
      },
      onFallback: (error) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        console.error(error)
        setBooks(loadBooks())
        setSource('local')
        setNotice({ id: Date.now(), text: cloudErrorMessage(error) })
      },
      onError: (error) => {
        console.error(error)
        setNotice({ id: Date.now(), text: cloudErrorMessage(error) })
      },
    })

    return () => {
      settled = true
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (source !== 'local') return
    saveBooks(books)
  }, [books, source])

  useEffect(() => {
    if (source !== 'cloud' || migrated.current) return
    migrated.current = true
    const ids = books.map((book) => book.id)
    void migrateLocalShelf(ids).catch((error: unknown) => {
      migrated.current = false
      console.error(error)
    })
  }, [books, source])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3400)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const visible: Screen = !activeBook
    ? { kind: 'shelf' }
    : screen.kind === 'read'
      ? {
          kind: 'read',
          bookId: activeBook.id,
          spread: Math.min(screen.spread, activeBook.entries.length),
        }
      : screen.kind === 'sign' && screen.entryId && !signingEntry
        ? { kind: 'read', bookId: activeBook.id, spread: 0 }
        : screen

  useEffect(() => {
    document.title = activeBook ? `${activeBook.title} · E-Slam Book` : 'E-Slam Book'
  }, [activeBook])

  function flash(text: string) {
    setNotice({ id: Date.now(), text })
  }

  function openBook(bookId: string, spread = 0) {
    rememberBook(bookId)
    setScreen({ kind: 'read', bookId, spread })
  }

  function goShelf() {
    rememberBook(null)
    setScreen({ kind: 'shelf' })
  }

  async function handleSaveBook(draft: BookDraft) {
    if (editor?.mode === 'edit' && editingBook) {
      const next = { ...editingBook, ...draft }
      const previous = books
      pendingOps.current.add(next.id)
      setBooks((current) => current.map((book) => (book.id === next.id ? next : book)))
      setEditor(null)
      flash('Cover updated.')
      if (source !== 'cloud') return
      try {
        await updateCover(next)
      } catch (error) {
        pendingOps.current.delete(next.id)
        setBooks(previous)
        flash(cloudErrorMessage(error))
      }
      return
    }

    const book: SlamBook = {
      id: createId(),
      ...draft,
      createdAt: new Date().toISOString(),
      entries: [],
    }
    const previous = books
    pendingOps.current.add(book.id)
    setBooks((current) => [book, ...current.filter((item) => item.id !== book.id)])
    setEditor(null)
    openBook(book.id)
    track('create_book')
    if (source !== 'cloud') return
    try {
      await createBook(book)
    } catch (error) {
      pendingOps.current.delete(book.id)
      setBooks(previous)
      goShelf()
      flash(cloudErrorMessage(error))
    }
  }

  async function handleSample() {
    const existing = books.find((book) => book.id === SAMPLE_BOOK_ID)
    if (existing) {
      openBook(existing.id)
      return
    }
    const sample = createSampleBook()
    const previous = books
    pendingOps.current.add(sample.id)
    setBooks((current) => [sample, ...current])
    openBook(sample.id)
    if (source !== 'cloud') return
    try {
      await replaceBook(sample)
    } catch (error) {
      pendingOps.current.delete(sample.id)
      setBooks(previous)
      goShelf()
      flash(cloudErrorMessage(error))
    }
  }

  async function handleSign(answers: Record<string, string>) {
    if (screen.kind !== 'sign' || !activeBook) return
    const previous = books
    if (screen.entryId) {
      const entryId = screen.entryId
      const nextBook: SlamBook = {
        ...activeBook,
        entries: activeBook.entries.map((entry) => (entry.id === entryId ? { ...entry, answers } : entry)),
      }
      const nextEntry = nextBook.entries.find((entry) => entry.id === entryId)
      pendingOps.current.add(activeBook.id)
      setBooks((current) => current.map((book) => (book.id === activeBook.id ? nextBook : book)))
      const index = activeBook.entries.findIndex((entry) => entry.id === entryId)
      openBook(activeBook.id, index >= 0 ? index + 1 : 0)
      flash('Page updated.')
      if (source !== 'cloud' || !nextEntry) return
      try {
        await saveEntry(activeBook.id, nextEntry)
      } catch (error) {
        pendingOps.current.delete(activeBook.id)
        setBooks(previous)
        flash(cloudErrorMessage(error))
      }
      return
    }

    const entry: Entry = { id: createId(), answers, signedAt: new Date().toISOString() }
    const nextBook: SlamBook = { ...activeBook, entries: [...activeBook.entries, entry] }
    pendingOps.current.add(activeBook.id)
    setBooks((current) => current.map((book) => (book.id === activeBook.id ? nextBook : book)))
    openBook(activeBook.id, activeBook.entries.length + 1)
    flash('Signed and tucked into the book.')
    track('sign_page')
    if (source !== 'cloud') return
    try {
      await saveEntry(activeBook.id, entry)
    } catch (error) {
      pendingOps.current.delete(activeBook.id)
      setBooks(previous)
      flash(cloudErrorMessage(error))
    }
  }

  function handleCopy(entry: Entry) {
    if (!activeBook) return
    navigator.clipboard
      .writeText(entryAsText(activeBook, entry))
      .then(() => flash('Copied. Paste it into a message.'))
      .catch(() => flash('Copying was blocked by the browser.'))
  }

  async function handleImport(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const incoming = normalizeImport(parsed)
      if (!incoming) {
        flash('That file is not a slam book backup.')
        return
      }
      setBooks((current) => {
        for (const book of incoming) pendingOps.current.add(book.id)
        return mergeBooks(current, incoming)
      })
      flash(incoming.length === 1 ? 'Restored 1 book onto the shelf.' : `Restored ${incoming.length} books onto the shelf.`)
      if (source !== 'cloud') return
      for (const book of incoming) await replaceBook(book)
    } catch (error) {
      flash(error instanceof SyntaxError ? 'That file could not be read.' : cloudErrorMessage(error))
    }
  }

  async function removeBook(bookId: string) {
    const previous = books
    pendingOps.current.add(`delete:${bookId}`)
    setBooks((current) => current.filter((book) => book.id !== bookId))
    setConfirm(null)
    goShelf()
    flash('Taken off the shelf.')
    if (source !== 'cloud') return
    try {
      await deleteCloudBook(bookId)
    } catch (error) {
      pendingOps.current.delete(`delete:${bookId}`)
      setBooks(previous)
      flash(cloudErrorMessage(error))
    }
  }

  async function removeEntry(bookId: string, entryId: string) {
    const previous = books
    pendingOps.current.add(bookId)
    setBooks((current) =>
      current.map((book) =>
        book.id === bookId ? { ...book, entries: book.entries.filter((entry) => entry.id !== entryId) } : book,
      ),
    )
    setConfirm(null)
    flash('That page was torn out.')
    if (source !== 'cloud') return
    try {
      await deleteCloudEntry(bookId, entryId)
    } catch (error) {
      pendingOps.current.delete(bookId)
      setBooks(previous)
      flash(cloudErrorMessage(error))
    }
  }

  async function handleShare(bookId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('book', bookId)
    rememberBook(bookId)
    try {
      await navigator.clipboard.writeText(url.toString())
      flash('Link copied. Send it to a friend.')
    } catch {
      flash(url.toString())
    }
  }

  return (
    <main className="app-shell">
      {source === 'loading' && <p className="loading">Opening your shelf…</p>}

      {source !== 'loading' && visible.kind === 'shelf' && (
        <Shelf
          books={books}
          cloud={source === 'cloud'}
          onOpen={(bookId) => openBook(bookId)}
          onCreate={() => setEditor({ mode: 'create' })}
          onSample={() => {
            void handleSample()
          }}
          onExport={() => downloadJson('e-slam-book.slam.json', books)}
          onImport={(file) => {
            void handleImport(file)
          }}
        />
      )}

      {source !== 'loading' && visible.kind === 'read' && activeBook && (
        <OpenBook
          book={activeBook}
          spread={visible.spread}
          onSpread={(spread) => openBook(activeBook.id, spread)}
          onBack={goShelf}
          onSign={() => setScreen({ kind: 'sign', bookId: activeBook.id })}
          onEditCover={() => setEditor({ mode: 'edit', bookId: activeBook.id })}
          onEditEntry={(entryId) => setScreen({ kind: 'sign', bookId: activeBook.id, entryId })}
          onDeleteEntry={(entry) =>
            setConfirm({
              kind: 'entry',
              bookId: activeBook.id,
              entryId: entry.id,
              name: entry.answers.name?.trim() || 'this',
            })
          }
          onDeleteBook={() => setConfirm({ kind: 'book', bookId: activeBook.id, title: activeBook.title })}
          onCopyEntry={handleCopy}
          onDownload={() => downloadJson(`${slugify(activeBook.title)}.slam.json`, [activeBook])}
          onShare={source === 'cloud' ? () => void handleShare(activeBook.id) : undefined}
          hotkeys={!editor && !confirm}
        />
      )}

      {source !== 'loading' && visible.kind === 'sign' && activeBook && (
        <SignForm
          key={visible.entryId ?? 'new'}
          book={activeBook}
          entry={signingEntry}
          onCancel={() => {
            if (visible.entryId) {
              const index = activeBook.entries.findIndex((entry) => entry.id === visible.entryId)
              openBook(activeBook.id, index >= 0 ? index + 1 : 0)
              return
            }
            openBook(activeBook.id, 0)
          }}
          onSave={handleSign}
        />
      )}

      {editor?.mode === 'create' && (
        <BookDialog
          heading="Start a slam book"
          submitLabel="Put it on the shelf"
          initial={EMPTY_DRAFT}
          onCancel={() => setEditor(null)}
          onSave={handleSaveBook}
        />
      )}

      {editor?.mode === 'edit' && editingBook && (
        <BookDialog
          heading="Change the cover"
          submitLabel="Save the cover"
          initial={{
            ownerName: editingBook.ownerName,
            title: editingBook.title,
            dedication: editingBook.dedication,
            theme: editingBook.theme,
          }}
          onCancel={() => setEditor(null)}
          onSave={handleSaveBook}
        />
      )}

      {confirm?.kind === 'book' && (
        <ConfirmDialog
          title="Take this book off the shelf?"
          body={
            source === 'cloud'
              ? `“${confirm.title}” and every signed page will be removed for everyone who has the link.`
              : `“${confirm.title}” and every signed page in it will leave this browser. Download a backup first if you want to keep it.`
          }
          confirmLabel="Remove the book"
          onCancel={() => setConfirm(null)}
          onConfirm={() => removeBook(confirm.bookId)}
        />
      )}

      {confirm?.kind === 'entry' && (
        <ConfirmDialog
          title="Tear out this page?"
          body={`${confirm.name === 'this' ? 'This page' : `${confirm.name}'s page`} will leave the book.`}
          confirmLabel="Tear it out"
          onCancel={() => setConfirm(null)}
          onConfirm={() => removeEntry(confirm.bookId, confirm.entryId)}
        />
      )}

      {notice && (
        <p className="notice" role="status">
          {notice.text}
        </p>
      )}
    </main>
  )
}
