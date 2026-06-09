import { expect, test } from '@playwright/test';

// Phase 2 evidence: the REAL tldraw FrameShapeTool + FrameShapeUtil draw a frame
// (rect body + heading), rendered by FrameShape.svelte, in a browser.

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

test('the real FrameShapeTool draws a frame with a heading', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('frame'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('frame');

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 120, box.y + 120);
	await page.mouse.down();
	await page.mouse.move(box.x + 420, box.y + 320, { steps: 10 });
	await page.mouse.up();

	expect(
		await page.evaluate(() => window.editor.getCurrentPageShapes().map((s) => s.type))
	).toContain('frame');

	// Renders via FrameShape.svelte: a body rect + a heading label.
	await expect(page.locator('[data-shape-type="frame"] rect.tl-frame__body')).toHaveCount(1);
	await expect(page.locator('[data-shape-type="frame"] .tl-frame__heading')).toHaveCount(1);
});
