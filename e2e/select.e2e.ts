import { expect, test } from '@playwright/test';

// Phase 1 evidence: the REAL tldraw SelectTool drives select + move on real geo
// shapes (pointer events → real state machine → store), in a real browser.

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

test('the real SelectTool selects a geo shape on click', async ({ page }) => {
	const id = await page.evaluate(() => {
		const editor = window.editor;
		const sid = 'shape:sel' as Parameters<typeof editor.getShape>[0];
		editor.createShape({
			id: sid,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 160, h: 120, fill: 'solid' }
		});
		return sid;
	});

	const canvas = page.locator('.tl-canvas');
	const box = (await canvas.boundingBox())!;
	// Click inside the shape (page 100,100 + ~half size, default camera).
	await page.mouse.click(box.x + 180, box.y + 160);

	await expect
		.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds()))
		.toContain(id);
});

test('the real SelectTool moves a geo shape on drag', async ({ page }) => {
	const id = await page.evaluate(() => {
		const editor = window.editor;
		const sid = 'shape:mov' as Parameters<typeof editor.getShape>[0];
		editor.createShape({
			id: sid,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 120, h: 100, fill: 'solid' }
		});
		return sid;
	});

	const before = await page.evaluate(
		(sid) => {
			const s = window.editor.getShape(sid) as { x: number; y: number };
			return { x: s.x, y: s.y };
		},
		id
	);

	const box = (await page.locator('.tl-canvas').boundingBox())!;
	// Drag from inside the shape by +90,+70.
	await page.mouse.move(box.x + 150, box.y + 140);
	await page.mouse.down();
	await page.mouse.move(box.x + 240, box.y + 210, { steps: 10 });
	await page.mouse.up();

	const after = await page.evaluate(
		(sid) => {
			const s = window.editor.getShape(sid) as { x: number; y: number };
			return { x: s.x, y: s.y };
		},
		id
	);

	expect(after.x).toBeGreaterThan(before.x + 50);
	expect(after.y).toBeGreaterThan(before.y + 40);
	expect(await page.evaluate(() => window.editor.getSelectedShapeIds())).toContain(id);
});
