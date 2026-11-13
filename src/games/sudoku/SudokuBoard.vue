<script setup lang="ts">
import { computed } from 'vue'
import type { Grid } from '@/games/sudoku/sudoku'

const props = defineProps<{
  grid: Grid
  givens: boolean[]
  errors: Set<number>
  selected: number | null
}>()
const emit = defineEmits<{ select: [index: number] }>()

const selectedValue = computed(() => props.selected !== null ? props.grid[props.selected] : 0)

function isPeer(index: number): boolean {
  const selected = props.selected
  if (selected === null || selected === index) return false
  const sameRow = Math.floor(index / 9) === Math.floor(selected / 9)
  const sameColumn = index % 9 === selected % 9
  const sameBox =
    Math.floor(Math.floor(index / 9) / 3) === Math.floor(Math.floor(selected / 9) / 3) &&
    Math.floor((index % 9) / 3) === Math.floor((selected % 9) / 3)
  return sameRow || sameColumn || sameBox
}

function cellClass(index: number) {
  const column = index % 9
  const row = Math.floor(index / 9)
  return {
    given: props.givens[index],
    error: props.errors.has(index),
    selected: props.selected === index,
    peer: isPeer(index),
    same: selectedValue.value !== 0 && props.grid[index] === selectedValue.value,
    'border-right': column === 2 || column === 5,
    'border-bottom': row === 2 || row === 5,
  }
}
</script>

<template>
  <div class="board" role="grid" aria-label="Sudoku-Spielfeld">
    <button
      v-for="(value, index) in props.grid"
      :key="index"
      type="button"
      class="cell"
      :class="cellClass(index)"
      :aria-label="`Zeile ${Math.floor(index / 9) + 1}, Spalte ${(index % 9) + 1}${value ? ', ' + value : ', leer'}`"
      @click="emit('select', index)"
    >
      {{ value || '' }}
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.board {
  display: grid;
  width: min(100%, $game-width);
  aspect-ratio: 1;
  grid-template-columns: repeat(9, 1fr);
  gap: $border-width;
  border: $focus-width solid var(--ink);
  background: var(--ink);
}

.cell {
  @include button-reset;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  font-size: clamp($font-size-lg, 4.5vw, $font-size-display);
  color: var(--user);
  user-select: none;
  transition: background-color 0.1s;
}

.cell.border-right {
  border-right: $focus-width solid var(--ink);
}

.cell.border-bottom {
  border-bottom: $focus-width solid var(--ink);
}

.cell.given {
  color: var(--ink);
  font-weight: 700;
}

.cell.peer {
  background: var(--peer);
}

.cell.same {
  background: var(--same);
}

.cell.selected {
  background: var(--select);
}

.cell.error {
  color: var(--error);
  background: var(--error-bg);
}

.cell.selected.error {
  background: var(--error-bg-strong);
}

.cell:focus-visible {
  outline: $border-width solid var(--focus-ring);
  outline-offset: -$border-width;
}
</style>
