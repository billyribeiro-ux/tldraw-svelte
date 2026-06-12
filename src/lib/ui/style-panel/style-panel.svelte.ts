import type {
	Editor,
	StyleProp,
	SharedStyle,
	TLDefaultColorStyle,
	ReadonlySharedStyleMap
} from '@tldraw/editor';
import {
	DefaultColorStyle,
	DefaultDashStyle,
	DefaultFillStyle,
	DefaultSizeStyle,
	SharedStyleMap,
	getColorValue
} from '@tldraw/editor';
import { fromComputed } from '$lib/state-svelte/use-value.svelte';

// The style props the SELECT tool seeds from next-shape defaults when nothing is
// selected — matches tldraw's `selectToolStyles` in useRelevantStyles.ts.
const SELECT_TOOL_STYLES = [
	DefaultColorStyle,
	DefaultDashStyle,
	DefaultFillStyle,
	DefaultSizeStyle
] as const;

/** A shared empty map returned when the panel shouldn't show (stable identity). */
const EMPTY_STYLES: ReadonlySharedStyleMap = new SharedStyleMap();

/**
 * From-scratch port of tldraw's StylePanelContext. Wraps the editor's real style
 * API in reactive accessors so the Svelte style panel reads/writes the SAME
 * `StyleProp`s the converted shapes already declare — no shape rework. Setting a
 * style applies it to the selection (if any) and remembers it for the next shape,
 * exactly like tldraw's `handleValueChange`.
 */
export class StylePanelModel {
	#editor: Editor;

	/**
	 * The relevant styles to show, a faithful port of tldraw's `useRelevantStyles`:
	 *  - start from the selection's shared styles;
	 *  - in the SELECT tool with nothing selected, seed the panel from the NEXT-SHAPE
	 *    defaults (so you can set color/size/etc. before drawing);
	 *  - show the panel (return a map, possibly empty for the opacity slider) when a
	 *    shape-specific tool is active, OR shapes are selected, OR there are styles;
	 *  - otherwise return null → the panel is hidden.
	 * This is why the panel appears while a draw/geo/line tool is active — letting you
	 * set the line thickness BEFORE drawing, exactly like tldraw.
	 */
	readonly relevant = fromComputed<ReadonlySharedStyleMap | null>('relevant styles', () => {
		const editor = this.#editor;
		const styles = new SharedStyleMap(editor.getSharedStyles());
		const isInShapeSpecificTool = !!editor.root.getCurrent()?.shapeType;
		const hasShapesSelected = editor.isIn('select') && editor.getSelectedShapeIds().length > 0;

		if (styles.size === 0 && editor.isIn('select') && editor.getSelectedShapeIds().length === 0) {
			for (const style of SELECT_TOOL_STYLES) {
				styles.applyValue(style, editor.getStyleForNextShape(style));
			}
		}

		if (isInShapeSpecificTool || hasShapesSelected || styles.size > 0) {
			return styles;
		}
		return null;
	});

	/**
	 * The shared styles to render (empty map when the panel shouldn't show). A plain
	 * getter over the single `relevant` reactive signal — reading `.current` here keeps
	 * the same reactive subscription rather than nesting a second `fromComputed` (which
	 * wouldn't re-run when the underlying styles change).
	 */
	get styles(): { current: ReadonlySharedStyleMap } {
		const relevant = this.relevant;
		return {
			get current() {
				return relevant.current ?? EMPTY_STYLES;
			}
		};
	}

	/** Whether the style panel should be shown at all (tldraw parity). */
	get isVisible(): { current: boolean } {
		const relevant = this.relevant;
		return {
			get current() {
				return relevant.current !== null;
			}
		};
	}
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
