import { hashString } from '../format.ts'

const KINDS = ['star', 'heart', 'flower', 'spark'] as const

export function Sticker({ seed }: { seed: string }) {
  const hash = hashString(seed)
  const kind = KINDS[hash % KINDS.length]
  const turn = (hash % 21) - 10

  return (
    <div className="sticker" style={{ transform: `rotate(${turn}deg)` }} aria-hidden="true">
      {kind === 'star' && (
        <svg viewBox="0 0 64 64">
          <path
            fill="#f2c14e"
            stroke="#c4892a"
            strokeWidth="2"
            d="M32 6l6.8 14.2L54 22.4l-11 10.4 2.8 16.2L32 41.2 18.2 49l2.8-16.2L10 22.4l15.2-2.2z"
          />
        </svg>
      )}
      {kind === 'heart' && (
        <svg viewBox="0 0 64 64">
          <path
            fill="#e56b8c"
            d="M32 54s-18-11.2-18-24c0-6.4 4.6-11 10.4-11 3.6 0 6.4 1.8 7.6 4.4C33.2 20.8 36 19 39.6 19 45.4 19 50 23.6 50 30c0 12.8-18 24-18 24z"
          />
        </svg>
      )}
      {kind === 'flower' && (
        <svg viewBox="0 0 64 64">
          <circle cx="32" cy="18" r="8" fill="#f4a7c2" />
          <circle cx="46" cy="32" r="8" fill="#f4a7c2" />
          <circle cx="32" cy="46" r="8" fill="#f4a7c2" />
          <circle cx="18" cy="32" r="8" fill="#f4a7c2" />
          <circle cx="32" cy="32" r="6" fill="#f2c14e" />
        </svg>
      )}
      {kind === 'spark' && (
        <svg viewBox="0 0 64 64">
          <path fill="#7eb6e8" d="M32 4l6 22 22 6-22 6-6 22-6-22-22-6 22-6z" />
        </svg>
      )}
    </div>
  )
}

export function Rings() {
  return (
    <div className="rings" aria-hidden="true">
      {Array.from({ length: 11 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

export function EmptyDoodle() {
  return (
    <svg className="doodle" viewBox="0 0 140 100" aria-hidden="true">
      <rect x="28" y="16" width="78" height="70" rx="6" fill="#fff" stroke="#c98978" strokeWidth="2" />
      <path d="M40 16v70" stroke="#e7a0b0" strokeWidth="2" />
      <path d="M52 38h40M52 50h34M52 62h28" stroke="#d7b7a4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="104" cy="24" r="10" fill="#f2c14e" />
      <path d="M18 78c10 8 22 8 34-2" fill="none" stroke="#e56b8c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
