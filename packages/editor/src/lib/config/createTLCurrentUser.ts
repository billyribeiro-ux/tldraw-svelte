import type { Signal} from '@tldraw/state';
import { computed } from '@tldraw/state'
import type { TLUserPreferences} from './TLUserPreferences';
import { getUserPreferences, setUserPreferences } from './TLUserPreferences'

/** @public */
export interface TLCurrentUser {
	readonly userPreferences: Signal<TLUserPreferences>
	// eslint-disable-next-line tldraw/method-signature-style
	readonly setUserPreferences: (userPreferences: TLUserPreferences) => void
}

const defaultLocalStorageUserPrefs = computed('defaultLocalStorageUserPrefs', () =>
	getUserPreferences()
)

/** @public */
export function createTLCurrentUser(
	opts = {} as {
		userPreferences?: Signal<TLUserPreferences>
		// eslint-disable-next-line tldraw/method-signature-style
		setUserPreferences?: (userPreferences: TLUserPreferences) => void
	}
): TLCurrentUser {
	return {
		userPreferences: opts.userPreferences ?? defaultLocalStorageUserPrefs,
		setUserPreferences: opts.setUserPreferences ?? setUserPreferences,
	}
}

// NOTE: the React `useTldrawCurrentUser` hook was removed in the Svelte port.
// The reactive user-preferences binding is re-implemented in the Svelte UI layer.
