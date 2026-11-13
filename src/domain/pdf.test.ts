import { describe, expect, it } from 'vitest'
import { findPdfMatches, isSafePdfPath, publicPdfUrl, splitTextForHighlight } from './pdf'

describe('PDF helpers', () => {
  it('accepts nested PDF filenames and rejects traversal or external paths', () => {
    expect(isSafePdfPath('lektuere/Meine Datei.pdf')).toBe(true)
    expect(isSafePdfPath('../secret.pdf')).toBe(false)
    expect(isSafePdfPath('%2e%2e/secret.pdf')).toBe(false)
    expect(isSafePdfPath('https://example.test/a.pdf')).toBe(false)
    expect(publicPdfUrl('lektuere/Meine Datei.pdf')).toBe('/pdfs/lektuere/Meine%20Datei.pdf')
  })

  it('finds every case-insensitive match across pages', () => {
    expect(findPdfMatches([
      { page: 1, items: [{ text: 'Wort und wort' }] },
      { page: 2, items: [{ text: 'kein Treffer' }] },
    ], 'WORT')).toEqual([
      { page: 1, itemIndex: 0, start: 0, end: 4 },
      { page: 1, itemIndex: 0, start: 9, end: 13 },
    ])
  })

  it('returns text segments for inline search highlighting', () => {
    expect(splitTextForHighlight('Bla bla bla', 'bla')).toEqual([
      { text: 'Bla', hit: true },
      { text: ' ', hit: false },
      { text: 'bla', hit: true },
      { text: ' ', hit: false },
      { text: 'bla', hit: true },
    ])
  })
})
