<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import FormField from '@/components/molecules/FormField.vue'
import {
  createCardId,
  createEmptyCardData,
  loadCardData,
  saveCardData,
  type Card,
  type CardData,
} from '@/storage/cardStorage'
import { parseCardText } from '@/domain/cards'

const data = ref<CardData>(createEmptyCardData())
const selectedDeckId = ref('my-words')
const ready = ref(false)
const message = ref('')
const errorMessage = ref('')
const bulkText = ref('')
const search = ref('')
const deckName = ref('')
const renameName = ref('')
const filteredIndex = ref(0)
const editingCardId = ref<string | null>(null)
const editFront = ref('')
const editBack = ref('')
const flipped = ref(false)
const pointerStartX = ref<number | null>(null)

const selectedDeck = computed(
  () => data.value.decks.find((deck) => deck.id === selectedDeckId.value) ?? data.value.decks[0],
)
const filteredCards = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('de')
  return selectedDeck.value?.cards.filter((card) =>
    !query || card.front.toLocaleLowerCase('de').includes(query) ||
      card.back.toLocaleLowerCase('de').includes(query),
  ) ?? []
})
const currentCard = computed(() => filteredCards.value[filteredIndex.value])
const parsedPreview = computed(() =>
  parseCardText(bulkText.value, selectedDeck.value?.cards.map((card) => card.front) ?? []),
)

watch(selectedDeckId, (id) => {
  renameName.value = data.value.decks.find((deck) => deck.id === id)?.name ?? ''
  filteredIndex.value = 0
  flipped.value = false
  search.value = ''
  editingCardId.value = null
})
watch(filteredCards, () => {
  filteredIndex.value = Math.min(filteredIndex.value, Math.max(0, filteredCards.value.length - 1))
  flipped.value = false
})

async function commit(change: (next: CardData) => void): Promise<boolean> {
  errorMessage.value = ''
  message.value = ''
  const next = structuredClone(data.value)
  change(next)
  try {
    const persisted = await saveCardData(next)
    data.value = next
    message.value = persisted
      ? 'Gespeichert.'
      : 'Gespeichert; der Browser hat dauerhaften Speicher nicht zugesagt.'
    return true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.'
    return false
  }
}

async function addCards(): Promise<void> {
  if (!selectedDeck.value || parsedPreview.value.cards.length === 0) return
  const added = parsedPreview.value.cards.length
  const duplicates = parsedPreview.value.duplicates
  const succeeded = await commit((next) => {
    const deck = next.decks.find(({ id }) => id === selectedDeckId.value)
    if (!deck) return
    deck.cards.push(...parsedPreview.value.cards.map(({ front, back }) => ({
      id: createCardId(),
      front,
      back,
      correct: 0,
      incorrect: 0,
    })))
  })
  if (succeeded) {
    bulkText.value = ''
    message.value = `${added} ${added === 1 ? 'Karte' : 'Karten'} gespeichert${duplicates ? `, ${duplicates} doppelte übersprungen` : ''}.`
  }
}

async function createDeck(): Promise<void> {
  const name = deckName.value.trim()
  if (!name) return
  const id = createCardId()
  if (await commit((next) => next.decks.push({ id, name, cards: [] }))) {
    deckName.value = ''
    selectedDeckId.value = id
  }
}

async function renameDeck(): Promise<void> {
  const name = renameName.value.trim()
  if (!name || !selectedDeck.value) return
  await commit((next) => {
    const deck = next.decks.find(({ id }) => id === selectedDeckId.value)
    if (deck) deck.name = name
  })
}

async function deleteDeck(): Promise<void> {
  if (!selectedDeck.value || !window.confirm(`Stapel „${selectedDeck.value.name}“ mit allen Karten löschen?`)) return
  const id = selectedDeckId.value
  if (await commit((next) => {
    next.decks = next.decks.filter((deck) => deck.id !== id)
    if (next.decks.length === 0) next.decks = createEmptyCardData().decks
  })) {
    selectedDeckId.value = data.value.decks[0].id
  }
}

function beginEdit(card: Card): void {
  editingCardId.value = card.id
  editFront.value = card.front
  editBack.value = card.back
}

async function saveEdit(): Promise<void> {
  const id = editingCardId.value
  const front = editFront.value.trim()
  if (!id || !front) return
  if (await commit((next) => {
    const card = next.decks.find(({ id: deckId }) => deckId === selectedDeckId.value)
      ?.cards.find(({ id: cardId }) => cardId === id)
    if (card) {
      card.front = front
      card.back = editBack.value.trim()
    }
  })) editingCardId.value = null
}

async function deleteCard(card: Card): Promise<void> {
  await commit((next) => {
    const deck = next.decks.find(({ id }) => id === selectedDeckId.value)
    if (deck) deck.cards = deck.cards.filter(({ id }) => id !== card.id)
  })
}

function showPrevious(): void {
  if (filteredCards.value.length === 0) return
  filteredIndex.value = (filteredIndex.value - 1 + filteredCards.value.length) % filteredCards.value.length
  flipped.value = false
}

function showNext(): void {
  if (filteredCards.value.length === 0) return
  filteredIndex.value = (filteredIndex.value + 1) % filteredCards.value.length
  flipped.value = false
}

function onKeydown(event: KeyboardEvent): void {
  const target = event.target
  if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showPrevious()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    showNext()
  } else if (event.key === ' ' && currentCard.value) {
    event.preventDefault()
    flipped.value = !flipped.value
  }
}

function onPointerDown(event: PointerEvent): void {
  pointerStartX.value = event.clientX
}

function onPointerUp(event: PointerEvent): void {
  if (pointerStartX.value === null) return
  const delta = event.clientX - pointerStartX.value
  pointerStartX.value = null
  if (Math.abs(delta) > 40) delta < 0 ? showNext() : showPrevious()
}

onMounted(() => {
  try {
    data.value = loadCardData()
    selectedDeckId.value = data.value.decks[0]?.id ?? ''
    renameName.value = data.value.decks[0]?.name ?? ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Kartendaten konnten nicht geladen werden.'
  } finally {
    ready.value = true
  }
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="cards-page">
    <header class="page-heading">
      <p class="eyebrow">Lernkarten</p>
      <h1>Deine Wörter</h1>
    </header>

    <p v-if="errorMessage" class="notice notice--error" role="alert">{{ errorMessage }}</p>
    <p v-else-if="message" class="notice" role="status">{{ message }}</p>
    <template v-if="ready">
      <section class="deck-tools" aria-label="Stapel verwalten">
        <label class="sr-only" for="deck-select">Stapel auswählen</label>
        <select id="deck-select" v-model="selectedDeckId" class="select-input">
          <option v-for="deck in data.decks" :key="deck.id" :value="deck.id">{{ deck.name }}</option>
        </select>
        <BaseBadge>{{ selectedDeck?.cards.length ?? 0 }} Karten</BaseBadge>
        <form class="deck-form" @submit.prevent="createDeck">
          <BaseInput v-model="deckName" placeholder="Neuer Stapel" aria-label="Name des neuen Stapels" />
          <BaseButton type="submit" :disabled="!deckName.trim()">Anlegen</BaseButton>
        </form>
        <form v-if="selectedDeck" class="deck-form" @submit.prevent="renameDeck">
          <BaseInput v-model="renameName" aria-label="Stapel umbenennen" />
          <BaseButton type="submit" :disabled="!renameName.trim() || renameName.trim() === selectedDeck.name">
            Umbenennen
          </BaseButton>
          <BaseButton variant="ghost" type="button" aria-label="Stapel löschen" @click="deleteDeck">
            Löschen
          </BaseButton>
        </form>
      </section>

      <section class="section">
        <h2>Karten hinzufügen</h2>
        <BaseCard>
          <form class="bulk-form" @submit.prevent="addCards">
            <FormField
              label="Eine Karte pro Zeile: Vorderseite = Rückseite"
              for-id="bulk-cards"
              hint="Eine Zeile ohne Gleichheitszeichen ergibt eine Karte ohne Rückseite."
            >
              <textarea
                id="bulk-cards"
                v-model="bulkText"
                class="text-area"
                rows="6"
                placeholder="Hund = dog&#10;Katze = cat&#10;Vogel"
              />
            </FormField>
            <p class="preview" aria-live="polite">
              {{ parsedPreview.cards.length }} Karten werden hinzugefügt
              <span v-if="parsedPreview.duplicates"> · {{ parsedPreview.duplicates }} doppelte werden übersprungen</span>
            </p>
            <BaseButton type="submit" variant="primary" :disabled="parsedPreview.cards.length === 0">
              Karten speichern
            </BaseButton>
          </form>
        </BaseCard>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Karten durchblättern</h2>
          <span v-if="currentCard">{{ filteredIndex + 1 }} / {{ filteredCards.length }}</span>
        </div>
        <BaseCard v-if="currentCard" class="flash-card">
          <button
            class="flash-card__face"
            type="button"
            :aria-label="flipped ? 'Rückseite der Karte; antippen zum Umdrehen' : 'Vorderseite der Karte; antippen zum Umdrehen'"
            @click="flipped = !flipped"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
            @pointercancel="pointerStartX = null"
          >
            <span class="flash-card__label">{{ flipped ? 'Rückseite' : 'Vorderseite' }}</span>
            <strong>{{ flipped ? (currentCard.back || 'Keine Rückseite') : currentCard.front }}</strong>
            <span class="flash-card__hint">Antippen zum Umdrehen · Wischen zum Blättern</span>
          </button>
          <div class="flash-card__navigation">
            <BaseButton aria-label="Vorherige Karte" @click="showPrevious">Zurück</BaseButton>
            <BaseButton aria-label="Nächste Karte" variant="primary" @click="showNext">Weiter</BaseButton>
          </div>
        </BaseCard>
        <BaseCard v-else><p class="empty">Füge Karten hinzu, um hier durchzublättern.</p></BaseCard>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Kartenliste</h2>
          <label class="search">
            <span class="sr-only">Karten durchsuchen</span>
            <InlineIcon name="search" />
            <BaseInput v-model="search" type="search" placeholder="Karten durchsuchen" />
          </label>
        </div>
        <ul v-if="filteredCards.length" class="card-list">
          <li v-for="card in filteredCards" :key="card.id">
            <BaseCard class="card-row">
              <form v-if="editingCardId === card.id" class="edit-form" @submit.prevent="saveEdit">
                <FormField label="Vorderseite" :for-id="`front-${card.id}`">
                  <BaseInput :id="`front-${card.id}`" v-model="editFront" />
                </FormField>
                <FormField label="Rückseite" :for-id="`back-${card.id}`">
                  <BaseInput :id="`back-${card.id}`" v-model="editBack" />
                </FormField>
                <div class="row-actions">
                  <BaseButton type="submit" variant="primary" :disabled="!editFront.trim()">Speichern</BaseButton>
                  <BaseButton type="button" @click="editingCardId = null">Abbrechen</BaseButton>
                </div>
              </form>
              <template v-else>
                <div class="card-copy">
                  <strong>{{ card.front }}</strong>
                  <span>{{ card.back || 'Keine Rückseite' }}</span>
                </div>
                <div class="row-actions">
                  <BaseButton icon-only aria-label="Karte bearbeiten" @click="beginEdit(card)">
                    <InlineIcon name="edit" />
                  </BaseButton>
                  <BaseButton icon-only aria-label="Karte löschen" @click="deleteCard(card)">
                    <InlineIcon name="trash" />
                  </BaseButton>
                </div>
              </template>
            </BaseCard>
          </li>
        </ul>
        <BaseCard v-else><p class="empty">Keine passenden Karten gefunden.</p></BaseCard>
      </section>
    </template>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.cards-page {
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

.deck-tools,
.section {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-5;
}

.deck-tools {
  padding: $space-3;
  border: $border-width solid var(--surface-border);
  border-radius: $radius-md;
  background: var(--paper);
}

.deck-form {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.deck-form :deep(.base-input) {
  flex: 1 1 10rem;
}

.select-input,
.text-area {
  width: 100%;
  min-height: $target-size;
  border: $border-width solid var(--surface-border);
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  color: var(--ink);
  background: var(--paper);
  font: inherit;
}

.text-area {
  min-height: 9rem;
  resize: vertical;
}

.text-area:focus-visible,
.select-input:focus-visible {
  @include focus-ring;
}

.section h2 {
  margin: 0;
  font-size: $font-size-lg;
}

.bulk-form {
  display: grid;
  gap: $space-3;
}

.preview,
.empty {
  margin: 0;
  color: var(--muted);
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.search {
  display: flex;
  min-width: min(100%, 16rem);
  align-items: center;
  gap: $space-2;
}

.flash-card {
  display: grid;
  gap: $space-3;
  padding: $space-3;
}

.flash-card__face {
  @include button-reset;
  display: flex;
  min-height: 12rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  border-radius: $radius-md;
  padding: $space-4;
  text-align: center;
  background: var(--same);
  touch-action: pan-y;
}

.flash-card__face:focus-visible {
  @include focus-ring;
}

.flash-card__face strong {
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: clamp($font-size-xl, 5vw, $font-size-display);
}

.flash-card__label,
.flash-card__hint {
  color: var(--muted);
  font-size: $font-size-sm;
}

.flash-card__navigation,
.row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: $space-2;
}

.card-list {
  display: grid;
  gap: $space-2;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3;
}

.card-copy {
  display: grid;
  min-width: 0;
  gap: $space-1;
}

.card-copy strong,
.card-copy span {
  overflow-wrap: anywhere;
}

.card-copy span {
  color: var(--muted);
}

.edit-form {
  display: grid;
  width: 100%;
  gap: $space-3;
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@media (min-width: $breakpoint-nav) {
  .deck-tools {
    grid-template-columns: minmax(12rem, 1fr) auto;
    align-items: center;
  }

  .deck-tools .deck-form {
    grid-column: span 2;
  }
}
</style>
