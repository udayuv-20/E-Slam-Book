import { FirebaseError } from 'firebase/app'
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase.ts'
import { loadBooks, parseBook, parseEntry } from './storage.ts'
import type { Entry, SlamBook } from './types.ts'

const MIGRATED_KEY = 'eslam-book.cloud-migrated'
let migrationStarted = false

function bookPayload(book: Pick<SlamBook, 'ownerName' | 'title' | 'dedication' | 'theme' | 'createdAt' | 'sample'>) {
  const payload: Record<string, string | boolean> = {
    ownerName: book.ownerName,
    title: book.title,
    dedication: book.dedication,
    theme: book.theme,
    createdAt: book.createdAt,
  }
  if (book.sample) payload.sample = true
  return payload
}

function entryPayload(entry: Entry) {
  return { answers: entry.answers, signedAt: entry.signedAt }
}

function readBook(id: string, data: DocumentData) {
  return parseBook({
    id,
    ownerName: data.ownerName,
    title: data.title,
    dedication: data.dedication,
    theme: data.theme,
    createdAt: data.createdAt,
    sample: data.sample === true ? true : undefined,
    entries: [],
  })
}

export function cloudErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (/has not been used|SERVICE_DISABLED|api has not been used/i.test(message)) {
    return 'Cloud Firestore is turned off for this project. Enable it in the Firebase console, publish the rules, then refresh.'
  }
  if (!(error instanceof FirebaseError)) return 'Firebase could not save that change.'
  if (error.code === 'permission-denied') {
    return 'Firestore refused the shelf. Create a Firestore database, publish the rules, then refresh.'
  }
  if (error.code === 'unavailable') return 'Firebase is offline right now. Try again in a moment.'
  if (error.code === 'not-found') return 'Create a Firestore database in the Firebase console, then refresh.'
  if (error.code === 'failed-precondition' && /index/i.test(error.message)) {
    return 'Firestore needs an index before the shelf can load. The browser console has the setup link.'
  }
  if (error.code === 'failed-precondition') {
    return 'Create a Firestore database in the Firebase console, then refresh.'
  }
  return 'Firebase could not save that change.'
}

export async function replaceBook(book: SlamBook) {
  const existing = await getDocs(collection(db, 'books', book.id, 'entries'))
  const keep = new Set(book.entries.map((entry) => entry.id))
  const steps: Array<(batch: ReturnType<typeof writeBatch>) => void> = []
  steps.push((batch) => batch.set(doc(db, 'books', book.id), bookPayload(book)))
  for (const item of existing.docs) {
    if (!keep.has(item.id)) steps.push((batch) => batch.delete(item.ref))
  }
  for (const entry of book.entries) {
    steps.push((batch) => batch.set(doc(db, 'books', book.id, 'entries', entry.id), entryPayload(entry)))
  }
  for (let index = 0; index < steps.length; index += 400) {
    const batch = writeBatch(db)
    for (const step of steps.slice(index, index + 400)) step(batch)
    await batch.commit()
  }
}

export async function createBook(book: SlamBook) {
  await replaceBook({ ...book, entries: [] })
}

export async function updateCover(book: SlamBook) {
  await setDoc(doc(db, 'books', book.id), bookPayload(book), { merge: true })
}

export async function saveEntry(bookId: string, entry: Entry) {
  await setDoc(doc(db, 'books', bookId, 'entries', entry.id), entryPayload(entry))
}

export async function removeEntry(bookId: string, entryId: string) {
  await deleteDoc(doc(db, 'books', bookId, 'entries', entryId))
}

export async function removeBook(bookId: string) {
  const existing = await getDocs(collection(db, 'books', bookId, 'entries'))
  const refs = [...existing.docs.map((item) => item.ref), doc(db, 'books', bookId)]
  for (let index = 0; index < refs.length; index += 400) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(index, index + 400)) batch.delete(ref)
    await batch.commit()
  }
}

export async function migrateLocalShelf(remoteIds: string[]) {
  if (migrationStarted || localStorage.getItem(MIGRATED_KEY) === '1') return
  migrationStarted = true
  try {
    const remote = new Set(remoteIds)
    const missing = loadBooks().filter((book) => !remote.has(book.id))
    for (const book of missing) await replaceBook(book)
    localStorage.setItem(MIGRATED_KEY, '1')
  } catch (error) {
    migrationStarted = false
    throw error
  }
}

function sortedBook(book: SlamBook): SlamBook {
  return {
    ...book,
    entries: [...book.entries].sort((a, b) => a.signedAt.localeCompare(b.signedAt) || a.id.localeCompare(b.id)),
  }
}

function sameBook(left: SlamBook, right: SlamBook) {
  const a = sortedBook(left)
  const b = sortedBook(right)
  if (a.title !== b.title || a.ownerName !== b.ownerName || a.dedication !== b.dedication || a.theme !== b.theme) {
    return false
  }
  if (a.entries.length !== b.entries.length) return false
  return a.entries.every((entry, index) => {
    const other = b.entries[index]
    return (
      other?.id === entry.id &&
      other.signedAt === entry.signedAt &&
      JSON.stringify(other.answers) === JSON.stringify(entry.answers)
    )
  })
}

export function mergeRemote(local: SlamBook[], remote: SlamBook[], pending: Set<string>) {
  const nextPending = new Set(pending)
  const remoteById = new Map(remote.map((book) => [book.id, book]))
  const kept = new Map<string, SlamBook>()

  for (const book of local) {
    const deleteKey = `delete:${book.id}`
    if (nextPending.has(deleteKey)) {
      if (!remoteById.has(book.id)) nextPending.delete(deleteKey)
      continue
    }
    if (!nextPending.has(book.id)) continue
    const remoteBook = remoteById.get(book.id)
    if (remoteBook && sameBook(book, remoteBook)) {
      nextPending.delete(book.id)
      continue
    }
    kept.set(book.id, book)
  }

  for (const key of nextPending) {
    if (!key.startsWith('delete:')) continue
    const id = key.slice('delete:'.length)
    if (!remoteById.has(id)) nextPending.delete(key)
  }

  const books = [...remote.filter((book) => !kept.has(book.id) && !nextPending.has(`delete:${book.id}`)), ...kept.values()]
    .map(sortedBook)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return { books, pending: nextPending }
}

interface LibraryHandlers {
  onChange: (books: SlamBook[]) => void
  onFallback: (error: unknown) => void
  onError: (error: unknown) => void
}

export function subscribeLibrary({ onChange, onFallback, onError }: LibraryHandlers) {
  const bookDocs = new Map<string, SlamBook>()
  const entryDocs = new Map<string, Entry[]>()
  let booksReady = false
  let entriesReady = false
  let received = false
  let failed = false

  const publish = () => {
    if (!booksReady || !entriesReady || failed) return
    const books: SlamBook[] = []
    for (const book of bookDocs.values()) {
      const parsed = parseBook({ ...book, entries: entryDocs.get(book.id) ?? [] })
      if (parsed) books.push(sortedBook(parsed))
    }
    books.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    received = true
    onChange(books)
  }

  let unsubBooks = () => {}
  let unsubEntries = () => {}

  const fail = (error: unknown) => {
    if (failed) return
    failed = true
    unsubBooks()
    unsubEntries()
    if (received) onError(error)
    else onFallback(error)
  }

  unsubBooks = onSnapshot(
    collection(db, 'books'),
    (snapshot) => {
      bookDocs.clear()
      for (const item of snapshot.docs) {
        const book = readBook(item.id, item.data())
        if (book) bookDocs.set(item.id, book)
      }
      booksReady = true
      publish()
    },
    fail,
  )

  unsubEntries = onSnapshot(
    collectionGroup(db, 'entries'),
    (snapshot) => {
      entryDocs.clear()
      for (const item of snapshot.docs) {
        const bookId = item.ref.parent.parent?.id
        if (!bookId) continue
        const entry = parseEntry({ id: item.id, ...item.data() })
        if (!entry) continue
        const list = entryDocs.get(bookId) ?? []
        list.push(entry)
        entryDocs.set(bookId, list)
      }
      entriesReady = true
      publish()
    },
    fail,
  )

  return () => {
    unsubBooks()
    unsubEntries()
  }
}
