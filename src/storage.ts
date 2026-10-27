import { QUESTIONS } from './questions.ts'
import { THEMES, type Entry, type SlamBook, type ThemeId } from './types.ts'

const STORAGE_KEY = 'eslam-book.v1'
const MAX_BOOKS = 50
const MAX_ENTRIES = 300

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function isTheme(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value)
}

export function parseEntry(value: unknown): Entry | null {
  const entry = asRecord(value)
  if (!entry) return null
  if (typeof entry.id !== 'string' || typeof entry.signedAt !== 'string') return null
  const id = entry.id.trim()
  if (!id || id.length > 80) return null
  if (Number.isNaN(Date.parse(entry.signedAt))) return null
  const answersRecord = asRecord(entry.answers)
  if (!answersRecord) return null

  const answers: Record<string, string> = {}
  for (const question of QUESTIONS) {
    const raw = answersRecord[question.id]
    if (raw == null || raw === '') {
      answers[question.id] = ''
      continue
    }
    if (typeof raw !== 'string' || raw.length > 2000) return null
    answers[question.id] = raw.trim()
  }

  return { id, signedAt: entry.signedAt, answers }
}

export function parseBook(value: unknown): SlamBook | null {
  const book = asRecord(value)
  if (!book) return null
  if (typeof book.id !== 'string' || typeof book.ownerName !== 'string') return null
  if (typeof book.title !== 'string' || typeof book.dedication !== 'string') return null
  if (typeof book.createdAt !== 'string') return null

  const id = book.id.trim()
  const ownerName = book.ownerName.trim()
  const title = book.title.trim()
  const dedication = book.dedication.trim()
  if (!id || id.length > 80) return null
  if (!ownerName || ownerName.length > 80) return null
  if (!title || title.length > 80) return null
  if (dedication.length > 400) return null
  if (Number.isNaN(Date.parse(book.createdAt))) return null
  if (!isTheme(book.theme)) return null
  if (!Array.isArray(book.entries)) return null

  const entries: Entry[] = []
  for (const item of book.entries.slice(0, MAX_ENTRIES)) {
    const entry = parseEntry(item)
    if (!entry) return null
    entries.push(entry)
  }

  const sanitized: SlamBook = {
    id,
    ownerName,
    title,
    dedication,
    theme: book.theme,
    createdAt: book.createdAt,
    entries,
  }
  if (book.sample === true) sanitized.sample = true
  return sanitized
}

export function loadBooks(): SlamBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const book = parseBook(item)
      return book ? [book] : []
    })
  } catch {
    return []
  }
}

export function saveBooks(books: SlamBook[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
    return true
  } catch {
    return false
  }
}

export function createId() {
  return crypto.randomUUID()
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function normalizeImport(value: unknown): SlamBook[] | null {
  const list = Array.isArray(value) ? value : [value]
  if (list.length === 0 || list.length > MAX_BOOKS) return null
  const books: SlamBook[] = []
  for (const item of list) {
    const book = parseBook(item)
    if (!book) return null
    books.push(book)
  }
  return books
}

export function mergeBooks(current: SlamBook[], incoming: SlamBook[]) {
  const next = [...current]
  const fresh: SlamBook[] = []
  for (const book of incoming) {
    const index = next.findIndex((item) => item.id === book.id)
    if (index >= 0) next[index] = book
    else fresh.push(book)
  }
  return [...fresh, ...next].slice(0, MAX_BOOKS)
}
