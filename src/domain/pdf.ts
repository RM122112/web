export interface PdfTextMatch {
  page: number
  itemIndex: number
  start: number
  end: number
}

export interface PdfTextItem {
  text: string
}

export function isSafePdfPath(path: unknown): path is string {
  if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('\\')) return false
  if (/[?#]/.test(path) || /^[a-z][a-z\d+.-]*:/i.test(path)) return false
  const segments = path.split('/')
  return segments.every((segment) => {
    if (!segment) return false
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    } catch {
      return false
    }
    return decoded !== '.' && decoded !== '..' && !decoded.includes('/') && !decoded.includes('\\')
  }) && /\.pdf$/i.test(path)
}

export function publicPdfUrl(path: string): string {
  if (!isSafePdfPath(path)) throw new Error('Ungültiger PDF-Dateiname.')
  return `/pdfs/${path.split('/').map(encodeURIComponent).join('/')}`
}

export function findPdfMatches(
  pages: Array<{ page: number; items: PdfTextItem[] }>,
  query: string,
): PdfTextMatch[] {
  const needle = query.trim().toLocaleLowerCase('de')
  if (!needle) return []
  const matches: PdfTextMatch[] = []
  for (const { page, items } of pages) {
    items.forEach((item, itemIndex) => {
      const text = item.text.toLocaleLowerCase('de')
      let start = 0
      while ((start = text.indexOf(needle, start)) !== -1) {
        matches.push({ page, itemIndex, start, end: start + needle.length })
        start += Math.max(needle.length, 1)
      }
    })
  }
  return matches
}

export function splitTextForHighlight(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const needle = query.trim()
  if (!needle) return [{ text, hit: false }]
  const lower = text.toLocaleLowerCase('de')
  const search = needle.toLocaleLowerCase('de')
  const parts: Array<{ text: string; hit: boolean }> = []
  let cursor = 0
  let index = lower.indexOf(search)
  while (index !== -1) {
    if (index > cursor) parts.push({ text: text.slice(cursor, index), hit: false })
    parts.push({ text: text.slice(index, index + needle.length), hit: true })
    cursor = index + needle.length
    index = lower.indexOf(search, cursor)
  }
  if (cursor < text.length || parts.length === 0) parts.push({ text: text.slice(cursor), hit: false })
  return parts
}
