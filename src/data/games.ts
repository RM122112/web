import guessThumbnail from '@/assets/thumbnails/guess-the-number.svg'
import sudokuThumbnail from '@/assets/thumbnails/sudoku.svg'

export interface GameInfo {
  id: string
  title: string
  thumbnail: string
}

export const games: GameInfo[] = [
  { id: 'sudoku', title: 'Sudoku', thumbnail: sudokuThumbnail },
  {
    id: 'guess-the-number',
    title: 'Zahlenraten',
    thumbnail: guessThumbnail,
  },
]
