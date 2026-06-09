import { react, EffectScheduler } from '@tldraw/state';

/**
 * Run a side-effecting function that reads tldraw signals, re-running it
 * synchronously whenever those signals change. This is the Svelte equivalent of
 * `@tldraw/state-react`'s `useQuickReactor` — used for imperative DOM mutations
 * (e.g. writing `transform`/`width` onto a shape's container element) that must
 * apply immediately, not batched through Svelte's microtask effect queue.
 *
 * Intended to be called inside a Svelte `$effect` or an `{@attach}` attachment,
 * which both provide a teardown hook. It returns a disposer; call it from the
 * effect/attachment cleanup to stop the reaction.
 *
 * ```svelte
 * <div {@attach (node) => quickReactor('position', () => {
 *   node.style.transform = Mat.toCssString(editor.getShapePageTransform(id));
 * })}></div>
 * ```
 */
export function quickReactor(name: string, fn: () => void): () => void {
	const scheduler = new EffectScheduler(name, fn);
	scheduler.attach();
	scheduler.execute();
	return () => scheduler.detach();
}

/**
 * Like {@link quickReactor} but throttled to one run per animation frame, matching
 * `useReactor`. Use for reactions whose work is expensive and need not be exactly
 * synchronous (e.g. recomputing a large rendering list).
 */
export function rafReactor(name: string, fn: () => void): () => void {
	let raf = 0;
	const scheduler = new EffectScheduler(name, () => {
		if (raf) return;
		raf = requestAnimationFrame(() => {
			raf = 0;
			fn();
		});
	});
	scheduler.attach();
	scheduler.execute();
	return () => {
		if (raf) cancelAnimationFrame(raf);
		scheduler.detach();
	};
}

/**
 * Thin re-export of tldraw's low-level `react` for cases where neither reactor
 * helper fits (returns its own disposer).
 */
export { react };
