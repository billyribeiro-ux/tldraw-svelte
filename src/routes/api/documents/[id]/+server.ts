import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

// Persistence for a whiteboard document, backed by SvelteKit's own server + SQLite
// (no external backend). The body is the serialized tldraw store snapshot.

/** Load a document's snapshot. 404 if it doesn't exist yet. */
export const GET: RequestHandler = async ({ params }) => {
	const row = db.select().from(documents).where(eq(documents.id, params.id)).get();
	if (!row) throw error(404, 'Document not found');
	return json({ id: row.id, name: row.name, snapshot: row.snapshot, updatedAt: row.updatedAt });
};

/** Create or replace a document's snapshot (upsert). */
export const PUT: RequestHandler = async ({ params, request }) => {
	const body = (await request.json()) as { name?: string; snapshot: unknown };
	if (body.snapshot == null) throw error(400, 'Missing snapshot');

	const now = new Date();
	db.insert(documents)
		.values({
			id: params.id,
			name: body.name ?? 'Untitled',
			snapshot: body.snapshot,
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: documents.id,
			set: { snapshot: body.snapshot, name: body.name ?? 'Untitled', updatedAt: now }
		})
		.run();

	return json({ ok: true });
};
