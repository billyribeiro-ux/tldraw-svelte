import { createSubscriber } from 'svelte/reactivity';
import { computed, react, type Signal } from '@tldraw/state';

/**
 * A reactive wrapper around a tldraw `@tldraw/state` signal, exposing its value
 * via a `.current` getter that participates in Svelte 5 reactivity.
 *
 * This is the Svelte equivalent of `@tldraw/state-react`'s `useValue`. It mirrors
 * that hook's mechanism: a tldraw `react()` effect tracks the signal's `.get()`
 * and, on change, calls Svelte's `update` (from `createSubscriber`) to invalidate
 * any `$derived`/`$effect`/template that read `.current`. `createSubscriber` only
 * starts the `react()` subscription while `.current` is read inside a tracking
 * context, and tears it down when no longer observed — so there are no leaks and
 * no work when the value isn't on screen.
 *
 * @see https://svelte.dev/docs/svelte/svelte-reactivity#createSubscriber
 */
export class ReactiveSignal<Value> {
	#signal: Signal<Value>;
	#subscribe: () => void;

	constructor(signal: Signal<Value>, name: string) {
		this.#signal = signal;
		this.#subscribe = createSubscriber((update) => {
			// `react` runs immediately, tracking the signal's dependencies, and
			// re-runs (calling `update`) whenever they change. The returned
			// disposer stops the subscription when no effect observes `.current`.
			return react(`ReactiveSignal(${name})`, () => {
				// Establish the dependency. Errors are swallowed here and will
				// surface when the value is next read in a render context.
				try {
					this.#signal.get();
				} catch {
					// ignore — rethrown on read if still mounted
				}
				update();
			});
		});
	}

	/** The current value. Read inside a `$derived`/`$effect`/template to stay reactive. */
	get current(): Value {
		this.#subscribe();
		// Read without capturing into tldraw's tracking — Svelte drives reactivity.
		return this.#signal.__unsafe__getWithoutCapture();
	}
}

/**
 * Wrap an existing signal so its value is reactive in Svelte.
 *
 * ```ts
 * const camera = fromSignal(editor.getCameraSignal(), 'camera');
 * // in markup: {camera.current.x}
 * ```
 */
export function fromSignal<Value>(signal: Signal<Value>, name = 'signal'): ReactiveSignal<Value> {
	return new ReactiveSignal(signal, name);
}

/**
 * Create a derived reactive value from a function that reads tldraw signals
 * (e.g. `editor.getCurrentPageShapes()`), equivalent to the
 * `useValue(name, fn, deps)` form. The `fn` is wrapped in a tldraw `computed`,
 * so it recomputes only when the signals it reads change.
 *
 * ```ts
 * const shapes = fromComputed('rendering shapes', () => editor.getRenderingShapes());
 * // in markup: {#each shapes.current as s (s.id)} ...
 * ```
 */
export function fromComputed<Value>(name: string, fn: () => Value): ReactiveSignal<Value> {
	return new ReactiveSignal(computed(name, fn), name);
}
