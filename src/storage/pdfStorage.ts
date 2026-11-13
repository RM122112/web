export type PdfMarkColor = 'yellow' | 'green' | 'pink'

export interface PdfMarkBox {
  left: number
  top: number
  width: number
  height: number
}

export interface PdfMark {
  id: string
  page: number
  quote: string
  color: PdfMarkColor
  boxes: PdfMarkBox[]
}

export interface PdfRecord {
  id: string
  name: string
  source: 'local' | 'public'
  url?: string
  blob?: Blob
  lastPage: number
  marks: PdfMark[]
}

const DATABASE = 'lernkarten-library'
const STORE = 'pdfs'
let databasePromise: Promise<IDBDatabase> | undefined
let persistenceRequested = false

export class PdfStorageError extends Error {
  constructor(message = 'Der Browserspeicher ist nicht verfügbar oder voll.') {
    super(message)
    this.name = 'PdfStorageError'
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new PdfStorageError())
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new PdfStorageError())
    request.onblocked = () => reject(new PdfStorageError('Der Browserspeicher ist durch einen anderen Tab blockiert.'))
  })
  return databasePromise
}

async function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  try {
    const database = await openDatabase()
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode)
      const operation = action(transaction.objectStore(STORE))
      let result: T
      operation.onsuccess = () => {
        result = operation.result
      }
      operation.onerror = () => reject(new PdfStorageError())
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(new PdfStorageError())
      transaction.onabort = () => reject(new PdfStorageError())
    })
  } catch (error) {
    if (error instanceof PdfStorageError) throw error
    throw new PdfStorageError()
  }
}

async function askForPersistence(): Promise<void> {
  if (persistenceRequested) return
  persistenceRequested = true
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Saving remains available even when the browser declines persistence.
  }
}

export async function listPdfRecords(): Promise<PdfRecord[]> {
  return request('readonly', (store) => store.getAll())
}

export async function getPdfRecord(id: string): Promise<PdfRecord | undefined> {
  return request('readonly', (store) => store.get(id))
}

export async function savePdfRecord(record: PdfRecord): Promise<boolean> {
  await askForPersistence()
  await request('readwrite', (store) => store.put(record))
  try {
    return (await navigator.storage?.persisted?.()) ?? false
  } catch {
    return false
  }
}

export async function deletePdfRecord(id: string): Promise<void> {
  await askForPersistence()
  await request('readwrite', (store) => store.delete(id))
}
