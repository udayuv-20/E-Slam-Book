export interface Question {
  id: string
  label: string
  hint: string
  kind: 'short' | 'long'
  page: 'about' | 'note'
  max: number
  required?: boolean
}

export const QUESTIONS: Question[] = [
  {
    id: 'name',
    label: 'My name',
    hint: 'The name you answer to',
    kind: 'short',
    page: 'about',
    max: 60,
    required: true,
  },
  {
    id: 'nickname',
    label: 'Call me',
    hint: 'A nickname',
    kind: 'short',
    page: 'about',
    max: 40,
  },
  {
    id: 'birthday',
    label: 'Birthday',
    hint: '12 March',
    kind: 'short',
    page: 'about',
    max: 40,
  },
  {
    id: 'hometown',
    label: 'I grew up in',
    hint: 'A city or a neighborhood',
    kind: 'short',
    page: 'about',
    max: 60,
  },
  {
    id: 'color',
    label: 'Favorite color',
    hint: 'The shade that feels like you',
    kind: 'short',
    page: 'about',
    max: 40,
  },
  {
    id: 'food',
    label: 'Favorite food',
    hint: 'The plate you never refuse',
    kind: 'short',
    page: 'about',
    max: 60,
  },
  {
    id: 'song',
    label: 'Song on repeat',
    hint: 'Title and artist',
    kind: 'short',
    page: 'about',
    max: 80,
  },
  {
    id: 'movie',
    label: 'Movie I rewind',
    hint: 'A title',
    kind: 'short',
    page: 'about',
    max: 80,
  },
  {
    id: 'hobby',
    label: 'I light up when',
    hint: 'A hobby or a small joy',
    kind: 'short',
    page: 'about',
    max: 80,
  },
  {
    id: 'words',
    label: 'Three words for you',
    hint: 'kind, loud, unforgettable',
    kind: 'short',
    page: 'note',
    max: 80,
  },
  {
    id: 'memory',
    label: 'A memory I keep',
    hint: 'A moment you shared',
    kind: 'long',
    page: 'note',
    max: 500,
  },
  {
    id: 'wish',
    label: 'I wish for you',
    hint: 'A wish, a dare, a blessing',
    kind: 'long',
    page: 'note',
    max: 400,
  },
  {
    id: 'message',
    label: 'A note, just for you',
    hint: 'The line they will reread',
    kind: 'long',
    page: 'note',
    max: 700,
    required: true,
  },
]
