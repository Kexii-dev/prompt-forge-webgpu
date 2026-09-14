// Persistance locale (IndexedDB) : bibliothèque de prompts + historique des runs.
// Tout reste dans le navigateur — rien n'est envoyé au serveur.

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Run {
  id: string;
  promptId: string | null; // null si prompt non enregistré
  promptText: string;
  modelId: string;
  modelName: string;
  output: string;
  temperature: number;
  maxTokens: number;
  tokPerSec: number | null;
  seconds: number | null;
  tokens: number | null;
  createdAt: number;
  kind: 'studio' | 'compare';
  groupId: string | null; // lie les 2 runs d'une comparaison A/B
}

const DB_NAME = 'prompt-machine';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('prompts')) {
        const store = db.createObjectStore('prompts', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('runs')) {
        const store = db.createObjectStore('runs', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('promptId', 'promptId');
        store.createIndex('modelId', 'modelId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: 'prompts' | 'runs', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => {
          resolve(req.result);
          db.close();
        };
        t.onerror = () => reject(t.error);
      }),
  );
}

export function uid(): string {
  return crypto.randomUUID();
}

// ---- Prompts ----

export function savePrompt(p: Omit<SavedPrompt, 'createdAt' | 'updatedAt'> & { createdAt?: number }): Promise<IDBValidKey> {
  const now = Date.now();
  const record: SavedPrompt = {
    ...p,
    createdAt: p.createdAt ?? now,
    updatedAt: now,
  };
  return tx('prompts', 'readwrite', (s) => s.put(record));
}

export function deletePrompt(id: string): Promise<undefined> {
  return tx('prompts', 'readwrite', (s) => s.delete(id));
}

export function listPrompts(): Promise<SavedPrompt[]> {
  return tx('prompts', 'readonly', (s) => s.getAll()).then((rows) =>
    (rows as SavedPrompt[]).sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

// ---- Runs ----

export function saveRun(r: Omit<Run, 'createdAt'>): Promise<IDBValidKey> {
  return tx('runs', 'readwrite', (s) => s.put({ ...r, createdAt: Date.now() }));
}

export function deleteRun(id: string): Promise<undefined> {
  return tx('runs', 'readwrite', (s) => s.delete(id));
}

export function clearRuns(): Promise<undefined> {
  return tx('runs', 'readwrite', (s) => s.clear());
}

export function listRuns(): Promise<Run[]> {
  return tx('runs', 'readonly', (s) => s.getAll()).then((rows) =>
    (rows as Run[]).sort((a, b) => b.createdAt - a.createdAt),
  );
}

export function listRunsByPrompt(promptId: string): Promise<Run[]> {
  return tx('runs', 'readonly', (s) => s.index('promptId').getAll(promptId)).then((rows) =>
    (rows as Run[]).sort((a, b) => b.createdAt - a.createdAt),
  );
}
