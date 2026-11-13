export interface Card {
  id: string
  front: string
  back: string
  correct: number
  incorrect: number
}

export interface Deck {
  id: string
  name: string
  cards: Card[]
}

export interface CardData {
  version: 1
  decks: Deck[]
}

const STORAGE_KEY = 'lernkarten-data'
let persistenceRequested = false

export class CardStorageError extends Error {
  constructor(message = 'Der Browserspeicher ist nicht verfügbar oder voll.') {
    super(message)
    this.name = 'CardStorageError'
  }
}

function isCardData(value: unknown): value is CardData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<CardData>
  return data.version === 1 && Array.isArray(data.decks) && data.decks.every((deck) =>
    typeof deck.id === 'string' &&
    typeof deck.name === 'string' &&
    Array.isArray(deck.cards) &&
    deck.cards.every((card) =>
      typeof card.id === 'string' &&
      typeof card.front === 'string' &&
      typeof card.back === 'string' &&
      Number.isInteger(card.correct) &&
      Number.isInteger(card.incorrect),
    ),
  )
}

export function createCardId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createEmptyCardData(): CardData {
  return {
    version: 1,
    decks: [{ id: 'my-words', name: 'Meine Wörter', cards: [] }],
  }
}

export function loadCardData(): CardData {
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY)
    if (serialized === null) return createEmptyCardData()
    const parsed: unknown = JSON.parse(serialized)
    if (!isCardData(parsed)) throw new CardStorageError('Die gespeicherten Kartendaten sind ungültig.')
    return parsed
  } catch (error) {
    if (error instanceof CardStorageError) throw error
    throw new CardStorageError()
  }
}

export async function saveCardData(data: CardData): Promise<boolean> {
  if (!persistenceRequested) {
    persistenceRequested = true
    try {
      await navigator.storage?.persist?.()
    } catch {
      // The write is still useful if the browser declines persistent storage.
    }
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    throw new CardStorageError()
  }
  try {
    return (await navigator.storage?.persisted?.()) ?? false
  } catch {
    return false
  }
}
