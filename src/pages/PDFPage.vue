<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import ButtonGroup from '@/components/molecules/ButtonGroup.vue'
import FormField from '@/components/molecules/FormField.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import { findPdfMatches, isSafePdfPath, publicPdfUrl, splitTextForHighlight } from '@/domain/pdf'
import { createCardId, loadCardData, saveCardData, type CardData } from '@/storage/cardStorage'
import {
  deletePdfRecord,
  getPdfRecord,
  listPdfRecords,
  savePdfRecord,
  type PdfMark,
  type PdfMarkBox,
  type PdfMarkColor,
  type PdfRecord,
} from '@/storage/pdfStorage'

interface PublicPdf {
  id: string
  name: string
  url: string
  source: 'public'
}

interface PlacedTextItem {
  text: string
  left: number
  top: number
  width: number
  height: number
  parts: Array<{ text: string; hit: boolean }>
}

const publicPdfs = ref<PublicPdf[]>([])
const localPdfs = ref<PdfRecord[]>([])
const activeRecord = ref<PdfRecord | null>(null)
const documentProxy = ref<PDFDocumentProxy | null>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const loading = ref(false)
const pageLoading = ref(false)
const storageError = ref('')
const errorMessage = ref('')
const infoMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const pageFrame = ref<HTMLElement | null>(null)
const pageSize = ref({ width: 0, height: 0 })
const pageItems = ref<PlacedTextItem[]>([])
const pageHasText = ref(false)
const queryInput = ref('')
const searchQuery = ref('')
const searchHits = ref<ReturnType<typeof findPdfMatches>>([])
const activeHit = ref(0)
const annotationColor = ref<PdfMarkColor>('yellow')
const selectedQuote = ref('')
const cardBack = ref('')
const cardDeckId = ref('')
const cardData = ref<CardData | null>(null)
const showCardForm = ref(false)
const hasDocumentText = ref(true)

const pageMarks = computed(
  () => activeRecord.value?.marks.filter((mark) => mark.page === currentPage.value) ?? [],
)
const searchCounter = computed(() =>
  searchHits.value.length ? `${activeHit.value + 1} von ${searchHits.value.length}` : '0 Treffer',
)
const hasSelection = computed(() => selectedQuote.value.length > 0)
const canMark = computed(() => Boolean(documentProxy.value && hasDocumentText.value && pageHasText.value))
const canSearch = computed(() => Boolean(documentProxy.value && hasDocumentText.value))

let renderGeneration = 0
let selectionHandler: (() => void) | undefined

function handleResize(): void {
  if (documentProxy.value) void renderCurrentPage()
}

function showError(error: unknown, fallback: string): void {
  errorMessage.value = error instanceof Error ? error.message : fallback
}

async function loadLibrary(): Promise<void> {
  errorMessage.value = ''
  try {
    localPdfs.value = await listPdfRecords()
  } catch (error) {
    showError(error, 'Die gespeicherten PDFs konnten nicht geladen werden.')
  }
  try {
    const response = await fetch('/pdfs/index.json', { cache: 'no-store' })
    if (response.status === 404) {
      publicPdfs.value = []
      return
    }
    if (!response.ok) throw new Error('Die PDF-Liste konnte nicht geladen werden.')
    if (!response.headers.get('content-type')?.includes('json')) {
      publicPdfs.value = []
      return
    }
    const names: unknown = await response.json()
    if (!Array.isArray(names) || !names.every(isSafePdfPath)) {
      throw new Error('Die Datei pdfs/index.json enthält ungültige PDF-Dateinamen.')
    }
    publicPdfs.value = names.map((name) => ({
      id: `public:${name}`,
      name: name.split('/').at(-1) ?? name,
      url: publicPdfUrl(name),
      source: 'public',
    }))
  } catch (error) {
    if (error instanceof TypeError) {
      errorMessage.value = 'Die PDF-Liste konnte nicht geladen werden.'
    } else {
      showError(error, 'Die PDF-Liste konnte nicht geladen werden.')
    }
  }
}

async function openPdf(entry: PdfRecord | PublicPdf): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  closeDocument()
  try {
    const existing = await getPdfRecord(entry.id)
    let record: PdfRecord
    if (entry.source === 'local') {
      record = existing ?? entry
    } else {
      record = existing ?? {
        id: entry.id,
        name: entry.name,
        source: 'public',
        url: entry.url,
        lastPage: 1,
        marks: [],
      }
      if (!record.blob) {
        const url = 'url' in entry ? entry.url : undefined
        if (!url) throw new Error('Der PDF-Pfad fehlt.')
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Das PDF „${entry.name}“ konnte nicht geöffnet werden.`)
        record.blob = await response.blob()
      }
      record.name = entry.name
      record.url = entry.url
    }
    if (!record.blob) throw new Error('Die PDF-Datei ist im Browserspeicher nicht vorhanden.')

    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
    const pdf = await pdfjs.getDocument({ data: await record.blob.arrayBuffer() }).promise
    documentProxy.value = pdf
    activeRecord.value = record
    totalPages.value = pdf.numPages
    currentPage.value = Math.max(1, Math.min(record.lastPage || 1, pdf.numPages))
    const persisted = await savePdfRecord(record)
    if (!persisted) infoMessage.value = 'Der Browser hat dauerhaften Speicher nicht zugesagt.'
    if (record.source === 'local') {
      localPdfs.value = await listPdfRecords()
    }
  } catch (error) {
    showError(error, 'Das PDF konnte nicht geöffnet werden.')
    closeDocument()
  } finally {
    loading.value = false
  }
}

function closeDocument(): void {
  void documentProxy.value?.cleanup().catch(() => undefined)
  documentProxy.value = null
  activeRecord.value = null
  pageItems.value = []
  searchHits.value = []
  searchQuery.value = ''
  selectedQuote.value = ''
  currentPage.value = 1
  totalPages.value = 0
}

async function addPdfFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  errorMessage.value = ''
  try {
    const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer())
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Bitte wähle eine PDF-Datei aus.')
    }
    if (new TextDecoder().decode(bytes) !== '%PDF-') throw new Error('Die ausgewählte Datei ist kein gültiges PDF.')
    const record: PdfRecord = {
      id: `local:${createCardId()}`,
      name: file.name,
      source: 'local',
      blob: file,
      lastPage: 1,
      marks: [],
    }
    const persisted = await savePdfRecord(record)
    localPdfs.value = [record, ...localPdfs.value]
    if (!persisted) infoMessage.value = 'Der Browser hat dauerhaften Speicher nicht zugesagt.'
    await openPdf(record)
  } catch (error) {
    showError(error, 'Die PDF-Datei konnte nicht gespeichert werden.')
  }
}

async function removePdf(record: PdfRecord): Promise<void> {
  if (!window.confirm(`„${record.name}“ aus diesem Gerät entfernen?`)) return
  try {
    await deletePdfRecord(record.id)
    localPdfs.value = localPdfs.value.filter((pdf) => pdf.id !== record.id)
    if (activeRecord.value?.id === record.id) closeDocument()
  } catch (error) {
    showError(error, 'Das PDF konnte nicht entfernt werden.')
  }
}

async function renderCurrentPage(): Promise<void> {
  const generation = ++renderGeneration
  const pdf = documentProxy.value
  const targetCanvas = canvas.value
  const frame = pageFrame.value
  if (!pdf || !targetCanvas || !frame) return
  pageLoading.value = true
  pageItems.value = []
  pageHasText.value = false
  try {
    const page: PDFPageProxy = await pdf.getPage(currentPage.value)
    if (generation !== renderGeneration) return
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(1.6, (frame.clientWidth || 600) / baseViewport.width)
    const viewport = page.getViewport({ scale })
    pageSize.value = { width: viewport.width, height: viewport.height }

    const context = targetCanvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Die PDF-Seite kann in diesem Browser nicht dargestellt werden.')
    const pixelRatio = window.devicePixelRatio || 1
    targetCanvas.width = Math.ceil(viewport.width * pixelRatio)
    targetCanvas.height = Math.ceil(viewport.height * pixelRatio)
    targetCanvas.style.width = `${viewport.width}px`
    targetCanvas.style.height = `${viewport.height}px`
    await page.render({
      canvas: targetCanvas,
      canvasContext: context,
      viewport,
      transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    }).promise
    const content = await page.getTextContent()
    if (generation !== renderGeneration) return
    const textItems: PlacedTextItem[] = []
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5])
      const height = Math.max(1, Math.hypot(item.transform[2], item.transform[3]) * scale)
      textItems.push({
        text: item.str,
        left: x,
        top: y - height,
        width: Math.max(item.width * scale, height / 3),
        height,
        parts: splitTextForHighlight(item.str, searchQuery.value),
      })
    }
    pageItems.value = textItems
    pageHasText.value = textItems.length > 0
    if (textItems.length) hasDocumentText.value = true
  } catch (error) {
    if (generation === renderGeneration) showError(error, 'Die PDF-Seite konnte nicht dargestellt werden.')
  } finally {
    if (generation === renderGeneration) pageLoading.value = false
  }
}

watch([documentProxy, currentPage], () => void renderCurrentPage(), { flush: 'post' })

function changePage(pageNumber: number): void {
  if (!documentProxy.value) return
  const page = Math.max(1, Math.min(totalPages.value, Math.round(pageNumber)))
  currentPage.value = page
  if (activeRecord.value) {
    const next = { ...activeRecord.value, lastPage: page }
    activeRecord.value = next
    void savePdfRecord(next).catch((error: unknown) => showError(error, 'Der Lesestand konnte nicht gespeichert werden.'))
  }
}

async function runSearch(): Promise<void> {
  if (!documentProxy.value || !hasDocumentText.value) return
  const query = queryInput.value.trim()
  searchQuery.value = query
  searchHits.value = []
  activeHit.value = 0
  if (!query) {
    infoMessage.value = ''
    return
  }
  loading.value = true
  try {
    const pages: Array<{ page: number; items: Array<{ text: string }> }> = []
    let foundText = false
    for (let pageNumber = 1; pageNumber <= documentProxy.value.numPages; pageNumber++) {
      const page = await documentProxy.value.getPage(pageNumber)
      const content = await page.getTextContent()
      const items = content.items.flatMap((item) =>
        'str' in item && item.str.trim() ? [{ text: item.str }] : [],
      )
      if (items.some((item) => item.text.trim())) foundText = true
      pages.push({ page: pageNumber, items })
    }
    hasDocumentText.value = foundText
    if (!foundText) {
      infoMessage.value = 'Dieses PDF enthält keine Textebene. Suche und Markieren sind nicht verfügbar.'
      searchQuery.value = ''
      return
    }
    searchHits.value = findPdfMatches(pages, query)
    await renderCurrentPage()
    if (searchHits.value.length) {
      infoMessage.value = ''
      changePage(searchHits.value[0].page)
    } else {
      infoMessage.value = 'Keine Treffer gefunden.'
    }
  } catch (error) {
    showError(error, 'Die PDF-Suche ist fehlgeschlagen.')
  } finally {
    loading.value = false
  }
}

function moveHit(delta: number): void {
  if (searchHits.value.length === 0) return
  activeHit.value = (activeHit.value + delta + searchHits.value.length) % searchHits.value.length
  changePage(searchHits.value[activeHit.value].page)
}

function captureSelection(): void {
  const selection = window.getSelection()
  const quote = selection?.toString().trim() ?? ''
  if (quote && pageFrame.value?.contains(selection?.anchorNode ?? null)) {
    selectedQuote.value = quote
  } else {
    selectedQuote.value = ''
  }
}

function normalizedSelectionBoxes(): PdfMarkBox[] {
  const selection = window.getSelection()
  const frame = pageFrame.value
  if (!selection || selection.rangeCount === 0 || !frame) return []
  const bounds = frame.getBoundingClientRect()
  return Array.from(selection.getRangeAt(0).getClientRects()).map((rect) => ({
    left: Math.max(0, (rect.left - bounds.left) / bounds.width),
    top: Math.max(0, (rect.top - bounds.top) / bounds.height),
    width: Math.min(1, rect.width / bounds.width),
    height: Math.min(1, rect.height / bounds.height),
  }))
}

async function saveMark(): Promise<void> {
  if (!activeRecord.value || !selectedQuote.value) return
  const boxes = normalizedSelectionBoxes()
  if (!boxes.length) return
  const mark: PdfMark = {
    id: createCardId(),
    page: currentPage.value,
    quote: selectedQuote.value,
    color: annotationColor.value,
    boxes,
  }
  const next = { ...activeRecord.value, marks: [...activeRecord.value.marks, mark] }
  try {
    const persisted = await savePdfRecord(next)
    activeRecord.value = next
    selectedQuote.value = ''
    window.getSelection()?.removeAllRanges()
    infoMessage.value = persisted ? 'Markierung gespeichert.' : 'Markierung gespeichert; dauerhafter Speicher wurde nicht zugesagt.'
  } catch (error) {
    showError(error, 'Die Markierung konnte nicht gespeichert werden.')
  }
}

async function deleteMark(markId: string): Promise<void> {
  if (!activeRecord.value) return
  const next = {
    ...activeRecord.value,
    marks: activeRecord.value.marks.filter((mark) => mark.id !== markId),
  }
  try {
    await savePdfRecord(next)
    activeRecord.value = next
  } catch (error) {
    showError(error, 'Die Markierung konnte nicht gelöscht werden.')
  }
}

function startCardFromQuote(quote: string): void {
  selectedQuote.value = quote
  cardBack.value = ''
  showCardForm.value = true
  if (cardData.value?.decks[0]) cardDeckId.value = cardData.value.decks[0].id
}

async function addCardFromQuote(): Promise<void> {
  if (!cardData.value || !selectedQuote.value || !cardDeckId.value) return
  const next = structuredClone(cardData.value)
  const deck = next.decks.find(({ id }) => id === cardDeckId.value)
  if (!deck) {
    errorMessage.value = 'Der ausgewählte Kartenstapel ist nicht mehr vorhanden.'
    return
  }
  if (deck.cards.some((card) => card.front.trim().toLocaleLowerCase('de') === selectedQuote.value.trim().toLocaleLowerCase('de'))) {
    errorMessage.value = 'Diese Vorderseite gibt es in diesem Stapel bereits.'
    return
  }
  deck.cards.push({
    id: createCardId(),
    front: selectedQuote.value,
    back: cardBack.value.trim(),
    correct: 0,
    incorrect: 0,
  })
  try {
    const persisted = await saveCardData(next)
    cardData.value = next
    showCardForm.value = false
    selectedQuote.value = ''
    infoMessage.value = persisted ? 'Karte angelegt.' : 'Karte angelegt; dauerhafter Speicher wurde nicht zugesagt.'
  } catch (error) {
    showError(error, 'Die Karte konnte nicht gespeichert werden.')
  }
}

function isActiveHit(itemIndex: number, start: number, end: number): boolean {
  const hit = searchHits.value[activeHit.value]
  return Boolean(hit && hit.page === currentPage.value && hit.itemIndex === itemIndex &&
    start < hit.end && end > hit.start)
}

onMounted(async () => {
  await loadLibrary()
  try {
    cardData.value = loadCardData()
    cardDeckId.value = cardData.value.decks[0]?.id ?? ''
  } catch (error) {
    storageError.value = error instanceof Error ? error.message : 'Kartendaten konnten nicht geladen werden.'
  }
  selectionHandler = captureSelection
  document.addEventListener('selectionchange', selectionHandler)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (selectionHandler) document.removeEventListener('selectionchange', selectionHandler)
  window.removeEventListener('resize', handleResize)
  closeDocument()
})
</script>

<template>
  <section class="pdf-page">
    <header class="page-heading">
      <p class="eyebrow">Lernkarten</p>
      <h1>PDF lesen</h1>
    </header>

    <p v-if="errorMessage" class="notice notice--error" role="alert">{{ errorMessage }}</p>
    <p v-else-if="storageError" class="notice notice--error" role="alert">{{ storageError }}</p>
    <p v-else-if="infoMessage" class="notice" role="status">{{ infoMessage }}</p>

    <section v-if="!activeRecord" class="library">
      <BaseCard class="library-card">
        <h2>PDF von diesem Gerät öffnen</h2>
        <p>Die Datei bleibt auf diesem Gerät gespeichert.</p>
        <input
          ref="fileInput"
          class="sr-only"
          type="file"
          accept="application/pdf,.pdf"
          @change="addPdfFile"
        />
        <BaseButton variant="primary" @click="fileInput?.click()">
          <InlineIcon name="upload" /> Datei wählen
        </BaseButton>
      </BaseCard>

      <section v-if="localPdfs.length" class="library-section">
        <h2>Auf diesem Gerät</h2>
        <ul class="pdf-list">
          <li v-for="pdf in localPdfs" :key="pdf.id">
            <BaseCard class="pdf-row">
              <button class="pdf-open" type="button" @click="openPdf(pdf)">
                <InlineIcon name="pdf" />
                <span><strong>{{ pdf.name }}</strong><small>Zuletzt Seite {{ pdf.lastPage }}</small></span>
              </button>
              <BaseButton icon-only aria-label="PDF entfernen" @click="removePdf(pdf)">
                <InlineIcon name="trash" />
              </BaseButton>
            </BaseCard>
          </li>
        </ul>
      </section>

      <section v-if="publicPdfs.some((pdf) => !localPdfs.some((record) => record.id === pdf.id))" class="library-section">
        <h2>PDFs im Ordner</h2>
        <ul class="pdf-list">
          <li v-for="pdf in publicPdfs.filter((item) => !localPdfs.some((record) => record.id === item.id))" :key="pdf.id">
            <BaseCard class="pdf-row">
              <button class="pdf-open" type="button" @click="openPdf(pdf)">
                <InlineIcon name="pdf" />
                <span><strong>{{ pdf.name }}</strong><small>Aus dem Ordner pdfs/</small></span>
              </button>
            </BaseCard>
          </li>
        </ul>
      </section>
      <p v-if="!localPdfs.length && !publicPdfs.length" class="empty">
        Noch keine PDFs gespeichert. Wähle eine Datei oder lege sie in den Ordner <code>pdfs/</code>.
      </p>
    </section>

    <section v-else class="reader">
      <div class="reader-toolbar">
        <BaseButton @click="closeDocument">Zur PDF-Liste</BaseButton>
        <h2 class="document-name">{{ activeRecord.name }}</h2>
      </div>

      <div class="page-controls">
        <BaseButton aria-label="Vorherige Seite" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
          <InlineIcon name="arrow-left" />
        </BaseButton>
        <span>Seite {{ currentPage }} von {{ totalPages }}</span>
        <BaseButton aria-label="Nächste Seite" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
          <InlineIcon name="arrow-right" />
        </BaseButton>
        <label class="sr-only" for="page-number">Seite auswählen</label>
        <BaseInput
          id="page-number"
          class="page-number"
          type="number"
          inputmode="numeric"
          :min="1"
          :max="totalPages"
          :model-value="currentPage"
          aria-label="Seite auswählen"
          @update:model-value="changePage(Number($event))"
        />
      </div>

      <BaseCard class="reader-card">
        <div ref="pageFrame" class="page-frame" :style="{ aspectRatio: pageSize.width ? `${pageSize.width} / ${pageSize.height}` : '0.72' }">
          <canvas ref="canvas" class="pdf-canvas" aria-label="PDF-Seite" />
          <div
            class="mark-layer"
            :style="{ width: `${pageSize.width}px`, height: `${pageSize.height}px` }"
            aria-hidden="true"
          >
            <template v-for="mark in pageMarks" :key="mark.id">
              <span
                v-for="(box, index) in mark.boxes"
                :key="`${mark.id}-${index}`"
                class="mark-box"
                :class="`mark-box--${mark.color}`"
                :style="{
                  left: `${box.left * 100}%`,
                  top: `${box.top * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                }"
              />
            </template>
          </div>
          <div
            class="text-layer"
            :style="{ width: `${pageSize.width}px`, height: `${pageSize.height}px` }"
            @mouseup="captureSelection"
            @touchend="captureSelection"
          >
            <span
              v-for="(item, itemIndex) in pageItems"
              :key="itemIndex"
              class="text-item"
              :style="{
                left: `${item.left}px`,
                top: `${item.top}px`,
                width: `${item.width}px`,
                height: `${item.height}px`,
                fontSize: `${item.height}px`,
              }"
            ><template v-for="(part, partIndex) in item.parts" :key="partIndex"><mark
                v-if="part.hit"
                :class="{ 'is-current-hit': isActiveHit(itemIndex, item.parts.slice(0, partIndex).reduce((sum, p) => sum + p.text.length, 0), item.parts.slice(0, partIndex + 1).reduce((sum, p) => sum + p.text.length, 0)) }"
                class="search-highlight"
              >{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
          </div>
          <span v-if="pageLoading" class="page-loading" role="status">Seite wird geladen …</span>
        </div>
      </BaseCard>

      <p v-if="!hasDocumentText && documentProxy" class="notice">
        Dieses PDF enthält keine Textebene. Suche und Markieren sind nicht verfügbar.
      </p>
      <p v-else-if="hasDocumentText && documentProxy && !pageHasText && !pageLoading" class="notice">
        Diese Seite enthält keine auswählbare Textebene.
      </p>

      <section class="reader-tools">
        <BaseCard class="tool-card">
          <h2>Im PDF suchen</h2>
          <form class="search-form" @submit.prevent="runSearch">
            <FormField label="Suchwort" for-id="pdf-search">
              <BaseInput
                id="pdf-search"
                v-model="queryInput"
                type="search"
                :disabled="!canSearch"
                placeholder="Wort eingeben"
              />
            </FormField>
            <BaseButton type="submit" :disabled="!canSearch || !queryInput.trim()">Suchen</BaseButton>
          </form>
          <div class="search-results">
            <span>{{ searchCounter }}</span>
            <div class="search-navigation">
              <BaseButton aria-label="Vorheriger Treffer" :disabled="!searchHits.length" @click="moveHit(-1)">
                Zurück
              </BaseButton>
              <BaseButton aria-label="Nächster Treffer" :disabled="!searchHits.length" @click="moveHit(1)">
                Vor
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="tool-card">
          <h2>Text markieren</h2>
          <p v-if="hasSelection" class="selection-quote">„{{ selectedQuote }}“</p>
          <p v-else class="hint">Wähle Text auf der Seite aus, um ihn zu markieren.</p>
          <ButtonGroup aria-label="Markierungsfarbe">
            <BaseButton
              v-for="color in (['yellow', 'green', 'pink'] as const)"
              :key="color"
              :active="annotationColor === color"
              :class="`color-choice color-choice--${color}`"
              :aria-label="`Farbe ${color === 'yellow' ? 'Gelb' : color === 'green' ? 'Grün' : 'Rosa'}`"
              :disabled="!canMark"
              @click="annotationColor = color"
            >
              {{ color === 'yellow' ? 'Gelb' : color === 'green' ? 'Grün' : 'Rosa' }}
            </BaseButton>
          </ButtonGroup>
          <div class="tool-actions">
            <BaseButton variant="primary" :disabled="!hasSelection || !canMark" @click="saveMark">
              Markieren
            </BaseButton>
            <BaseButton :disabled="!hasSelection" @click="startCardFromQuote(selectedQuote)">
              Wort zur Karte
            </BaseButton>
          </div>
        </BaseCard>
      </section>

      <BaseCard v-if="showCardForm && cardData" class="card-from-pdf">
        <h2>Karte anlegen</h2>
        <FormField label="Vorderseite" for-id="card-front">
          <BaseInput id="card-front" :model-value="selectedQuote" readonly />
        </FormField>
        <FormField label="Rückseite" for-id="card-back">
          <BaseInput id="card-back" v-model="cardBack" />
        </FormField>
        <label class="field-label" for="card-deck">Stapel</label>
        <select id="card-deck" v-model="cardDeckId" class="select-input">
          <option v-for="deck in cardData?.decks ?? []" :key="deck.id" :value="deck.id">{{ deck.name }}</option>
        </select>
        <div class="tool-actions">
          <BaseButton variant="primary" :disabled="!cardDeckId" @click="addCardFromQuote">Karte speichern</BaseButton>
          <BaseButton @click="showCardForm = false">Abbrechen</BaseButton>
        </div>
      </BaseCard>

      <section class="marks-section">
        <h2>Markierungen ({{ activeRecord.marks.length }})</h2>
        <p v-if="activeRecord.marks.length === 0" class="empty">Noch keine Markierungen in diesem PDF.</p>
        <ul v-else class="mark-list">
          <li v-for="mark in activeRecord.marks" :key="mark.id">
            <BaseCard class="mark-row">
              <button class="mark-jump" type="button" @click="changePage(mark.page)">
                <span class="mark-swatch" :class="`mark-swatch--${mark.color}`" />
                <span><strong>Seite {{ mark.page }}</strong><small>{{ mark.quote }}</small></span>
              </button>
              <div class="mark-actions">
                <BaseButton @click="startCardFromQuote(mark.quote)">Wort zur Karte</BaseButton>
                <BaseButton icon-only aria-label="Markierung löschen" @click="deleteMark(mark.id)">
                  <InlineIcon name="trash" />
                </BaseButton>
              </div>
            </BaseCard>
          </li>
        </ul>
      </section>
    </section>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.pdf-page {
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

.library,
.library-section,
.reader,
.reader-tools,
.tool-card,
.card-from-pdf,
.marks-section {
  display: grid;
  gap: $space-3;
}

.library-section {
  margin-top: $space-4;
}

.library-card,
.tool-card,
.card-from-pdf {
  padding: $space-4;
}

.library-card h2,
.library-section h2,
.tool-card h2,
.card-from-pdf h2,
.marks-section h2 {
  margin: 0;
  font-size: $font-size-lg;
}

.library-card p {
  margin: 0;
  color: var(--muted);
}

.pdf-list,
.mark-list {
  display: grid;
  gap: $space-2;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pdf-row,
.mark-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3;
}

.pdf-open,
.mark-jump {
  @include button-reset;
  display: flex;
  min-width: 0;
  min-height: $target-size;
  flex: 1;
  align-items: center;
  gap: $space-3;
  text-align: left;
}

.pdf-open span,
.mark-jump span:last-child {
  display: grid;
  min-width: 0;
  gap: $space-1;
}

.pdf-open strong,
.mark-jump strong,
.mark-jump small {
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdf-open small,
.mark-jump small {
  color: var(--muted);
}

.pdf-open:focus-visible,
.mark-jump:focus-visible {
  @include focus-ring;
}

.reader-toolbar,
.page-controls,
.search-results,
.tool-actions,
.mark-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.document-name {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: $font-size-lg;
}

.page-controls {
  justify-content: center;
  margin-block: $space-2;
}

.page-number {
  width: 5rem;
}

.reader-card {
  overflow: hidden;
  padding: $space-2;
  background: var(--peer);
}

.page-frame {
  position: relative;
  width: 100%;
  min-width: 12rem;
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
  background: var(--paper);
  box-shadow: $shadow-card;
}

.pdf-canvas {
  display: block;
  max-width: 100%;
}

.mark-layer,
.text-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.mark-layer {
  pointer-events: none;
}

.mark-box {
  position: absolute;
  opacity: 0.4;
  mix-blend-mode: multiply;
}

.mark-box--yellow {
  background: var(--mark-yellow);
}

.mark-box--green {
  background: var(--mark-green);
}

.mark-box--pink {
  background: var(--mark-pink);
}

.text-layer {
  overflow: hidden;
  color: transparent;
  user-select: text;
}

.text-item {
  position: absolute;
  display: block;
  overflow: visible;
  line-height: 1;
  white-space: pre;
  transform-origin: left bottom;
  color: transparent;
  cursor: text;
}

.search-highlight {
  color: transparent;
  background: var(--search-highlight);
}

.search-highlight.is-current-hit {
  background: var(--search-highlight-active);
}

.page-loading {
  position: absolute;
  top: $space-3;
  left: $space-3;
  border-radius: $radius-sm;
  padding: $space-1 $space-2;
  background: var(--paper);
}

.reader-tools {
  margin-top: $space-3;
}

.search-form {
  display: grid;
  gap: $space-2;
}

.search-navigation {
  display: flex;
  gap: $space-2;
}

.selection-quote,
.hint,
.empty {
  margin: 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.color-choice--yellow {
  background: color-mix(in srgb, var(--mark-yellow) 35%, var(--paper));
}

.color-choice--green {
  background: color-mix(in srgb, var(--mark-green) 35%, var(--paper));
}

.color-choice--pink {
  background: color-mix(in srgb, var(--mark-pink) 35%, var(--paper));
}

.field-label {
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

.mark-swatch {
  width: $space-4;
  height: $space-4;
  flex: 0 0 auto;
  border-radius: 50%;
}

.mark-swatch--yellow {
  background: var(--mark-yellow);
}

.mark-swatch--green {
  background: var(--mark-green);
}

.mark-swatch--pink {
  background: var(--mark-pink);
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
  .reader-tools {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .page-frame {
    max-width: 48rem;
  }
}
</style>
