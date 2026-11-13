<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import ButtonGroup from '@/components/molecules/ButtonGroup.vue'
import FormField from '@/components/molecules/FormField.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import {
  chooseQuestionCards,
  createQuizQuestion,
  isQuizAnswerCorrect,
  type QuizCard,
  type QuizDirection,
  type QuizKind,
  type QuizQuestion,
} from '@/domain/quiz'
import { loadCardData, saveCardData, type CardData } from '@/storage/cardStorage'

const data = ref<CardData | null>(null)
const selectedDeckId = ref('')
const kind = ref<QuizKind>('choice')
const direction = ref<QuizDirection>('front-to-back')
const questionCount = ref<'10' | '20' | 'all'>('10')
const questions = ref<QuizQuestion[]>([])
const misses = ref<QuizCard[]>([])
const questionIndex = ref(0)
const correctAnswers = ref(0)
const answerText = ref('')
const selectedAnswer = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const running = ref(false)
const errorMessage = ref('')
const message = ref('')

const selectedDeck = computed(
  () => data.value?.decks.find((deck) => deck.id === selectedDeckId.value),
)
const quizCards = computed<QuizCard[]>(() =>
  selectedDeck.value?.cards.filter((card) => card.back.trim()) ?? [],
)
const currentQuestion = computed(() => questions.value[questionIndex.value])
const correctCount = computed(() => correctAnswers.value)

function cardCount(): number {
  return questionCount.value === 'all' ? quizCards.value.length : Number(questionCount.value)
}

function beginQuiz(retryMisses = false): void {
  errorMessage.value = ''
  message.value = ''
  if (!selectedDeck.value) {
    errorMessage.value = 'Lege zuerst einen Kartenstapel mit Rückseiten an.'
    return
  }
  const cards = retryMisses ? misses.value : quizCards.value
  if (cards.length === 0) {
    errorMessage.value = 'In diesem Stapel gibt es keine Karten mit Rückseite.'
    return
  }
  if (!retryMisses && kind.value === 'choice' && quizCards.value.length < 4) {
    errorMessage.value = 'Für die Auswahl brauchst du mindestens vier Karten mit Rückseite.'
    return
  }
  const selected = retryMisses
    ? [...cards]
    : chooseQuestionCards(cards, cardCount())
  try {
    questions.value = selected.map((card) =>
      createQuizQuestion(card, quizCards.value, kind.value, direction.value),
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Das Quiz konnte nicht vorbereitet werden.'
    return
  }
  misses.value = []
  correctAnswers.value = 0
  questionIndex.value = 0
  answerText.value = ''
  selectedAnswer.value = ''
  answered.value = false
  running.value = true
}

async function submitAnswer(answer: string): Promise<void> {
  if (answered.value || !currentQuestion.value) return
  selectedAnswer.value = answer
  isCorrect.value = isQuizAnswerCorrect(answer, currentQuestion.value)
  answered.value = true
  if (!isCorrect.value) misses.value.push(currentQuestion.value.card)
  else correctAnswers.value++

  if (!data.value) return
  const next = structuredClone(data.value)
  const card = next.decks.find(({ id }) => id === selectedDeckId.value)
    ?.cards.find(({ id }) => id === currentQuestion.value?.card.id)
  if (card) {
    if (isCorrect.value) card.correct++
    else card.incorrect++
  }
  data.value = next
  try {
    const persisted = await saveCardData(next)
    message.value = persisted ? '' : 'Der Browser hat dauerhaften Speicher nicht zugesagt.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Der Lernstand konnte nicht gespeichert werden.'
  }
}

function nextQuestion(): void {
  if (!answered.value) return
  if (questionIndex.value + 1 >= questions.value.length) {
    running.value = false
    return
  }
  questionIndex.value++
  answerText.value = ''
  selectedAnswer.value = ''
  answered.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (!running.value || answered.value || kind.value !== 'choice') return
  const target = event.target
  if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  const index = Number(event.key) - 1
  if (index >= 0 && index < (currentQuestion.value?.choices.length ?? 0)) {
    event.preventDefault()
    void submitAnswer(currentQuestion.value.choices[index])
  }
}

onMounted(() => {
  try {
    data.value = loadCardData()
    selectedDeckId.value = data.value.decks[0]?.id ?? ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kartendaten konnten nicht geladen werden.'
  }
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="quiz-page">
    <header class="page-heading">
      <p class="eyebrow">Lernkarten</p>
      <h1>Quiz</h1>
    </header>

    <p v-if="errorMessage" class="notice notice--error" role="alert">{{ errorMessage }}</p>
    <p v-else-if="message" class="notice" role="status">{{ message }}</p>
    <template v-if="data">
      <template v-if="!running && questions.length === 0">
        <BaseCard class="settings">
          <label class="field-label" for="quiz-deck">Stapel</label>
          <select id="quiz-deck" v-model="selectedDeckId" class="select-input">
            <option v-for="deck in data.decks" :key="deck.id" :value="deck.id">
              {{ deck.name }} ({{ deck.cards.filter((card) => card.back.trim()).length }} mit Rückseite)
            </option>
          </select>

          <p class="field-label">Quiz-Art</p>
          <ButtonGroup aria-label="Quiz-Art">
            <BaseButton :active="kind === 'choice'" @click="kind = 'choice'">Auswahl</BaseButton>
            <BaseButton :active="kind === 'typing'" @click="kind = 'typing'">Eintippen</BaseButton>
          </ButtonGroup>
          <p v-if="kind === 'choice' && quizCards.length < 4" class="hint">
            Für die Auswahl brauchst du mindestens vier Karten mit Rückseite.
          </p>

          <p class="field-label">Richtung</p>
          <ButtonGroup aria-label="Abfragerichtung">
            <BaseButton :active="direction === 'front-to-back'" @click="direction = 'front-to-back'">
              Vorderseite → Rückseite
            </BaseButton>
            <BaseButton :active="direction === 'back-to-front'" @click="direction = 'back-to-front'">
              Rückseite → Vorderseite
            </BaseButton>
          </ButtonGroup>

          <label class="field-label" for="quiz-count">Anzahl Fragen</label>
          <select id="quiz-count" v-model="questionCount" class="select-input">
            <option value="10">10 Fragen</option>
            <option value="20">20 Fragen</option>
            <option value="all">Alle ({{ quizCards.length }})</option>
          </select>
          <BaseButton variant="primary" :disabled="quizCards.length === 0" @click="beginQuiz()">
            Quiz starten
          </BaseButton>
          <p v-if="quizCards.length === 0" class="hint">Füge zuerst Karten mit Rückseiten hinzu.</p>
        </BaseCard>
      </template>

      <template v-else-if="running && currentQuestion">
        <div class="quiz-status">
          <BaseBadge>Frage {{ questionIndex + 1 }} von {{ questions.length }}</BaseBadge>
          <BaseBadge>{{ correctCount }} richtig</BaseBadge>
        </div>
        <BaseCard class="question-card">
          <p class="question-label">{{ direction === 'front-to-back' ? 'Übersetze dieses Wort' : 'Welches Wort passt dazu?' }}</p>
          <h2>{{ currentQuestion.prompt }}</h2>
          <template v-if="kind === 'choice'">
            <div class="choices">
              <BaseButton
                v-for="(choice, index) in currentQuestion.choices"
                :key="choice"
                class="choice"
                :variant="answered && choice === currentQuestion.answer ? 'primary' : 'secondary'"
                :disabled="answered"
                @click="submitAnswer(choice)"
              >
                <span class="choice-number">{{ index + 1 }}</span>{{ choice }}
              </BaseButton>
            </div>
          </template>
          <form v-else class="typing-form" @submit.prevent="submitAnswer(answerText)">
            <FormField label="Deine Antwort" for-id="quiz-answer">
              <BaseInput
                id="quiz-answer"
                v-model="answerText"
                autocomplete="off"
                :disabled="answered"
                autofocus
              />
            </FormField>
            <BaseButton type="submit" variant="primary" :disabled="answered || !answerText.trim()">
              Prüfen
            </BaseButton>
          </form>

          <div v-if="answered" class="answer-feedback" :class="{ 'is-correct': isCorrect }" role="status">
            <strong>{{ isCorrect ? 'Richtig!' : 'Noch nicht.' }}</strong>
            <span v-if="!isCorrect">Richtige Antwort: {{ currentQuestion.answer }}</span>
            <BaseButton variant="primary" @click="nextQuestion">
              {{ questionIndex + 1 === questions.length ? 'Ergebnis anzeigen' : 'Weiter' }}
            </BaseButton>
          </div>
        </BaseCard>
        <p v-if="kind === 'choice'" class="hint">Du kannst auch die Tasten 1–4 verwenden.</p>
      </template>

      <template v-else-if="!running && questions.length > 0">
        <BaseCard class="results">
          <InlineIcon name="quiz" :size="36" />
          <h2>Quiz beendet</h2>
          <p class="score">{{ questions.length - misses.length }} von {{ questions.length }} richtig</p>
          <p v-if="misses.length === 0">Alles richtig – sehr gut!</p>
          <template v-else>
            <h3>Diese Karten wiederholen</h3>
            <ul class="miss-list">
              <li v-for="(card, index) in misses" :key="`${card.id}-${index}`">
                <strong>{{ card.front }}</strong><span>{{ card.back }}</span>
              </li>
            </ul>
            <BaseButton variant="primary" @click="beginQuiz(true)">Falsche wiederholen</BaseButton>
          </template>
          <BaseButton @click="questions = []; misses = []">Zurück zu den Einstellungen</BaseButton>
        </BaseCard>
      </template>
    </template>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.quiz-page {
  width: min(100%, $content-width);
  margin: 0 auto;
  padding: $space-4;
}

.page-heading {
  margin-bottom: $space-5;
}

.eyebrow {
  margin: 0 0 $space-2;
  color: var(--muted);
  font-size: $font-size-sm;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp($font-size-xl, 5vw, $font-size-display);
  letter-spacing: 0.06em;
}

.settings,
.question-card,
.results {
  display: grid;
  gap: $space-4;
  padding: $space-4;
}

.field-label {
  margin: 0;
  font-weight: 700;
}

.select-input {
  width: 100%;
  min-height: $target-size;
  border: $border-width solid var(--surface-border);
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  color: var(--ink);
  background: var(--paper);
  font: inherit;
}

.select-input:focus-visible {
  @include focus-ring;
}

.hint {
  margin: 0;
  color: var(--muted);
  text-align: center;
}

.quiz-status {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  margin: $space-4 0;
}

.question-card {
  width: min(100%, 38rem);
  margin: 0 auto;
  text-align: center;
}

.question-label {
  margin: 0;
  color: var(--muted);
}

.question-card h2 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: clamp($font-size-display, 8vw, 3rem);
}

.choices {
  display: grid;
  gap: $space-2;
}

.choice {
  justify-content: flex-start;
  min-height: 3.5rem;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
}

.choice-number {
  display: inline-flex;
  width: $space-6;
  height: $space-6;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--peer);
}

.typing-form {
  display: grid;
  gap: $space-3;
  text-align: left;
}

.answer-feedback {
  display: grid;
  gap: $space-2;
  border-radius: $radius-md;
  padding: $space-3;
  color: var(--error);
  background: var(--error-bg);
}

.answer-feedback.is-correct {
  color: var(--ink);
  background: var(--same);
}

.results {
  justify-items: center;
  text-align: center;
}

.results h2,
.results h3 {
  margin: 0;
}

.score {
  margin: 0;
  font-size: $font-size-display;
  font-weight: 800;
}

.miss-list {
  display: grid;
  width: 100%;
  gap: $space-2;
  margin: 0;
  padding: 0;
  text-align: left;
  list-style: none;
}

.miss-list li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: $space-2;
  border-bottom: $border-width solid var(--surface-border);
  padding: $space-2 0;
}

.miss-list span {
  color: var(--muted);
}

.notice {
  border-radius: $radius-md;
  padding: $space-3;
  background: var(--same);
}

.notice--error {
  color: var(--error);
  background: var(--error-bg);
}
</style>
