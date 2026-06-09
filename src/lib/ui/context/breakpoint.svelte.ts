import { createContext } from 'svelte';

/**
 * tldraw's portrait breakpoints (from ui/constants.ts). The active breakpoint is
 * the index `i` such that PORTRAIT_BREAKPOINTS[i] < width <= PORTRAIT_BREAKPOINTS[i+1].
 *
 * @public
 */
export const PORTRAIT_BREAKPOINTS = [0, 389, 436, 476, 580, 640, 840, 1023];

/** Named breakpoint indices, matching tldraw's PORTRAIT_BREAKPOINT enum. @public */
export const BREAKPOINT = {
	ZERO: 0,
	MOBILE_XXS: 1,
	MOBILE_XS: 2,
	MOBILE_SM: 3,
	MOBILE: 4,
	TABLET_SM: 5,
	TABLET: 6,
	DESKTOP: 7
} as const;

/** Compute the breakpoint index for a container width (tldraw's algorithm). */
export function getBreakpoint(width: number): number {
	for (let i = PORTRAIT_BREAKPOINTS.length - 1; i >= 0; i--) {
		if (width >= PORTRAIT_BREAKPOINTS[i]) return i;
	}
	return 0;
}

/**
 * Reactive breakpoint holder, fed by the container's ResizeObserver in the UI root.
 * Components read `.value` to branch responsively, exactly like tldraw's
 * `useBreakpoint()`.
 */
export class BreakpointState {
	value = $state<number>(BREAKPOINT.DESKTOP);
}

export const [getBreakpoint_, setBreakpoint] = createContext<BreakpointState>();
/** Read the reactive breakpoint holder. @public */
export const getBreakpointState = getBreakpoint_;
