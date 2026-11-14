<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import ButtonGroup from '@/components/molecules/ButtonGroup.vue'
import GameOverlay from '@/components/molecules/GameOverlay.vue'
import GameShell from '@/components/organisms/GameShell.vue'
import {
  createMentalMathQuestion,
  MENTAL_MATH_DIFFICULTIES,
  type MentalMathDifficulty,
} from './mentalMath'

const BEST_SCORE_KEY = 'denkspiele-mental-math-best'
const MAX_INPUT_LENGTH = 4
const ROUND_SECONDS = 60
const keypadDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

type BestScores = Record<MentalMathDifficulty, number>

const difficultyKeys = Object.keys(MENTAL_MATH_DIFFICULTIES) as MentalMathDifficulty[]
const difficulty = ref<MentalMathDifficulty>('leicht')
const question = ref(createMentalMathQuestion(difficulty.value))
const inputValue = ref('')
const hits = ref(0)
const attempts = ref(0)
const secondsLeft = ref(ROUND_SECONDS)
const timerRunning = ref(false)
const bestScores = ref<BestScores>(loadBestScores())
let timer: number | undefined

const solved = computed(() => secondsLeft.value === 0)
const hitRate = computed(() => (attempts.value === 0 ? 0 : Math.round((hits.value / attempts.value) * 100)))
const timeLabel = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const bestForLevel = computed(() => bestScores.value[difficulty.value])

function loadBestScores(): BestScores {
  const fallback: BestScores = { leicht: 0, mittel: 0, schwer: 0 }
  const raw = localStorage.getItem(BEST_SCORE_KEY)
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as Partial<BestScores>
    return {
      leicht: Number.isFinite(parsed.leicht) ? Math.max(0, Math.floor(parsed.leicht as number)) : 0,
      mittel: Number.isFinite(parsed.mittel) ? Math.max(0, Math.floor(parsed.mittel as number)) : 0,
      schwer: Number.isFinite(parsed.schwer) ? Math.max(0, Math.floor(parsed.schwer as number)) : 0,
    }
  } catch {
    return fallback
  }
}

function saveBestScores(): void {
  localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(bestScores.value))
}

function stopTimer(): void {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
  timerRunning.value = false
}

function finishRound(): void {
  stopTimer()
  if (hits.value > bestScores.value[difficulty.value]) {
    bestScores.value = {
      ...bestScores.value,
      [difficulty.value]: hits.value,
    }
    saveBestScores()
  }
}

function startTimer(): void {
  stopTimer()
  timerRunning.value = true
  timer = window.setInterval(() => {
    if (secondsLeft.value <= 1) {
      secondsLeft.value = 0
      finishRound()
      return
    }
    secondsLeft.value -= 1
  }, 1000)
}

function newGame(level: MentalMathDifficulty = difficulty.value): void {
  difficulty.value = level
  question.value = createMentalMathQuestion(level)
  inputValue.value = ''
  hits.value = 0
  attempts.value = 0
  secondsLeft.value = ROUND_SECONDS
  startTimer()
}

function appendDigit(digit: number): void {
  if (solved.value) return
  if (inputValue.value.length >= MAX_INPUT_LENGTH) return
  inputValue.value = `${inputValue.value}${digit}`
}

function clearInput(): void {
  if (solved.value) return
  inputValue.value = ''
}

function deleteLastDigit(): void {
  if (solved.value) return
  inputValue.value = inputValue.value.slice(0, -1)
}

function submitAnswer(): void {
  if (solved.value || inputValue.value.length === 0) return
  const parsed = Number.parseInt(inputValue.value, 10)
  if (!Number.isInteger(parsed)) return

  attempts.value += 1
  if (parsed === question.value.answer) hits.value += 1
  inputValue.value = ''
  question.value = createMentalMathQuestion(difficulty.value)
}

function onKeydown(event: KeyboardEvent): void {
  if (solved.value) return
  if (/^\d$/.test(event.key)) {
    appendDigit(Number(event.key))
    event.preventDefault()
    return
  }
  if (event.key === 'Backspace') {
    deleteLastDigit()
    event.preventDefault()
    return
  }
  if (event.key === 'Delete') {
    clearInput()
    event.preventDefault()
    return
  }
  if (event.key === 'Enter') {
    submitAnswer()
    event.preventDefault()
  }
}

watch(difficulty, (level, previous) => {
  if (level !== previous) newGame(level)
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  newGame('leicht')
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  stopTimer()
})
</script>

<template>
  <GameShell
    title="Kopfrechnen"
    hint="Tastatur: Ziffern, Enter zum Bestätigen, Backspace zum Löschen"
  >
    <template #difficulty>
      <ButtonGroup aria-label="Schwierigkeitsgrad">
        <BaseButton
          v-for="key in difficultyKeys"
          :key="key"
          size="sm"
          :active="difficulty === key"
          @click="difficulty = key"
        >
          {{ MENTAL_MATH_DIFFICULTIES[key].label }}
        </BaseButton>
      </ButtonGroup>
    </template>

    <template #status>
      <span class="time"><InlineIcon name="clock" /> {{ timeLabel }}</span>
      <BaseBadge tone="accent">Treffer: {{ hits }}</BaseBadge>
      <BaseBadge>Bestwert: {{ bestForLevel }}</BaseBadge>
    </template>

    <section class="mental-board" aria-live="polite">
      <p class="mental-board__label">Löse die Aufgabe:</p>
      <p class="mental-board__question">{{ question.text }}</p>
      <BaseInput
        class="mental-board__input"
        :model-value="inputValue"
        inputmode="numeric"
        autocomplete="off"
        readonly
      />
    </section>

    <template #overlay>
      <GameOverlay v-if="solved" tone="success">
        <strong class="win-title">Zeit abgelaufen!</strong>
        <span>{{ hits }} Treffer · {{ hitRate }}% Quote</span>
        <span>Bestwert ({{ MENTAL_MATH_DIFFICULTIES[difficulty].label }}): {{ bestForLevel }}</span>
        <BaseButton variant="primary" @click="newGame()">Neues Spiel</BaseButton>
      </GameOverlay>
    </template>

    <template #input>
      <div class="pad" aria-label="Ziffernblock">
        <BaseButton v-for="digit in keypadDigits" :key="digit" @click="appendDigit(digit)">
          {{ digit }}
        </BaseButton>
        <BaseButton @click="deleteLastDigit">←</BaseButton>
        <BaseButton @click="clearInput">C</BaseButton>
        <BaseButton variant="primary" @click="submitAnswer">OK</BaseButton>
      </div>
      <BaseButton class="new-game" variant="secondary" block @click="newGame()">Neues Spiel</BaseButton>
    </template>
  </GameShell>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.time {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.mental-board {
  display: grid;
  min-height: 15rem;
  align-content: center;
  justify-items: center;
  gap: $space-3;
  padding: $space-5;
  text-align: center;
  @include card-surface;
}

.mental-board__label,
.mental-board__question {
  margin: 0;
}

.mental-board__label {
  color: var(--muted);
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mental-board__question {
  font-size: clamp($font-size-xl, 8vw, 2.8rem);
  font-weight: 800;
}

.mental-board__input {
  width: min(100%, 15rem);
  text-align: center;
  font-size: $font-size-xl;
  font-weight: 700;
}

.mental-board__input:deep(input) {
  text-align: center;
  font-size: $font-size-xl;
  font-weight: 700;
}

.pad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}

.new-game {
  margin-top: $space-3;
}

.win-title {
  font-size: $font-size-display;
}
</style>
