export interface ParsedCard {
  front: string
  back: string
}

export interface ParsedCardText {
  cards: ParsedCard[]
  duplicates: number
}

export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de')
}

export function parseCardText(text: string, existingFronts: string[] = []): ParsedCardText {
  const seen = new Set(existingFronts.map(normalizeAnswer))
  const cards: ParsedCard[] = []
  let duplicates = 0

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const separator = line.indexOf('=')
    const front = (separator < 0 ? line : line.slice(0, separator)).trim()
    const back = (separator < 0 ? '' : line.slice(separator + 1)).trim()
    if (!front) continue
    const key = normalizeAnswer(front)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    cards.push({ front, back })
  }

  return { cards, duplicates }
}
