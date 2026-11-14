export type MentalMathDifficulty = 'leicht' | 'mittel' | 'schwer'

export interface MentalMathDifficultyConfig {
  label: string
}

export interface MentalMathQuestion {
  text: string
  answer: number
}

export const MENTAL_MATH_DIFFICULTIES: Record<MentalMathDifficulty, MentalMathDifficultyConfig> = {
  leicht: { label: 'Leicht' },
  mittel: { label: 'Mittel' },
  schwer: { label: 'Schwer' },
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function questionForEasy(): MentalMathQuestion {
  if (Math.random() < 0.5) {
    const left = randomInt(1, 19)
    const right = randomInt(1, 20 - left)
    return { text: `${left} + ${right}`, answer: left + right }
  }

  const left = randomInt(1, 20)
  const right = randomInt(1, left)
  return { text: `${left} − ${right}`, answer: left - right }
}

function questionForMedium(): MentalMathQuestion {
  const mode = randomInt(0, 2)
  if (mode === 0) {
    const left = randomInt(5, 95)
    const right = randomInt(1, 100 - left)
    return { text: `${left} + ${right}`, answer: left + right }
  }
  if (mode === 1) {
    const left = randomInt(10, 100)
    const right = randomInt(1, left)
    return { text: `${left} − ${right}`, answer: left - right }
  }

  const left = randomInt(2, 12)
  const right = randomInt(2, Math.max(2, Math.floor(100 / left)))
  return { text: `${left} × ${right}`, answer: left * right }
}

function questionForHard(): MentalMathQuestion {
  const mode = randomInt(0, 3)
  if (mode === 0) {
    const left = randomInt(20, 180)
    const right = randomInt(10, 200 - left)
    return { text: `${left} + ${right}`, answer: left + right }
  }
  if (mode === 1) {
    const left = randomInt(20, 200)
    const right = randomInt(1, left)
    return { text: `${left} − ${right}`, answer: left - right }
  }
  if (mode === 2) {
    const left = randomInt(4, 15)
    const right = randomInt(3, 15)
    return { text: `${left} × ${right}`, answer: left * right }
  }

  const divisor = randomInt(2, 15)
  const quotient = randomInt(2, 15)
  const dividend = divisor * quotient
  return { text: `${dividend} ÷ ${divisor}`, answer: quotient }
}

export function createMentalMathQuestion(difficulty: MentalMathDifficulty): MentalMathQuestion {
  switch (difficulty) {
    case 'leicht':
      return questionForEasy()
    case 'mittel':
      return questionForMedium()
    case 'schwer':
      return questionForHard()
  }
}
