import { createContext } from 'svelte';

/**
 * Context that lets descendant menu items close the enclosing Popover after they
 * activate. Set by Popover.svelte; read by MenuItem.svelte. Optional — a MenuItem
 * used outside a Popover simply gets `undefined`.
 */
export const [getPopoverClose, setPopoverClose] = createContext<() => void>();
