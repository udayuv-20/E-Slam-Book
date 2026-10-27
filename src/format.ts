import { QUESTIONS } from './questions.ts'
import type { Entry, SlamBook } from './types.ts'

export function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'an unknown day'
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function signatureLabel(count: number) {
  if (count === 0) return 'No signatures yet'
  if (count === 1) return '1 signature'
  return `${count} signatures`
}

export function monogram(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return letters.join('') || 'S'
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim()
}

export function possessive(name: string) {
  const first = firstName(name)
  if (!first) return 'this'
  return /s$/i.test(first) ? `${first}'` : `${first}'s`
}

export function hashString(value: string) {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'slam-book'
}

export function entryAsText(book: SlamBook, entry: Entry) {
  const lines = [`${book.title}`, `A page for ${book.ownerName}`, '']
  for (const question of QUESTIONS) {
    const value = entry.answers[question.id]?.trim()
    if (value) lines.push(`${question.label}: ${value}`)
  }
  lines.push('', `Signed ${formatDate(entry.signedAt)}`)
  return lines.join('\n')
}

export function displayName(entry: Entry) {
  return entry.answers.name?.trim() || 'Unsigned page'
}
