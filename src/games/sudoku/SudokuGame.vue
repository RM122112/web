<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCheckbox from '@/components/atoms/BaseCheckbox.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import ButtonGroup from '@/components/molecules/ButtonGroup.vue'
import GameOverlay from '@/components/molecules/GameOverlay.vue'
import GameShell from '@/components/organisms/GameShell.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import SudokuBoard from './SudokuBoard.vue'
import {
  DIFFICULTIES,
  generatePuzzle,
  type Difficulty,
  type Grid,
} from '@/games/sudoku/sudoku'

const difficulty = ref<Difficulty>('leicht')
const grid = ref<Grid>(new Array(81).fill(0))
const solution = ref<Grid>([])
const givens = ref<boolean[]>(new Array(81).fill(false))
const selected = ref<number | null>(null)
const showErrors = ref(true)
const mistakes = ref(0)
const seconds = ref(0)
const loading = ref(false)
const isTimerPaused = ref(false)
let timer: number | undefined
let generationTimeout: number | undefined

const difficultyKeys = Object.keys(DIFFICULTIES) as Difficulty[]
const errors = computed<Set<number>>(() => {
  const set = new Set<number>()
  if (!showErrors.value || solution.value.length === 0) return set
  grid.value.forEach((value, index) => {
    if (value !== 0 && !givens.value[index] && value !== solution.value[index]) set.add(index)
  })
  return set
})
const solved = computed(
  () => solution.value.length === 81 && grid.value.every((value, index) => value === solution.value[index]),
)
const digitDone = computed(() => {
  const counts = new Array(10).fill(0)
  grid.value.forEach((value, index) => {
    if (value !== 0 && value === solution.value[index]) counts[value]++
  })
  return counts.map((count) => count >= 9)
})
const timeLabel = computed(() => {
  const minutes = Math.floor(seconds.value / 60)
  const remainder = seconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
})

function runTimer(): void {
  stopTimer()
  timer = window.setInterval(() => {
    if (!solved.value) seconds.value++
  }, 1000)
}

function stopTimer(): void {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
}

function pauseTimer(): void {
  if (timer !== undefined) {
    stopTimer()
    isTimerPaused.value = true
  } else {
    runTimer()
    isTimerPaused.value = false
  }
}

function newGame(level: Difficulty = difficulty.value): void {
  difficulty.value = level
  loading.value = true
  selected.value = null
  if (generationTimeout !== undefined) window.clearTimeout(generationTimeout)
  generationTimeout = window.setTimeout(() => {
    const { puzzle, solution: nextSolution } = generatePuzzle(level)
    grid.value = [...puzzle]
    solution.value = nextSolution
    givens.value = puzzle.map((value) => value !== 0)
    mistakes.value = 0
    seconds.value = 0
    loading.value = false
    isTimerPaused.value = false
    runTimer()
  }, 20)
}

function setValue(value: number): void {
  const index = selected.value
  if (index === null || givens.value[index] || solved.value) return
  if (value !== 0 && value !== grid.value[index] && value !== solution.value[index]) mistakes.value++
  const next = [...grid.value]
  next[index] = grid.value[index] === value ? 0 : value
  grid.value = next
}

function moveSelection(rowDelta: number, columnDelta: number): void {
  const index = selected.value ?? 40
  const row = (Math.floor(index / 9) + rowDelta + 9) % 9
  const column = ((index % 9) + columnDelta + 9) % 9
  selected.value = row * 9 + column
}

function onKey(event: KeyboardEvent): void {
  if (loading.value) return
  if (/^[1-9]$/.test(event.key)) setValue(Number(event.key))
  else if (['Backspace', 'Delete', '0'].includes(event.key)) setValue(0)
  else if (event.key === 'ArrowUp') moveSelection(-1, 0)
  else if (event.key === 'ArrowDown') moveSelection(1, 0)
  else if (event.key === 'ArrowLeft') moveSelection(0, -1)
  else if (event.key === 'ArrowRight') moveSelection(0, 1)
  else return
  event.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  newGame('leicht')
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  stopTimer()
  if (generationTimeout !== undefined) window.clearTimeout(generationTimeout)
})
</script>

<template>
  <GameShell
    title="Sudoku"
    hint="Tastatur: Ziffern 1–9, Pfeiltasten und Entf/Backspace zum Löschen"
  >
    <template #difficulty>
      <ButtonGroup aria-label="Schwierigkeitsgrad">
        <BaseButton
          v-for="key in difficultyKeys"
          :key="key"
          size="sm"
          :active="key === difficulty"
          :disabled="loading"
          @click="newGame(key)"
        >
          {{ DIFFICULTIES[key].label }}
        </BaseButton>
      </ButtonGroup>
    </template>

    <template #status>
      <span class="time"><InlineIcon name="clock" /> {{ timeLabel }}</span>
      <BaseButton
        size="sm"
        icon-only
        :aria-label="isTimerPaused ? 'Zeitmessung fortsetzen' : 'Zeitmessung pausieren'"
        :disabled="loading || solved"
        @click="pauseTimer"
      >
        <InlineIcon :name="isTimerPaused ? 'play' : 'pause'" />
      </BaseButton>
      <BaseBadge tone="error">Fehler: {{ mistakes }}</BaseBadge>
      <label class="error-toggle">
        <BaseCheckbox v-model="showErrors" />
        Fehler markieren
      </label>
    </template>

    <SudokuBoard
      :grid="grid"
      :givens="givens"
      :errors="errors"
      :selected="selected"
      @select="selected = $event"
    />

    <template #overlay>
      <GameOverlay v-if="loading">
        <strong>Erzeuge Rätsel …</strong>
      </GameOverlay>
      <GameOverlay v-else-if="solved" tone="success">
        <strong class="win-title">Gelöst!</strong>
        <span>{{ DIFFICULTIES[difficulty].label }} in {{ timeLabel }} · {{ mistakes }} Fehler</span>
        <BaseButton variant="primary" @click="newGame()">Neues Spiel</BaseButton>
      </GameOverlay>
    </template>

    <template #input>
      <div class="pad" aria-label="Ziffernblock">
        <BaseButton
          v-for="number in 9"
          :key="number"
          :class="{ done: digitDone[number] }"
          :disabled="loading || solved"
          @click="setValue(number)"
        >
          {{ number }}
        </BaseButton>
        <BaseButton class="erase" @click="setValue(0)">Löschen</BaseButton>
      </div>
      <BaseButton class="new-game" variant="primary" block :disabled="loading" @click="newGame()">
        Neues Spiel
      </BaseButton>
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

.error-toggle {
  display: inline-flex;
  min-height: $target-size;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
}

.pad {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $space-2;
}

.pad :deep(.base-button) {
  font-size: $font-size-xl;
}

.pad :deep(.done) {
  opacity: 0.35;
}

.pad :deep(.erase) {
  font-size: $font-size-sm;
}

.new-game {
  margin-top: $space-3;
}

.win-title {
  font-size: $font-size-display;
}
</style>
