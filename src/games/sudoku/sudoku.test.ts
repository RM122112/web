import { describe, expect, it } from 'vitest'
import { generatePuzzle, type Difficulty } from './sudoku'

const levels: Difficulty[] = ['leicht', 'mittel', 'schwer', 'experte']

describe('generatePuzzle', () => {
  it('creates a complete valid solution and a consistent puzzle for each difficulty', () => {
    for (const difficulty of levels) {
      const { puzzle, solution } = generatePuzzle(difficulty)
      expect(puzzle).toHaveLength(81)
      expect(solution).toHaveLength(81)
      expect(solution.every((value) => value >= 1 && value <= 9)).toBe(true)
      for (let group = 0; group < 9; group++) {
        expect(new Set(solution.slice(group * 9, group * 9 + 9)).size).toBe(9)
        expect(new Set(solution.filter((_, index) => index % 9 === group)).size).toBe(9)
        const boxValues = []
        for (let row = 0; row < 3; row++) {
          for (let column = 0; column < 3; column++) {
            boxValues.push(solution[Math.floor(group / 3) * 27 + (group % 3) * 3 + row * 9 + column])
          }
        }
        expect(new Set(boxValues).size).toBe(9)
      }
      expect(puzzle.every((value, index) => value === 0 || value === solution[index])).toBe(true)
      expect(puzzle.some((value) => value === 0)).toBe(true)
    }
  })
})
