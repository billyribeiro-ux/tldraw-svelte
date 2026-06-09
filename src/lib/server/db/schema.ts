import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * A persisted tldraw document. `snapshot` holds the serialized store snapshot
 * (the JSON produced by `editor.store.getStoreSnapshot()` / loaded via
 * `loadSnapshot`). One row per document.
 */
export const documents = sqliteTable('documents', {
	id: text('id').primaryKey(),
	name: text('name').notNull().default('Untitled'),
	snapshot: text('snapshot', { mode: 'json' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch() * 1000)`)
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
