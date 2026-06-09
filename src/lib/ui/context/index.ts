// UI context barrel — re-exports the from-scratch UI contexts + registry builders.
export { getEditor } from '$lib/state-svelte';
export {
	getActions,
	setActions,
	createDefaultActions,
	type ActionItem,
	type ActionsRegistry
} from './actions.svelte';
export {
	getTools,
	setTools,
	createDefaultTools,
	TOOLBAR_ORDER,
	type ToolItem,
	type ToolsRegistry
} from './tools.svelte';
export { getToasts, setToasts, ToastStore, type Toast } from './toasts.svelte';
export { getA11y, setA11y, A11yAnnouncer, type A11yPriority } from './a11y.svelte';
export {
	getBreakpointState,
	setBreakpoint,
	BreakpointState,
	BREAKPOINT,
	getBreakpoint
} from './breakpoint.svelte';
