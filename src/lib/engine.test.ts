import { describe, it, expect } from 'vitest';
import { atom, computed, react, transact } from '@tldraw/state';

// Phase 0 (node): the framework-free signals engine works headlessly. The real
// GeoShapeUtil / Editor test needs a DOM and lives in engine.svelte.test.ts
// (browser project), since the Editor's TextManager requires document.

describe('@tldraw/state signals', () => {
	it('atom + computed recompute and effects fire on change', () => {
		const count = atom('count', 1);
		const doubled = computed('doubled', () => count.get() * 2);
		const seen: number[] = [];
		const stop = react('track', () => seen.push(doubled.get()));
		count.set(5);
		transact(() => {
			count.set(10);
			count.set(20);
		});
		stop();
		expect(seen).toEqual([2, 10, 40]);
	});
});
