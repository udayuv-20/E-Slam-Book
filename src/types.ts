export const THEMES = [
  { id: 'rose', label: 'Rose' },
  { id: 'sky', label: 'Sky' },
  { id: 'lilac', label: 'Lilac' },
  { id: 'mint', label: 'Mint' },
  { id: 'amber', label: 'Amber' },
  { id: 'ink', label: 'Midnight' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export interface Entry {
  id: string
  answers: Record<string, string>
  signedAt: string
}

export interface SlamBook {
  id: string
  ownerName: string
  title: string
  dedication: string
  theme: ThemeId
  createdAt: string
  entries: Entry[]
  sample?: boolean
}

export interface BookDraft {
  ownerName: string
  title: string
  dedication: string
  theme: ThemeId
}
