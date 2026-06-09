import { expect, test } from '@playwright/test';

// Phase 1 evidence: the REAL tldraw GeoShapeTool draws a real geo shape by
// dragging (pointer → real tool state machine → createShapes), in a browser.

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

test('the real GeoShapeTool draws a geo shape by dragging', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('geo'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('geo');

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 120, box.y + 120);
	await page.mouse.down();
	await page.mouse.move(box.x + 300, box.y + 260, { steps: 10 });
	await page.mouse.up();

	const shapes = await page.evaluate(() =>
		window.editor.getCurrentPageShapes().map((s) => ({ type: s.type, props: s.props }))
	);
	expect(shapes).toHaveLength(1);
	expect(shapes[0].type).toBe('geo');
	expect((shapes[0].props as { w: number }).w).toBeGreaterThan(120);
	expect((shapes[0].props as { h: number }).h).toBeGreaterThan(100);

	// It renders via GeoShape.svelte.
	await expect(page.locator('[data-shape-type="geo"] path.tl-geo__stroke')).toHaveCount(1);
});
