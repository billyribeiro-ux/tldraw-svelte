import { createContext } from 'svelte';

/** ARIA live-region politeness, mirroring tldraw's `A11yPriority`. @public */
export type A11yPriority = 'polite' | 'assertive';

/**
 * From-scratch reactive accessibility announcer (port of tldraw's A11yProvider,
 * minus React). Holds the current live-region message in a rune; `A11y.svelte`
 * renders it into a visually-hidden `aria-live` region so screen readers announce
 * UI changes (tool switches, action results) that aren't otherwise focusable.
 */
export class A11yAnnouncer {
	#msg = $state('');
	#priority = $state<A11yPriority>('assertive');
	#seq = 0;

	/** The current message (reactive). */
	get message(): string {
		return this.#msg;
	}
	/** The current politeness (reactive). */
	get priority(): A11yPriority {
		return this.#priority;
	}

	/**
	 * Announce a message. We append a zero-width sequence marker so re-announcing
	 * the SAME text still triggers the live region (text-equality would otherwise
	 * be a no-op for assistive tech).
	 */
	announce(msg: string, priority: A11yPriority = 'assertive'): void {
		this.#priority = priority;
		this.#msg = msg ? `${msg}${'​'.repeat(this.#seq++ % 2)}` : '';
	}
}

/** Context holding the announcer. Set by the UI root, read by UI + A11y.svelte. */
export const [getA11y, setA11y] = createContext<A11yAnnouncer>();
