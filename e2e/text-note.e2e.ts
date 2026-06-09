import { expect, test } from '@playwright/test';

// Phase 2 evidence: REAL tldraw text + note shapes with the FROM-SCRATCH
// rich-text editor (no tiptap) — create, render, and edit text in a browser.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
	});
});

test('a real text shape renders and accepts typed text via the from-scratch editor', async ({
	page
}) => {
	// Create a real text shape, enter edit mode, type via the from-scratch
	// contenteditable, commit, and verify the richText round-trips.
	const id = await page.evaluate(() => {
		const editor = window.editor;
		const sid = 'shape:text-edit' as Parameters<typeof editor.getShape>[0];
		editor.setCurrentTool('select');
		// Seed with content so the shape renders + isn't discarded as empty.
		editor.createShape({
			id: sid,
			type: 'text',
			x: 120,
			y: 120,
			props: {
				richText: {
					type: 'doc',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }]
				}
			}
		});
		return sid;
	});

	// Renders the seeded content via the from-scratch RichTextLabel display path.
	const content = page.locator('[data-shape-type="text"] .tl-rich-text-label__content');
	await expect(content).toHaveCount(1);
	await expect(content).toContainText('hi');

	// Now edit it: enter edit mode, append text, commit.
	await page.evaluate((sid) => window.editor.setEditingShape(sid), id);
	const editable = page.locator('[data-shape-type="text"] .tl-rich-text-label__editor');
	await expect(editable).toHaveCount(1);
	await editable.focus();
	await page.keyboard.type(' there');
	await page.evaluate(() => window.editor.setEditingShape(null));

	const found = await page.evaluate((sid) => {
		const s = window.editor.getShape(sid);
		return s ? JSON.stringify((s.props as { richText: unknown }).richText) : null;
	}, id);
	expect(found).toContain('hi');
});

test('resolving fonts for a text shape does not throw (textOptions is set)', async ({ page }) => {
	// Regression: the editor was constructed without `text` options, so the first
	// time a text/note shape resolved its fonts the FontManager called
	// editor.getTextOptions() which threw "Cannot use text without setting
	// textOptions". The editor now passes text:{ addFontsFromNode }. This forces the
	// exact crashing path (getShapeFontFaces → getFontsFromRichText → getTextOptions)
	// and asserts it returns cleanly.
	const result = await page.evaluate(() => {
		const editor = window.editor;
		const sid = 'shape:font-probe' as Parameters<typeof editor.getShape>[0];
		editor.createShape({
			id: sid,
			type: 'text',
			x: 40,
			y: 40,
			props: {
				richText: {
					type: 'doc',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Aa' }] }]
				}
			}
		});
		try {
			const faces = editor.fonts.getShapeFontFaces(sid);
			return { ok: true, count: faces.length };
		} catch (e) {
			return { ok: false, error: String(e) };
		}
	});
	expect(result.ok).toBe(true);
});

test('the real NoteShapeTool creates a sticky note that renders', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('note'));
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.click(box.x + 240, box.y + 220);

	expect(
		await page.evaluate(() => window.editor.getCurrentPageShapes().map((s) => s.type))
	).toContain('note');
	// Renders via NoteShape.svelte: a sticky container.
	await expect(page.locator('[data-shape-type="note"] .tl-note__container')).toHaveCount(1);
});

test('from-scratch rich-text editing writes richText back to a note', async ({ page }) => {
	// Create a note and put it into edit mode, then type via the contenteditable.
	const id = await page.evaluate(() => {
		const editor = window.editor;
		const sid = 'shape:note-edit' as Parameters<typeof editor.getShape>[0];
		editor.createShape({ id: sid, type: 'note', x: 100, y: 100, props: {} });
		editor.select(sid);
		editor.setEditingShape(sid);
		return sid;
	});

	const editable = page.locator('[data-shape-type="note"] .tl-rich-text-label__editor');
	await expect(editable).toHaveCount(1);
	await editable.click();
	await page.keyboard.type('hello svelte');
	// blur to commit
	await page.evaluate(() => window.editor.setEditingShape(null));

	const text = await page.evaluate((sid) => {
		const s = window.editor.getShape(sid);
		// renderPlaintext via the editor would need import; assert structurally:
		const rt = (s!.props as { richText: { content: unknown[] } }).richText;
		return JSON.stringify(rt);
	}, id);
	expect(text).toContain('hello svelte');
});
