import { expect, test } from '@playwright/test';

// Phase 1 evidence: the REAL tldraw DrawShapeTool + DrawShapeUtil (perfect-
// freehand) draw a real freehand stroke, rendered by DrawShape.svelte, in a
// browser.

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

test('the real DrawShapeTool draws a freehand stroke', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('draw'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('draw');

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 100, box.y + 200);
	await page.mouse.down();
	for (let i = 1; i <= 14; i++) {
		await page.mouse.move(box.x + 100 + i * 14, box.y + 200 + Math.sin(i / 2) * 40);
	}
	await page.mouse.up();

	const info = await page.evaluate(() => {
		const s = window.editor.getCurrentPageShapes().find((s) => s.type === 'draw');
		return s ? { segs: (s.props as { segments: unknown[] }).segments.length } : null;
	});
	expect(info).not.toBeNull();
	expect(info!.segs).toBeGreaterThanOrEqual(1);

	// It renders via DrawShape.svelte with a real freehand ink path.
	const inkPath = page.locator('[data-shape-type="draw"] svg.tl-draw path').first();
	await expect(inkPath).toHaveCount(1);
	const d = await inkPath.getAttribute('d');
	expect(d).toBeTruthy();
	expect(d!.length).toBeGreaterThan(20);
});
