import { expect, test } from '@playwright/test';

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

test('renders a REAL geo rectangle with an SVG path', async ({ page }) => {
	await page.evaluate(() => {
		const editor = window.editor;
		const id = 'shape:geo-rect' as Parameters<typeof editor.getShape>[0];
		editor.createShape({
			id,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 160, h: 120, dash: 'solid', fill: 'solid', color: 'blue' }
		});
		editor.setSelectedShapes([id]);
	});

	// The real geo shape renders via GeoShape.svelte: a [data-shape-type="geo"]
	// host containing an <svg> with a stroke <path> that has real path data.
	const host = page.locator('[data-shape-type="geo"]');
	await expect(host).toHaveCount(1);
	const strokeD = await host.locator('path.tl-geo__stroke').first().getAttribute('d');
	expect(strokeD).toBeTruthy();
	expect(strokeD!.length).toBeGreaterThan(10);
	// solid+fill => a fill path is present too
	await expect(host.locator('path.tl-geo__fill')).toHaveCount(1);
});

test('renders multiple real geo variants', async ({ page }) => {
	const variants = await page.evaluate(() => {
		const editor = window.editor;
		const geos = ['ellipse', 'triangle', 'diamond', 'star'] as const;
		geos.forEach((geo, i) => {
			editor.createShape({
				id: `shape:geo-${geo}` as Parameters<typeof editor.getShape>[0],
				type: 'geo',
				x: i * 180,
				y: 40,
				props: { geo, w: 140, h: 140, dash: 'draw' }
			});
		});
		return geos.length;
	});
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(variants);
	// every variant produced a non-empty stroke path
	const paths = page.locator('[data-shape-type="geo"] path.tl-geo__stroke');
	await expect(paths).toHaveCount(variants);
});
