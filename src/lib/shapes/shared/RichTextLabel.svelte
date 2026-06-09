<script lang="ts">
	import type { TLRichText, TLShapeId } from '@tldraw/tlschema';
	import { renderHtmlFromRichText, isEmptyRichText, richTextFromHtml } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	// FROM-SCRATCH rich-text label + inline editor (no tiptap). Replaces tldraw's
	// React RichTextLabel/RichTextArea. Display mode renders the rich-text HTML;
	// when this shape is the editor's editing shape, a contenteditable lets the
	// user type, committing `richTextFromHtml(...)` back to the shape on input.
	let {
		shapeId,
		richText,
		type,
		fontFamily = 'inherit',
		fontSize = 20,
		lineHeight = 1.3,
		textAlign = 'center',
		verticalAlign = 'middle',
		labelColor = 'currentColor',
		padding = 0,
		wrap = false
	}: {
		shapeId: TLShapeId;
		richText: TLRichText | undefined;
		type: string;
		fontFamily?: string;
		fontSize?: number;
		lineHeight?: number;
		textAlign?: string;
		verticalAlign?: string;
		labelColor?: string;
		padding?: number;
		wrap?: boolean;
	} = $props();

	const editor = getEditor();

	const editingId = fromComputed('editing shape id', () => editor.getEditingShapeId());
	const isEditing = $derived(editingId.current === shapeId);

	// `html` is produced ONLY by our own `renderHtmlFromRichText`, which HTML-
	// escapes every text node + href and emits only a fixed whitelist of tags
	// (p/strong/em/code/mark/a/h1-6/ul/ol/li/br). It is never raw user HTML, so
	// the `{@html html}` uses below are safe by construction (no XSS surface).
	const html = $derived(richText ? renderHtmlFromRichText(editor, richText) : '');
	const empty = $derived(!richText || isEmptyRichText(richText));

	function commit(e: Event) {
		const el = e.currentTarget as HTMLElement;
		const next = richTextFromHtml(el.innerHTML);
		editor.updateShape({ id: shapeId, type, props: { richText: next } } as Parameters<
			typeof editor.updateShape
		>[0]);
	}

	function onBlur() {
		if (editor.getEditingShapeId() === shapeId) editor.setEditingShape(null);
	}

	// While editing, the contenteditable OWNS its DOM — we must NOT re-render its
	// content from the model on every keystroke (that resets the caret). So we
	// seed innerHTML once when the editor mounts, focus, and place the caret at
	// the end; subsequent edits flow one-way (DOM → model via `commit`).
	function setupEditor(node: HTMLElement) {
		node.innerHTML = html; // seed once from the current model
		node.focus();
		const sel = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(node);
		range.collapse(false);
		sel?.removeAllRanges();
		sel?.addRange(range);
	}
</script>

{#if !isEditing && empty}
	<!-- nothing to show -->
{:else}
	<div
		class="tl-rich-text-label"
		class:tl-rich-text-label--wrap={wrap}
		data-editing={isEditing}
		style:font-family={fontFamily}
		style:font-size="{fontSize}px"
		style:line-height={lineHeight}
		style:text-align={textAlign}
		style:--tl-vertical-align={verticalAlign}
		style:color={labelColor}
		style:padding="{padding}px"
	>
		{#if isEditing}
			<!-- Content is seeded imperatively by setupEditor (one-way DOM→model
			while editing) so the caret isn't reset on each keystroke. -->
			<div
				class="tl-rich-text-label__editor"
				contenteditable="true"
				role="textbox"
				tabindex="0"
				aria-label="Shape text"
				oninput={commit}
				onblur={onBlur}
				{@attach setupEditor}
			></div>
		{:else}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="tl-rich-text-label__content">{@html html}</div>
		{/if}
	</div>
{/if}

<style>
	.tl-rich-text-label {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		pointer-events: none;
	}
	.tl-rich-text-label[data-editing='true'] {
		pointer-events: all;
		/* Stay interactable even when the shape geometry is empty (e.g. a brand-new
		   text shape with no content yet). */
		min-width: 24px;
		min-height: 1em;
		overflow: visible;
	}
	.tl-rich-text-label__editor {
		outline: none;
		min-width: 1ch;
		white-space: pre-wrap;
		width: 100%;
		height: 100%;
	}
	.tl-rich-text-label--wrap .tl-rich-text-label__content,
	.tl-rich-text-label--wrap .tl-rich-text-label__editor {
		white-space: pre-wrap;
		word-break: break-word;
	}
	.tl-rich-text-label :global(p) {
		margin: 0;
	}
</style>
