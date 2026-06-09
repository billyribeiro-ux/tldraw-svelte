import type { TLRichText, TLFontFace } from '@tldraw/tlschema'
import type { Editor } from '../editor/Editor'

// FROM-SCRATCH rich-text support (no tiptap / no third-party rich-text lib).
//
// TLRichText is a ProseMirror-style JSON document. We model a minimal node shape
// and walk it directly — no ProseMirror schema, no `Node.fromJSON`.

/**
 * A rich-text node, structurally compatible with the TLRichText JSON. `marks`
 * carry inline formatting (bold/italic/code/highlight/link); `content` holds
 * child nodes. This replaces tiptap's `Node`.
 *
 * @public
 */
export interface RichTextNode {
	type: string
	text?: string
	marks?: { type: { name: string }; attrs?: Record<string, unknown> }[]
	content?: RichTextNode[]
	attrs?: Record<string, unknown>
	/** Convenience accessor used by font visiting (children of this node). */
	readonly children?: RichTextNode[]
}

/**
 * The live rich-text editor instance. In this from-scratch port it is our own
 * minimal contenteditable-backed editor (built in the text/note phase), not
 * tiptap. Kept opaque here to avoid coupling the engine to a UI implementation.
 *
 * @public
 */
export interface TiptapEditor {
	getText?(): string
	/** Imperative commands (focus, blur, selectAll, …) — provided by the
	 * from-scratch rich-text editor instance. Matches the call sites in the
	 * vendored shape utils (e.g. `commands.focus('all')`). */
	commands: {
		focus(position?: unknown): unknown
		blur?(): unknown
		[key: string]: ((...args: unknown[]) => unknown) | undefined
	}
	destroy?(): void
	[key: string]: unknown
}

/**
 * A rich-text node (alias kept for source compatibility with tldraw shape utils
 * that referenced `TiptapNode`). It is our {@link RichTextNode}, not tiptap's.
 *
 * @public
 */
export type TiptapNode = RichTextNode

/**
 * Configuration for the rich-text layer. The original tldraw shape utils read
 * `addFontsFromNode`; `extensions`/other tiptap fields are accepted but unused
 * by this from-scratch implementation.
 *
 * @public
 */
export interface TLTiptapConfig {
	extensions?: unknown[]
	[key: string]: unknown
}

/** @public */
export interface TLTextOptions {
	tipTapConfig?: TLTiptapConfig
	addFontsFromNode?: RichTextFontVisitor
}

/** @public */
export interface RichTextFontVisitorState {
	readonly family: string
	readonly weight: string
	readonly style: string
}

/** @public */
export type RichTextFontVisitor = (
	node: TiptapNode,
	state: RichTextFontVisitorState,
	addFont: (font: TLFontFace) => void
) => RichTextFontVisitorState

/** Normalise a raw TLRichText JSON node so it always exposes `children`. */
function asNode(raw: unknown): RichTextNode {
	const n = (raw ?? {}) as RichTextNode
	const children = (n.content ?? []) as RichTextNode[]
	return { ...n, children }
}

/**
 * Collect the font faces needed by a rich-text document, by walking its nodes
 * and applying the configured `addFontsFromNode` visitor. From-scratch: walks
 * the raw JSON tree directly (no ProseMirror schema / `Node.fromJSON`).
 *
 * @public
 */
export function getFontsFromRichText(
	editor: Editor,
	richText: TLRichText,
	initialState: RichTextFontVisitorState
): TLFontFace[] {
	const { addFontsFromNode } = editor.getTextOptions()
	if (!addFontsFromNode) return []

	const fonts = new Set<TLFontFace>()
	const addFont = (font: TLFontFace) => {
		fonts.add(font)
	}

	function visit(node: RichTextNode, state: RichTextFontVisitorState) {
		// The visitor reads `node.marks` (each `{ type: { name } }`); ensure shape.
		const visitState = addFontsFromNode!(
			{ ...node, marks: node.marks ?? [] } as TiptapNode,
			state,
			addFont
		)
		for (const child of node.children ?? []) {
			visit(asNode(child), visitState)
		}
	}

	visit(asNode(richText as unknown), initialState)
	return Array.from(fonts)
}
