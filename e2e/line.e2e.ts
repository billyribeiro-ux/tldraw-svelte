import { expect, test } from '@playwright/test';

// Phase 1 evidence: the REAL tldraw LineShapeTool + LineShapeUtil draw a real
// line, rendered by LineShape.svelte, in a browser.

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

test('the real LineShapeTool draws a line', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('line'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('line');

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 120, box.y + 120);
	await page.mouse.down();
	await page.mouse.move(box.x + 320, box.y + 240, { steps: 8 });
	await page.mouse.up();

	const shapes = await page.evaluate(() =>
		window.editor.getCurrentPageShapes().map((s) => s.type)
	);
	expect(shapes).toContain('line');

	// It renders via LineShape.svelte with a real path.
	const d = await page
		.locator('[data-shape-type="line"] svg.tl-line path')
		.first()
		.getAttribute('d');
	expect(d).toBeTruthy();
	expect(d!.length).toBeGreaterThan(8);
});
