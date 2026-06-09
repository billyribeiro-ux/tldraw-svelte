import { expect, test } from '@playwright/test';

// Phase B evidence: the from-scratch UI (TldrawUi) wires the real tools + actions
// registries + keyboard shortcuts to the editor — toolbar renders, tool buttons
// activate tools, and keyboard shortcuts fire tools + actions.

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
		window.editor.setCurrentTool('select');
	});
});

test('the toolbar renders the core tools as flat buttons (tldraw order)', async ({ page }) => {
	// The non-geo tools are always visible (they sit before the geo variants, which
	// overflow into the "..." popover on narrow widths).
	for (const id of ['select', 'hand', 'draw', 'eraser', 'arrow', 'text', 'note']) {
		await expect(page.locator(`.tlui-toolbar [data-tool="${id}"]`)).toHaveCount(1);
	}
	// The first visible button is Select (tldraw's first toolbar item).
	await expect(page.locator('.tlui-toolbar [data-tool]').first()).toHaveAttribute(
		'data-tool',
		'select'
	);
});

test('clicking a geo-variant button activates the geo tool with that variant', async ({ page }) => {
	// geo-rectangle is a flat toolbar button that proxies to the geo tool.
	await page.locator('.tlui-toolbar [data-tool="geo-rectangle"]').click();
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('geo');
	await expect(page.locator('.tlui-toolbar [data-tool="geo-rectangle"]')).toHaveAttribute(
		'data-isactive',
		'true'
	);
});

test('keyboard shortcuts switch tools and fire actions', async ({ page }) => {
	// Tool hotkeys (from the tools registry)
	await page.locator('.tl-canvas').click({ position: { x: 4, y: 4 } });
	await page.keyboard.press('a'); // arrow tool
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('arrow');
	await page.keyboard.press('v'); // select
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('select');

	// Action shortcut: create a shape (with a history mark, as real tool use
	// does), delete it via the 'delete' action's keyboard binding.
	await page.evaluate(() => {
		const id = 'shape:kbd' as Parameters<typeof window.editor.getShape>[0];
		window.editor.markHistoryStoppingPoint();
		window.editor.createShape({
			id,
			type: 'geo',
			x: 60,
			y: 60,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
		window.editor.markHistoryStoppingPoint();
		window.editor.setSelectedShapes([id]);
	});
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);
	await page.keyboard.press('Delete'); // fires the 'delete' action
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(0);

	// Undo (the 'undo' action's $z binding) restores it to the marked state.
	await page.keyboard.press('ControlOrMeta+z');
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);
});
