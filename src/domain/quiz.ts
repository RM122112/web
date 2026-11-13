import { normalizeAnswer } from './cards'

export interface QuizCard {
  id: string
  front: string
  back: string
  correct: number
  incorrect: number
}

export type QuizKind = 'choice' | 'typing'
export type QuizDirection = 'front-to-back' | 'back-to-front'

export interface QuizQuestion {
  card: QuizCard
  prompt: string
  answer: string
  choices: string[]
}

function answerFor(card: QuizCard, direction: QuizDirection): string {
  return direction === 'front-to-back' ? card.back : card.front
}

function promptFor(card: QuizCard, direction: QuizDirection): string {
  return direction === 'front-to-back' ? card.front : card.back
}

export function chooseQuestionCards(
  cards: QuizCard[],
  count: number,
  random: () => number = Math.random,
): QuizCard[] {
  const remaining = [...cards].filter((card) => card.back.trim())
  const selected: QuizCard[] = []
  const target = Math.min(Math.max(0, count), remaining.length)

  while (selected.length < target) {
    const weights = remaining.map((card) => 1 + Math.max(0, card.incorrect - card.correct))
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let choice = random() * total
    let index = 0
    for (; index < weights.length - 1; index++) {
      choice -= weights[index]
      if (choice < 0) break
    }
    selected.push(remaining.splice(index, 1)[0])
  }

  return selected
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function createQuizQuestion(
  card: QuizCard,
  cards: QuizCard[],
  kind: QuizKind,
  direction: QuizDirection,
  random: () => number = Math.random,
): QuizQuestion {
  const answer = answerFor(card, direction)
  let choices: string[] = []

  if (kind === 'choice') {
    const seen = new Set([normalizeAnswer(answer)])
    const distractors: string[] = []
    for (const other of shuffle(cards.filter(({ id }) => id !== card.id), random)) {
      const option = answerFor(other, direction)
      const key = normalizeAnswer(option)
      if (!option.trim() || seen.has(key)) continue
      seen.add(key)
      distractors.push(option)
      if (distractors.length === 3) break
    }
    if (distractors.length < 3) {
      throw new Error('Für die Auswahl werden vier verschiedene Antworten benötigt.')
    }
    choices = shuffle([answer, ...distractors], random)
  }

  return { card, prompt: promptFor(card, direction), answer, choices }
}

export function buildQuizQuestions(
  cards: QuizCard[],
  count: number,
  kind: QuizKind,
  direction: QuizDirection,
  random: () => number = Math.random,
): QuizQuestion[] {
  const selected = chooseQuestionCards(cards, count, random)
  return selected.map((card) => createQuizQuestion(card, cards, kind, direction, random))
}

export function isQuizAnswerCorrect(answer: string, question: QuizQuestion): boolean {
  return normalizeAnswer(answer) === normalizeAnswer(question.answer)
}
