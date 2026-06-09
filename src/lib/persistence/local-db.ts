import { openDB, type IDBPDatabase } from 'idb';
import type { Editor } from '@tldraw/editor';

// Browser-only document persistence (IndexedDB). Replaces the SQLite server route so
// the app needs NO backend and deploys to Vercel as a static-ish SvelteKit app.
// Each document is a tldraw store snapshot keyed by `persistenceKey` (the ?doc= id).
// Save is debounced; load restores on mount. This mirrors how tldraw.com persists an
// anonymous local document.

const DB_NAME = 'tldraw-svelte';
const STORE = 'documents';
const SAVE_DEBOUNCE_MS = 600;

let dbPromise: Promise<IDBPDatabase> | undefined;

function getDb(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
			}
		});
	}
	return dbPromise;
}

/**
 * Wire IndexedDB persistence to an editor for a given document key. Loads any saved
 * snapshot, then debounce-saves the store on every document change. Returns a
 * disposer that flushes a final save and stops listening.
 */
export function setupLocalPersistence(editor: Editor, key: string): () => void {
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;

	async function save() {
		try {
			const snapshot = editor.store.getStoreSnapshot();
			const db = await getDb();
			await db.put(STORE, snapshot, key);
		} catch (err) {
			console.error('[persistence] save failed', err);
		}
	}

	// Register the change listener synchronously so no early edits are missed while
	// the async load is in flight.
	const stopListening = editor.store.listen(
		() => {
			clearTimeout(saveTimer);
			saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS);
		},
		{ scope: 'document' }
	);

	// Load any previously-saved snapshot for this key.
	getDb()
		.then((db) => db.get(STORE, key))
		.then((snapshot) => {
			if (snapshot && !disposed) editor.store.loadStoreSnapshot(snapshot);
		})
		.catch((err) => console.error('[persistence] load failed', err));

	return () => {
		disposed = true;
		clearTimeout(saveTimer);
		stopListening();
		// Best-effort final flush so the latest edits aren't lost on unmount.
		void save();
	};
}
