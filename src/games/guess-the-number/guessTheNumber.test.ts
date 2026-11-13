import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGuessGame } from './guessTheNumber'

describe('createGuessGame', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gives directional feedback and reports attempts on a correct guess', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const game = createGuessGame()

    expect(game.guessNumber(50)).toBe('Zu niedrig! Versuch es noch einmal.')
    expect(game.guessNumber(150)).toBe('Zu hoch! Versuch es noch einmal.')
    expect(game.guessNumber(101)).toBe('Glückwunsch! Du hast die Zahl 101 in 3 Versuchen erraten.')
  })

  it('starts a new random game and resets the attempt count', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99)
    const game = createGuessGame()
    game.guessNumber(1)
    game.reset()

    expect(game.guessNumber(199)).toBe('Glückwunsch! Du hast die Zahl 199 in 1 Versuchen erraten.')
  })
})
