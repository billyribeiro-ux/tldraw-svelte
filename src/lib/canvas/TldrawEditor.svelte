<script lang="ts">
	import { Editor, createTLStore, type TLStateNodeConstructor } from '@tldraw/editor';
	import { EditorHolder, setEditorContext } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import {
		GeoShapeUtil,
		GeoShapeTool,
		DrawShapeUtil,
		DrawShapeTool,
		LineShapeUtil,
		LineShapeTool,
		ArrowShapeUtil,
		ArrowShapeTool,
		ArrowBindingUtil,
		FrameShapeUtil,
		FrameShapeTool,
		HighlightShapeUtil,
		HighlightShapeTool,
		TextShapeUtil,
		TextShapeTool,
		NoteShapeUtil,
		NoteShapeTool,
		ImageShapeUtil,
		VideoShapeUtil,
		BookmarkShapeUtil,
		EmbedShapeUtil,
		SelectTool,
		HandTool,
		EraserTool,
		LaserTool,
		defaultAddFontsFromNode
	} from '@tldraw/tldraw';
	import Canvas from './Canvas.svelte';
	import '$lib/shapes/register'; // registers Svelte renderers for real shapes
	import './tldraw-fonts.css'; // @font-face for the real tldraw fonts (global, once)
	import { fontAssetUrls } from './font-urls';
	import { setupLocalPersistence } from '$lib/persistence/local-db';
	import type { Snippet } from 'svelte';

	let {
		children,
		oncreate,
		persistenceKey
	}: { children?: Snippet; oncreate?: (editor: Editor) => void; persistenceKey?: string } =
		$props();

	// Real tldraw shape utils + tools. Geo is converted (renderer registered);
	// the real SelectTool/HandTool/EraserTool give genuine select/move/resize/
	// rotate/brush/erase. More shapes + their tools land in Phases 1–2.
	const shapeUtils = [
		GeoShapeUtil,
		DrawShapeUtil,
		LineShapeUtil,
		ArrowShapeUtil,
		FrameShapeUtil,
		HighlightShapeUtil,
		TextShapeUtil,
		NoteShapeUtil,
		ImageShapeUtil,
		VideoShapeUtil,
		BookmarkShapeUtil,
		EmbedShapeUtil
	];
	const bindingUtils = [ArrowBindingUtil];
	const tools: TLStateNodeConstructor[] = [
		SelectTool,
		HandTool,
		EraserTool,
		GeoShapeTool,
		DrawShapeTool,
		LineShapeTool,
		ArrowShapeTool,
		FrameShapeTool,
		HighlightShapeTool,
		TextShapeTool,
		NoteShapeTool,
		LaserTool
	];

	// Build the store with the real shape + binding utils (arrow binding is now
	// converted, so its migrations resolve against the converted arrow shape).
	const store = createTLStore({ shapeUtils, bindingUtils });

	// Context must be set during init; the editor is filled in on mount (it needs
	// the container element for viewport bounds).
	const holder = new EditorHolder();
	setEditorContext(holder);

	// The theme class (tl-theme__light / tl-theme__dark) on the container drives all
	// the real --tl-* design tokens. `holder.editor` is Svelte `$state`, so this
	// $derived re-runs when the editor mounts; the per-editor `fromComputed` bridges
	// tldraw's color-mode signal into Svelte reactivity (so toggling dark mode at
	// runtime re-themes live). Default to light until the editor exists.
	const modeSignal = $derived(
		holder.editor ? fromComputed('color mode', () => holder.editor!.getColorMode()) : undefined
	);
	const colorMode = $derived(modeSignal?.current ?? 'light');

	function mountEditor(container: HTMLElement) {
		const ed = new Editor({
			store,
			shapeUtils,
			bindingUtils,
			tools,
			getContainer: () => container,
			initialState: 'select',
			// Rich text is built from scratch (no tiptap); the editor still needs
			// `text` set or getTextOptions() throws when a text/note shape resolves
			// its fonts. defaultAddFontsFromNode is our from-scratch font visitor.
			options: { text: { addFontsFromNode: defaultAddFontsFromNode } },
			// Real self-hosted tldraw fonts (Shantell Sans / IBM Plex), so SHAPE text
			// renders in the genuine faces — the FontManager resolves DefaultFontFaces
			// src.url keys through this map.
			fontAssetUrls
		});
		ed.updateViewportScreenBounds(container);
		holder.editor = ed;
		oncreate?.(ed);

		const ro = new ResizeObserver(() => ed.updateViewportScreenBounds(container));
		ro.observe(container);

		// Persistence: browser IndexedDB (no backend) — loads the saved snapshot and
		// debounce-saves on every change. Survives reloads and deploys to Vercel as a
		// static-ish app with no server (the SQLite server route was removed).
		const stopPersistence = persistenceKey ? setupLocalPersistence(ed, persistenceKey) : undefined;

		return () => {
			stopPersistence?.();
			ro.disconnect();
			ed.dispose();
			holder.editor = undefined;
		};
	}
</script>

<div class="tl-container tl-theme__{colorMode}" data-color-mode={colorMode} {@attach mountEditor}>
	{#if holder.editor}
		<Canvas />
		{@render children?.()}
	{/if}
</div>

<style>
	/* Real tldraw design tokens, ported 1:1 from @tldraw/editor's editor.css. These
	   --tl-* custom properties are the single source of truth for every UI color,
	   shadow, radius, spacing, z-index, and font; the from-scratch components consume
	   them via var(--tl-*). Scoped to .tl-container (the editor root this component
	   owns) so there is no global stylesheet blob. */
	.tl-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		touch-action: none;
		font-size: 12px;
		font-family: var(--tl-font-sans);
		font-weight: 500;
		-webkit-font-smoothing: antialiased;

		/* Spacing */
		--tl-space-1: 2px;
		--tl-space-2: 4px;
		--tl-space-3: 8px;
		--tl-space-4: 12px;
		--tl-space-5: 16px;
		--tl-space-6: 20px;
		--tl-space-7: 28px;
		--tl-space-8: 32px;
		--tl-space-9: 64px;
		--tl-space-10: 72px;

		/* Radius */
		--tl-radius-0: 2px;
		--tl-radius-1: 4px;
		--tl-radius-2: 6px;
		--tl-radius-3: 9px;
		--tl-radius-4: 11px;

		/* Z-index layers */
		--tl-layer-panels: 300;
		--tl-layer-menus: 400;
		--tl-layer-toasts: 650;
		--tl-layer-following-indicator: 1000;

		/* Fonts */
		--tl-font-draw: 'tldraw_draw', sans-serif;
		--tl-font-sans: 'tldraw_sans', sans-serif;
		--tl-font-serif: 'tldraw_serif', serif;
		--tl-font-mono: 'tldraw_mono', monospace;
	}

	/* Light theme (real values from editor.css .tl-theme__light) */
	.tl-container.tl-theme__light {
		--tl-color-background: hsl(210, 20%, 98%);
		--tl-color-grid: hsl(0, 0%, 43%);
		--tl-color-low: hsl(204, 16%, 94%);
		--tl-color-low-border: hsl(204, 16%, 92%);
		--tl-color-muted-1: hsl(0, 0%, 0%, 10%);
		--tl-color-muted-2: hsl(0, 0%, 0%, 4.3%);
		--tl-color-hint: hsl(0, 0%, 0%, 5.5%);
		--tl-color-overlay: hsl(0, 0%, 0%, 20%);
		--tl-color-divider: hsl(0, 0%, 91%);
		--tl-color-panel: hsl(0, 0%, 99%);
		--tl-color-panel-contrast: hsl(0, 0%, 100%);
		--tl-color-panel-overlay: hsl(0, 0%, 100%, 82%);
		--tl-color-selected: hsl(214, 84%, 56%);
		--tl-color-selected-contrast: hsl(0, 0%, 100%);
		--tl-color-focus: hsl(219, 65%, 50%);
		--tl-color-tooltip: hsla(200, 14%, 4%, 1);
		--tl-color-text: hsl(0, 0%, 0%);
		--tl-color-text-0: hsl(0, 0%, 11%);
		--tl-color-text-1: hsl(0, 0%, 18%);
		--tl-color-text-3: hsl(204, 4%, 45%);
		/* Aliases used by the from-scratch components, mapped to real tldraw tokens. */
		--tl-color-hover: var(--tl-color-muted-2);
		--tl-color-hover-strong: var(--tl-color-muted-1);
		--tl-color-text-secondary: var(--tl-color-text-3);
		--tl-color-primary: hsl(214, 84%, 56%);
		--tl-color-success: hsl(123, 46%, 34%);
		--tl-color-info: hsl(201, 98%, 41%);
		--tl-color-warning: hsl(27, 98%, 47%);
		--tl-color-danger: hsl(0, 90%, 43%);
		--tl-shadow-1: 0px 1px 2px hsl(0, 0%, 0%, 25%), 0px 1px 3px hsl(0, 0%, 0%, 9%);
		--tl-shadow-2:
			0px 0px 2px hsl(0, 0%, 0%, 16%), 0px 2px 3px hsl(0, 0%, 0%, 24%),
			0px 2px 6px hsl(0, 0%, 0%, 0.1), inset 0px 0px 0px 1px var(--tl-color-panel-contrast);
		--tl-shadow-3:
			0px 1px 2px hsl(0, 0%, 0%, 28%), 0px 2px 6px hsl(0, 0%, 0%, 14%),
			inset 0px 0px 0px 1px var(--tl-color-panel-contrast);
		--tl-canvas-bg: var(--tl-color-background);
	}

	/* Dark theme (real values from editor.css .tl-theme__dark) */
	.tl-container.tl-theme__dark {
		--tl-color-background: hsl(240, 5%, 6.5%);
		--tl-color-grid: hsl(0, 0%, 40%);
		--tl-color-low: hsl(260, 4.5%, 10.5%);
		--tl-color-low-border: hsl(207, 10%, 10%);
		--tl-color-muted-1: hsl(0, 0%, 100%, 10%);
		--tl-color-muted-2: hsl(0, 0%, 100%, 5%);
		--tl-color-hint: hsl(0, 0%, 100%, 7%);
		--tl-color-overlay: hsl(0, 0%, 0%, 50%);
		--tl-color-divider: hsl(240, 9%, 22%);
		--tl-color-panel: hsl(235, 6.8%, 13.5%);
		--tl-color-panel-contrast: hsl(245, 12%, 23%);
		--tl-color-panel-overlay: hsl(210, 10%, 24%, 82%);
		--tl-color-selected: hsl(217, 89%, 61%);
		--tl-color-selected-contrast: hsl(0, 0%, 100%);
		--tl-color-focus: hsl(217, 76%, 80%);
		--tl-color-tooltip: hsla(0, 0%, 100%, 1);
		--tl-color-text: hsl(210, 17%, 98%);
		--tl-color-text-0: hsl(0, 9%, 94%);
		--tl-color-text-1: hsl(0, 0%, 85%);
		--tl-color-text-3: hsl(204, 4%, 75%);
		/* Aliases used by the from-scratch components, mapped to real tldraw tokens. */
		--tl-color-hover: var(--tl-color-muted-2);
		--tl-color-hover-strong: var(--tl-color-muted-1);
		--tl-color-text-secondary: var(--tl-color-text-3);
		--tl-color-primary: hsl(214, 84%, 56%);
		--tl-color-success: hsl(123, 38%, 57%);
		--tl-color-info: hsl(199, 92%, 56%);
		--tl-color-warning: hsl(36, 100%, 57%);
		--tl-color-danger: hsl(0, 82%, 66%);
		--tl-shadow-1: 0px 1px 2px hsl(0, 0%, 0%, 25%), 0px 1px 3px hsl(0, 0%, 0%, 9%);
		--tl-shadow-2:
			0px 0px 2px hsl(0, 0%, 0%, 16%), 0px 2px 3px hsl(0, 0%, 0%, 24%),
			0px 2px 6px hsl(0, 0%, 0%, 0.1), inset 0px 0px 0px 1px var(--tl-color-panel-contrast);
		--tl-shadow-3:
			0px 1px 2px hsl(0, 0%, 0%, 28%), 0px 2px 6px hsl(0, 0%, 0%, 14%),
			inset 0px 0px 0px 1px var(--tl-color-panel-contrast);
		--tl-canvas-bg: var(--tl-color-background);
	}
</style>
