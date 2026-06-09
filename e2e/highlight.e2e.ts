import { expect, test } from '@playwright/test';

// Phase 2 evidence: the REAL tldraw HighlightShapeTool (shares the draw tool's
// states) + HighlightShapeUtil draw a highlighter stroke, rendered by
// HighlightShape.svelte, in a browser.

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

test('the real HighlightShapeTool draws a highlight stroke', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('highlight'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('highlight');

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 100, box.y + 200);
	await page.mouse.down();
	for (let i = 1; i <= 12; i++) {
		await page.mouse.move(box.x + 100 + i * 16, box.y + 200 + Math.cos(i / 2) * 30);
	}
	await page.mouse.up();

	expect(
		await page.evaluate(() => window.editor.getCurrentPageShapes().map((s) => s.type))
	).toContain('highlight');

	const d = await page
		.locator('[data-shape-type="highlight"] svg.tl-highlight path')
		.first()
		.getAttribute('d');
	expect(d).toBeTruthy();
	expect(d!.length).toBeGreaterThan(20);
});
