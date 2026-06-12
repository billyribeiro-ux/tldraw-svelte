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

test('dragging a resize handle resizes the shape smaller AND bigger', async ({ page }) => {
	// Regression: resize was broken (Canvas called a non-existent startResizing
	// method); now it dispatches tldraw's real target:'selection'+handle event so
	// Idle → pointing_resize_handle → resizing engages.
	await page.evaluate(() => {
		const e = window.editor;
		e.selectAll();
		e.deleteShapes(e.getSelectedShapeIds());
		e.createShape({
			id: 'shape:rsz' as never,
			type: 'geo',
			x: 300,
			y: 300,
			props: { geo: 'rectangle', w: 200, h: 160 }
		});
		e.setCurrentTool('select');
		e.setSelectedShapes(['shape:rsz' as never]);
		e.zoomToFit();
	});
	await page.waitForTimeout(200);

	const cornerScreen = () =>
		page.evaluate(() => {
			const e = window.editor;
			const b = e.getShapePageBounds('shape:rsz' as never)!;
			const br = e.pageToScreen({ x: b.maxX, y: b.maxY });
			const tl = e.pageToScreen({ x: b.minX, y: b.minY });
			return {
				brX: Math.round(br.x),
				brY: Math.round(br.y),
				tlX: Math.round(tl.x),
				tlY: Math.round(tl.y),
				w: Math.round(b.width),
				h: Math.round(b.height)
			};
		});

	// Smaller: drag the bottom-right handle inward.
	let c = await cornerScreen();
	const startW = c.w;
	const tx = c.tlX + Math.round((c.brX - c.tlX) * 0.4);
	const ty = c.tlY + Math.round((c.brY - c.tlY) * 0.4);
	await page.mouse.move(c.brX, c.brY);
	await page.mouse.down();
	await page.mouse.move((c.brX + tx) / 2, (c.brY + ty) / 2, { steps: 6 });
	await page.mouse.move(tx, ty, { steps: 6 });
	await page.mouse.up();
	await page.waitForTimeout(150);
	c = await cornerScreen();
	expect(c.w).toBeLessThan(startW);

	// Bigger: drag the (new) bottom-right handle outward.
	const smallW = c.w;
	await page.mouse.move(c.brX, c.brY);
	await page.mouse.down();
	await page.mouse.move(c.brX + 120, c.brY + 100, { steps: 8 });
	await page.mouse.up();
	await page.waitForTimeout(150);
	c = await cornerScreen();
	expect(c.w).toBeGreaterThan(smallW);
});
