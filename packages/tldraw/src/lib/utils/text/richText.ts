import {
	type Editor,
	getOwnProperty,
	type RichTextFontVisitorState,
	type TiptapNode,
	type TLFontFace,
	type TLRichText,
	WeakCache
} from '@tldraw/editor';
import { DefaultFontFaces } from '../../shapes/shared/defaultFonts';

// FROM-SCRATCH rich-text helpers (no tiptap / no third-party rich-text lib).
//
// TLRichText is a ProseMirror-style JSON document:
//   { type: 'doc', content: [ { type: 'paragraph', content: [ { type: 'text',
//     text: '...', marks?: [{ type: 'bold'|'italic'|'code'|'highlight'|'link',
//     attrs?: {...} }] } ] } ] }
// We walk that tree directly. This covers everything the shapes consume
// (emptiness check, plaintext extraction, and HTML for text measurement).

// --- internal node types (structural; the validator only guarantees type+content) ---
interface RTMark {
	type: string;
	attrs?: Record<string, unknown>;
}
interface RTNode {
	type: string;
	text?: string;
	marks?: RTMark[];
	content?: RTNode[];
	attrs?: Record<string, unknown>;
}

function nodes(rt: TLRichText): RTNode[] {
	return ((rt as unknown as RTNode).content ?? []) as RTNode[];
}

/**
 * True when the rich text has no actual content (a single empty block).
 * Matches tldraw's original semantics.
 *
 * @public
 */
export function isEmptyRichText(richText: TLRichText): boolean {
	const content = nodes(richText);
	if (content.length === 0) return true;
	if (content.length === 1) {
		const only = content[0];
		if (!only.content || only.content.length === 0) return true;
	}
	return false;
}

const plainTextCache = new WeakCache<TLRichText, string>();

/** Recursively collect text, inserting `\n` between block-level nodes. */
function collectText(node: RTNode): string {
	if (node.type === 'text') return node.text ?? '';
	if (node.type === 'hardBreak') return '\n';
	if (!node.content || node.content.length === 0) return '';
	// Block containers (paragraph, heading, listItem, …) join their children,
	// and adjacent blocks are separated by a newline (handled by the caller).
	return node.content.map(collectText).join('');
}

/**
 * Extract plain text from rich text. Each top-level block becomes a line.
 *
 * @public
 */
export function renderPlaintextFromRichText(_editor: Editor, richText: TLRichText): string {
	if (isEmptyRichText(richText)) return '';
	return plainTextCache.get(richText, () => {
		return nodes(richText)
			.map((block) => collectText(block))
			.join('\n');
	});
}

const htmlCache = new WeakCache<TLRichText, string>();

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Wrap an inline text node in tags for each of its marks (bold/italic/code/…). */
function renderInline(node: RTNode): string {
	if (node.type === 'hardBreak') return '<br />';
	if (node.type !== 'text') {
		return (node.content ?? []).map(renderInline).join('');
	}
	let html = escapeHtml(node.text ?? '');
	for (const mark of node.marks ?? []) {
		switch (mark.type) {
			case 'bold':
				html = `<strong>${html}</strong>`;
				break;
			case 'italic':
				html = `<em>${html}</em>`;
				break;
			case 'code':
				html = `<code>${html}</code>`;
				break;
			case 'highlight':
				html = `<mark>${html}</mark>`;
				break;
			case 'link': {
				const href = escapeHtml(String((mark.attrs?.href as string) ?? ''));
				html = `<a href="${href}">${html}</a>`;
				break;
			}
			default:
				break;
		}
	}
	return html;
}

function renderBlock(node: RTNode): string {
	const inner = (node.content ?? []).map(renderInline).join('');
	switch (node.type) {
		case 'heading': {
			const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
			return `<h${level}>${inner || '<br />'}</h${level}>`;
		}
		case 'bulletList':
			return `<ul>${(node.content ?? []).map(renderBlock).join('')}</ul>`;
		case 'orderedList':
			return `<ol>${(node.content ?? []).map(renderBlock).join('')}</ol>`;
		case 'listItem':
			return `<li>${(node.content ?? []).map(renderBlock).join('')}</li>`;
		case 'paragraph':
		default:
			// Empty paragraphs render a <br> so the browser doesn't collapse them.
			return `<p dir="auto">${inner || '<br />'}</p>`;
	}
}

/**
 * Render HTML from rich text (used for text measurement). Built from scratch by
 * walking the document tree — no tiptap `generateHTML`.
 *
 * @public
 */
export function renderHtmlFromRichText(_editor: Editor, richText: TLRichText): string {
	return htmlCache.get(richText, () => nodes(richText).map(renderBlock).join(''));
}

/**
 * Render HTML wrapped in the measurement container, matching tldraw's markup so
 * the TextManager measures the same way.
 *
 * @public
 */
export function renderHtmlFromRichTextForMeasurement(editor: Editor, richText: TLRichText): string {
	const html = renderHtmlFromRichText(editor, richText);
	return `<div class="tl-rich-text">${html}</div>`;
}

/** Build a TLRichText doc from an array of plain-text lines. */
export function richTextFromPlainText(text: string): TLRichText {
	const content: RTNode[] = text
		.split('\n')
		.map((line) =>
			line === ''
				? { type: 'paragraph' }
				: { type: 'paragraph', content: [{ type: 'text', text: line }] }
		);
	return { type: 'doc', content } as unknown as TLRichText;
}

/** Map an inline DOM element's tag to a ProseMirror mark, if any. */
function markForTag(tag: string): RTMark | undefined {
	switch (tag) {
		case 'STRONG':
		case 'B':
			return { type: 'bold' };
		case 'EM':
		case 'I':
			return { type: 'italic' };
		case 'CODE':
			return { type: 'code' };
		case 'MARK':
			return { type: 'highlight' };
		default:
			return undefined;
	}
}

/** Walk an inline DOM subtree, collecting text nodes with their accumulated marks. */
function collectInline(node: Node, marks: RTMark[], out: RTNode[]): void {
	if (node.nodeType === 3 /* text */) {
		const text = node.textContent ?? '';
		if (text)
			out.push(marks.length ? { type: 'text', text, marks: [...marks] } : { type: 'text', text });
		return;
	}
	if (node.nodeType !== 1) return;
	const el = node as Element;
	if (el.tagName === 'BR') {
		out.push({ type: 'hardBreak' });
		return;
	}
	const mark = markForTag(el.tagName);
	const nextMarks = mark ? [...marks, mark] : marks;
	for (const child of Array.from(el.childNodes)) collectInline(child, nextMarks, out);
}

/**
 * Parse contenteditable HTML back into TLRichText JSON (inverse of
 * renderHtmlFromRichText). From-scratch DOM walk — no tiptap `generateJSON`.
 * Block elements (p/div/h1–h6/li) become paragraphs/headings; inline tags
 * (strong/em/code/mark/br) become marks. Runs in the browser (uses DOMParser).
 *
 * @public
 */
export function richTextFromHtml(html: string): TLRichText {
	if (typeof DOMParser === 'undefined') {
		// Non-DOM environment (SSR/headless): fall back to a single text block.
		return richTextFromPlainText(html.replace(/<[^>]+>/g, ''));
	}
	const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
	const body = doc.body;
	const blockTags = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI']);
	const content: RTNode[] = [];

	const blocks = Array.from(body.children).filter((el) => blockTags.has(el.tagName));
	const sources: Element[] = blocks.length ? blocks : [body];

	for (const block of sources) {
		const inline: RTNode[] = [];
		for (const child of Array.from(block.childNodes)) collectInline(child, [], inline);
		const heading = /^H([1-6])$/.exec(block.tagName);
		if (heading) {
			content.push({ type: 'heading', attrs: { level: Number(heading[1]) }, content: inline });
		} else {
			content.push(inline.length ? { type: 'paragraph', content: inline } : { type: 'paragraph' });
		}
	}

	if (content.length === 0) content.push({ type: 'paragraph' });
	return { type: 'doc', content } as unknown as TLRichText;
}

/**
 * Alias matching tldraw's original `renderRichTextFromHTML` name (used by some
 * shape utils). From-scratch parser; `editor` is unused.
 *
 * @public
 */
export function renderRichTextFromHTML(_editor: Editor, html: string): TLRichText {
	return richTextFromHtml(html);
}

/**
 * Walks marks on a node to accumulate which font face (family/weight/style) it
 * needs, so the editor can preload fonts. Ported 1:1 (framework-free; no tiptap).
 *
 * @public
 */
export function defaultAddFontsFromNode(
	node: TiptapNode,
	state: RichTextFontVisitorState,
	addFont: (font: TLFontFace) => void
) {
	for (const mark of node.marks ?? []) {
		if (mark.type.name === 'bold' && state.weight !== 'bold') {
			state = { ...state, weight: 'bold' };
		}
		if (mark.type.name === 'italic' && state.style !== 'italic') {
			state = { ...state, style: 'italic' };
		}
		if (mark.type.name === 'code' && state.family !== 'tldraw_mono') {
			state = { ...state, family: 'tldraw_mono' };
		}
	}

	const fontsForFamily = getOwnProperty(DefaultFontFaces, state.family);
	if (!fontsForFamily) return state;
	const fontsForStyle = getOwnProperty(fontsForFamily, state.style);
	if (!fontsForStyle) return state;
	const fontsForWeight = getOwnProperty(fontsForStyle, state.weight);
	if (!fontsForWeight) return state;

	addFont(fontsForWeight);
	return state;
}
