import { describe, expect, it } from 'vitest'
import {
  buildQuizQuestions,
  chooseQuestionCards,
  createQuizQuestion,
  isQuizAnswerCorrect,
  type QuizCard,
} from './quiz'

const cards: QuizCard[] = [
  { id: 'a', front: 'Apfel', back: 'apple', correct: 0, incorrect: 0 },
  { id: 'b', front: 'Brot', back: 'bread', correct: 0, incorrect: 0 },
  { id: 'c', front: 'Wasser', back: 'water', correct: 0, incorrect: 0 },
  { id: 'd', front: 'Milch', back: 'milk', correct: 0, incorrect: 0 },
  { id: 'e', front: 'Tee', back: 'tea', correct: 0, incorrect: 0 },
]

describe('quiz logic', () => {
  it('only selects cards with a back and uses the requested bounded question count', () => {
    const selected = chooseQuestionCards([...cards, {
      id: 'f', front: 'leer', back: '', correct: 0, incorrect: 20,
    }], 10, () => 0)

    expect(selected).toHaveLength(cards.length)
    expect(selected.every((card) => card.back.length > 0)).toBe(true)
    expect(new Set(selected.map((card) => card.id)).size).toBe(selected.length)
  })

  it('prioritizes cards with more wrong answers', () => {
    const weighted = cards.map((card) => ({ ...card }))
    weighted[4].incorrect = 8
    weighted[4].correct = 1

    expect(chooseQuestionCards(weighted, 1, () => 0.5)[0].id).toBe('e')
  })

  it('creates four distinct choices and supports reverse direction', () => {
    const question = createQuizQuestion(cards[0], cards, 'choice', 'back-to-front', () => 0.3)

    expect(question.prompt).toBe('apple')
    expect(question.answer).toBe('Apfel')
    expect(question.choices).toHaveLength(4)
    expect(new Set(question.choices.map((choice) => choice.toLowerCase())).size).toBe(4)
  })

  it('compares typed responses without case or surrounding-space differences', () => {
    const [question] = buildQuizQuestions(cards, 1, 'typing', 'front-to-back', () => 0)

    expect(question.choices).toEqual([])
    expect(isQuizAnswerCorrect('  APPLE  ', question)).toBe(true)
    expect(isQuizAnswerCorrect('Pear', question)).toBe(false)
  })

  it('rejects multiple choice when three distinct distractors do not exist', () => {
    expect(() => createQuizQuestion(cards[0], cards.slice(0, 3), 'choice', 'front-to-back'))
      .toThrow('vier verschiedene Antworten')
  })
})
