<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import FormField from '@/components/molecules/FormField.vue'
import GameOverlay from '@/components/molecules/GameOverlay.vue'
import GameShell from '@/components/organisms/GameShell.vue'
import { createGuessGame } from './guessTheNumber'

const guess = ref('')
const feedback = ref<string | null>(null)
const guesses = ref(0)
const seconds = ref(0)
const game = createGuessGame()
const won = computed(() => feedback.value?.startsWith('Glückwunsch!') ?? false)
const timeLabel = computed(() => {
  const minutes = Math.floor(seconds.value / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}`
})
let timer: number | undefined

function makeGuess(): void {
  const value = Number(guess.value)
  if (!Number.isInteger(value) || value < 1 || value > 200) {
    feedback.value = 'Bitte gib eine Zahl zwischen 1 und 200 ein.'
    return
  }
  feedback.value = game.guessNumber(value)
  guesses.value++
  guess.value = ''
}

function resetGame(): void {
  game.reset()
  guess.value = ''
  feedback.value = null
  guesses.value = 0
  seconds.value = 0
}

onMounted(() => {
  timer = window.setInterval(() => {
    if (!won.value) seconds.value++
  }, 1000)
})

onUnmounted(() => {
  if (timer !== undefined) window.clearInterval(timer)
})
</script>

<template>
  <GameShell title="Zahlenraten" hint="Gib deine Zahl ein und bestätige mit Enter.">
    <template #difficulty>
      <BaseBadge tone="accent">Zahlenbereich 1–200</BaseBadge>
    </template>

    <template #status>
      <span>{{ timeLabel }}</span>
      <BaseBadge>{{ guesses }} {{ guesses === 1 ? 'Versuch' : 'Versuche' }}</BaseBadge>
    </template>

    <div class="guess-board">
      <p class="prompt">Ich denke an eine Zahl zwischen 1 und 200.</p>
      <form class="guess-form" @submit.prevent="makeGuess">
        <FormField label="Deine Zahl" for-id="guess">
          <BaseInput
            id="guess"
            v-model="guess"
            type="number"
            min="1"
            max="200"
            inputmode="numeric"
            autocomplete="off"
            :disabled="won"
            placeholder="1–200"
          />
        </FormField>
        <BaseButton type="submit" variant="primary" :disabled="won">Raten</BaseButton>
      </form>
      <p v-if="feedback" class="feedback" aria-live="polite">{{ feedback }}</p>
    </div>

    <template #overlay>
      <GameOverlay v-if="won" tone="success">
        <strong class="win-title">Gefunden!</strong>
        <span>{{ guesses }} {{ guesses === 1 ? 'Versuch' : 'Versuche' }} · {{ timeLabel }}</span>
        <BaseButton variant="primary" @click="resetGame">Neues Spiel</BaseButton>
      </GameOverlay>
    </template>

    <template #input>
      <BaseButton variant="secondary" block @click="resetGame">Neues Spiel</BaseButton>
    </template>
  </GameShell>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.guess-board {
  display: grid;
  min-height: $game-width;
  align-content: center;
  gap: $space-5;
  padding: $space-5;
  text-align: center;
  @include card-surface;
  background: linear-gradient(90deg, var(--error-bg), var(--error-bg-strong));
}

.prompt,
.feedback {
  margin: 0;
}

.guess-form {
  display: grid;
  gap: $space-3;
  text-align: left;
}

.win-title {
  font-size: $font-size-display;
}
</style>
