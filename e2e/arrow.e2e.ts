import { expect, test } from '@playwright/test';

// Phase 1 evidence: the REAL tldraw ArrowShapeTool + ArrowShapeUtil +
// ArrowBindingUtil — draw an arrow, render it, and bind an end to a shape.

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

test('the real ArrowShapeTool draws an arrow that renders', async ({ page }) => {
	await page.evaluate(() => window.editor.setCurrentTool('arrow'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('arrow');

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 120, box.y + 120);
	await page.mouse.down();
	await page.mouse.move(box.x + 340, box.y + 260, { steps: 10 });
	await page.mouse.up();

	expect(
		await page.evaluate(() => window.editor.getCurrentPageShapes().map((s) => s.type))
	).toContain('arrow');

	const d = await page
		.locator('[data-shape-type="arrow"] svg.tl-arrow path')
		.first()
		.getAttribute('d');
	expect(d).toBeTruthy();
	expect(d!.length).toBeGreaterThan(8);
});

test('an arrow binds to a geo shape when drawn ending on it', async ({ page }) => {
	// Place a target geo shape, then draw an arrow ending inside it.
	await page.evaluate(() => {
		window.editor.createShape({
			id: 'shape:target' as Parameters<typeof window.editor.getShape>[0],
			type: 'geo',
			x: 400,
			y: 100,
			props: { geo: 'rectangle', w: 160, h: 120, fill: 'solid' }
		});
		window.editor.setCurrentTool('arrow');
	});

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	// Start in empty space, end inside the target (~400+80,100+60 in page space).
	await page.mouse.move(box.x + 120, box.y + 160);
	await page.mouse.down();
	await page.mouse.move(box.x + 480, box.y + 160, { steps: 12 });
	await page.mouse.up();

	// A real arrow binding should now exist pointing at the target.
	const bindings = await page.evaluate(() => {
		const arrow = window.editor.getCurrentPageShapes().find((s) => s.type === 'arrow');
		if (!arrow) return [];
		return window.editor
			.getBindingsFromShape(arrow.id, 'arrow')
			.map((b) => ({ toId: b.toId, type: b.type }));
	});
	expect(bindings.length).toBeGreaterThan(0);
	expect(bindings.some((b) => b.toId === 'shape:target')).toBe(true);
});
