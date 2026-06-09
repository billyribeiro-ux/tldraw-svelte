import { expect, test } from '@playwright/test';

// Evidence for the remaining tldraw surfaces now ported: clipboard (cut/copy/paste),
// the Laser tool + scribble overlay, PNG raster export, and the debug panel.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		window.editor.setCurrentTool('select');
	});
});

test('copy then paste duplicates the selected shape via the main menu', async ({ page }) => {
	await page.evaluate(() => {
		const id = 'shape:c1' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
		window.editor.setSelectedShapes([id]);
	});
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);

	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: /^Copy/ }).click();
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: /^Paste/ }).click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(2);
});

test('cut removes the shape and paste brings it back', async ({ page }) => {
	await page.evaluate(() => {
		const id = 'shape:c2' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'ellipse', w: 80, h: 60 }
		});
		window.editor.setSelectedShapes([id]);
	});
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: /^Cut/ }).click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(0);
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: /^Paste/ }).click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);
});

test('the laser tool draws a scribble that renders in the overlay', async ({ page }) => {
	// Laser is a real wired tool (its toolbar button may live in the "…" overflow at
	// this width); activate it and verify the scribble overlay renders while drawing.
	await page.evaluate(() => window.editor.setCurrentTool('laser'));
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('laser');

	const canvas = page.locator('.tl-canvas');
	await canvas.hover({ position: { x: 300, y: 300 } });
	await page.mouse.down();
	await page.mouse.move(360, 340);
	await page.mouse.move(440, 300);
	// While dragging, a scribble path is present in the overlay.
	await expect(page.locator('.tl-scribbles path')).toHaveCount(1);
	await page.mouse.up();
});

test('PNG export downloads a real png', async ({ page }) => {
	await page.evaluate(() => {
		const id = 'shape:p1' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 120, h: 90, color: 'blue', fill: 'solid' }
		});
	});
	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: 'Export as PNG' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('tldraw-export.png');
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const buf = Buffer.concat(chunks);
	// PNG magic number.
	expect(buf[0]).toBe(0x89);
	expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
	await expect(page.getByTestId('toast')).toContainText('Exported as PNG');
});

test('debug mode toggles a bottom readout showing the shape count', async ({ page }) => {
	await expect(page.getByTestId('debug-panel')).toHaveCount(0);
	await page.evaluate(() => {
		window.editor.createShape({
			id: 'shape:d1' as never,
			type: 'geo',
			x: 60,
			y: 60,
			props: { geo: 'rectangle', w: 60, h: 60 }
		});
	});
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitemcheckbox', { name: 'Debug mode' }).click();
	const panel = page.getByTestId('debug-panel');
	await expect(panel).toBeVisible();
	await expect(panel).toContainText('1 shapes');
});
