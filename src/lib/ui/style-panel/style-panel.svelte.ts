import type { Editor, StyleProp, SharedStyle, TLDefaultColorStyle } from '@tldraw/editor';
import { DefaultColorStyle, getColorValue } from '@tldraw/editor';
import { fromComputed } from '$lib/state-svelte/use-value.svelte';

/**
 * From-scratch port of tldraw's StylePanelContext. Wraps the editor's real style
 * API in reactive accessors so the Svelte style panel reads/writes the SAME
 * `StyleProp`s the converted shapes already declare — no shape rework. Setting a
 * style applies it to the selection (if any) and remembers it for the next shape,
 * exactly like tldraw's `handleValueChange`.
 */
export class StylePanelModel {
	#editor: Editor;

	/** The shared styles across the current selection (or the next-shape styles). */
	readonly styles = fromComputed('shared styles', () => this.#editor.getSharedStyles());
	/** Shared opacity across the selection. */
	readonly opacity = fromComputed('shared opacity', () => this.#editor.getSharedOpacity());
	/** The resolved theme palette for the current color mode (for swatches). */
	readonly colors = fromComputed('theme colors', () => {
		const theme = this.#editor.getCurrentTheme();
		return theme.colors[this.#editor.getColorMode()];
	});
	/** Whether anything is selected (panel is shown for selection or next-shape). */
	readonly hasShapes = fromComputed(
		'has selected shapes',
		() => this.#editor.getSelectedShapeIds().length > 0
	);

	constructor(editor: Editor) {
		this.#editor = editor;
	}

	/** Read the current value of a style prop, or undefined if mixed/absent. */
	getValue<T>(prop: StyleProp<T>): T | undefined {
		const shared = this.styles.current.get(prop) as SharedStyle<T> | undefined;
		if (!shared || shared.type === 'mixed') return undefined;
		return shared.value;
	}

	/** Whether the selection has a mixed value for this prop. */
	isMixed<T>(prop: StyleProp<T>): boolean {
		return this.styles.current.get(prop)?.type === 'mixed';
	}

	/** Set a style: apply to selection + remember for the next shape (tldraw parity). */
	setStyle<T>(prop: StyleProp<T>, value: T): void {
		this.#editor.markHistoryStoppingPoint('style change');
		if (this.#editor.getSelectedShapeIds().length > 0) {
			this.#editor.setStyleForSelectedShapes(prop, value);
		}
		this.#editor.setStyleForNextShapes(prop, value);
		this.#editor.updateInstanceState({ isChangingStyle: true });
	}

	/** Resolve a color name to a CSS string for a swatch, via the real theme. */
	colorCss(color: TLDefaultColorStyle | string): string {
		return getColorValue(this.colors.current, color, 'solid');
	}

	/** The current shared opacity, or undefined if mixed. */
	getOpacity(): number | undefined {
		const o = this.opacity.current;
		return o.type === 'mixed' ? undefined : o.value;
	}

	/** Set opacity on selection + next shapes. */
	setOpacity(value: number): void {
		this.#editor.markHistoryStoppingPoint('opacity change');
		if (this.#editor.getSelectedShapeIds().length > 0) {
			this.#editor.setOpacityForSelectedShapes(value);
		}
		this.#editor.setOpacityForNextShapes(value);
	}
}

/** The color style prop, re-exported so the panel and its pickers share one import. */
export { DefaultColorStyle };
