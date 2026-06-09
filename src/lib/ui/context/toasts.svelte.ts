import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

/**
 * A toast notification — from-scratch port of tldraw's `TLUiToast`. Raised by
 * actions/UI to surface a transient message; auto-dismisses unless `keepOpen`.
 *
 * @public
 */
export interface Toast {
	id: string;
	title: string;
	description?: string;
	severity?: 'info' | 'success' | 'warning' | 'error';
	/** ms before auto-dismiss; 0/undefined → use the default; -1 → keep open. */
	duration?: number;
}

/**
 * From-scratch reactive toast store (replaces tldraw's ToastsProvider, which wrapped
 * a Radix toast). Holds the live toast list in a rune so `Toasts.svelte` re-renders,
 * and auto-dismisses each after its duration. No third-party toast library.
 */
export class ToastStore {
	#toasts = $state<Toast[]>([]);
	#seq = 0;
	#timers = new SvelteMap<string, ReturnType<typeof setTimeout>>();

	/** The current toasts (reactive). */
	get toasts(): Toast[] {
		return this.#toasts;
	}

	/** Add a toast; returns its id. Auto-dismisses unless duration is -1. */
	add(toast: Omit<Toast, 'id'> & { id?: string }): string {
		const id = toast.id ?? `toast-${this.#seq++}`;
		// Replace any existing toast with the same id (idempotent re-raise).
		this.#toasts = [...this.#toasts.filter((t) => t.id !== id), { ...toast, id }];
		const duration = toast.duration ?? 4000;
		if (duration >= 0) {
			this.#clearTimer(id);
			this.#timers.set(
				id,
				setTimeout(() => this.remove(id), duration)
			);
		}
		return id;
	}

	/** Remove a toast by id. */
	remove(id: string): void {
		this.#clearTimer(id);
		this.#toasts = this.#toasts.filter((t) => t.id !== id);
	}

	/** Dismiss everything (used on teardown). */
	clear(): void {
		for (const id of this.#timers.keys()) this.#clearTimer(id);
		this.#toasts = [];
	}

	#clearTimer(id: string) {
		const t = this.#timers.get(id);
		if (t) {
			clearTimeout(t);
			this.#timers.delete(id);
		}
	}
}

/** Context holding the toast store. Set by the UI root, read by actions + Toasts. */
export const [getToasts, setToasts] = createContext<ToastStore>();
