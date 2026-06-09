import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// better-sqlite3 wants a filesystem path, not a `file:` URL.
const path = env.DATABASE_URL.replace(/^file:/, '');
const client = new Database(path);

export const db = drizzle(client, { schema });
