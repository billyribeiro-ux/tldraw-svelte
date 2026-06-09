import { expect, test } from '@playwright/test';

// Phase E evidence: the from-scratch NavigationPanel + Minimap match tldraw's
// DefaultNavigationPanel exactly — the minimap is COLLAPSED on load (persisted
// `minimap` flag defaults true), shown only at TABLET+ once expanded via the toggle.
// The minimap renders the page into a 2D canvas and click-to-pan drives
// editor.centerOnPoint; the zoom buttons fire the real zoom actions. No third-party lib.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 }); // TABLET+ so minimap is available
	await page.addInitScript(() => localStorage.removeItem('minimap')); // default-collapsed
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		window.editor.setCurrentTool('select');
		window.editor.resetZoom();
		window.editor.centerOnPoint({ x: 0, y: 0 });
	});
});

test('the navigation panel shows, and the minimap is collapsed on load (tldraw default)', async ({
	page
}) => {
	await expect(page.getByTestId('navigation-panel')).toBeVisible();
	// Collapsed by default → no minimap, and the toggle button is present.
	await expect(page.getByTestId('minimap')).toHaveCount(0);
	await expect(page.getByTestId('minimap.toggle-button')).toBeVisible();
});

test('expanding the minimap reveals it + the zoom buttons; the zoom buttons drive the camera', async ({
	page
}) => {
	await page.getByTestId('minimap.toggle-button').click();
	await expect(page.getByTestId('minimap')).toBeVisible();

	await page.getByTestId('nav.zoom-in').click();
	await expect.poll(() => page.evaluate(() => window.editor.getZoomLevel())).toBeGreaterThan(1);
	await page.getByTestId('nav.zoom-out').click();
	await page.getByTestId('nav.zoom-out').click();
	await expect.poll(() => page.evaluate(() => window.editor.getZoomLevel())).toBeLessThan(1);
});

test('clicking the minimap pans the camera', async ({ page }) => {
	await page.getByTestId('minimap.toggle-button').click();
	await page.evaluate(() => {
		const id = 'shape:nav' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 1200,
			y: 900,
			props: { geo: 'rectangle', w: 200, h: 160 }
		});
	});
	const before = await page.evaluate(() => window.editor.getViewportPageBounds().center);

	const minimap = page.getByTestId('minimap');
	const box = await minimap.boundingBox();
	if (!box) throw new Error('minimap not laid out');
	await minimap.click({ position: { x: box.width - 6, y: box.height - 6 } });

	const after = await page.evaluate(() => window.editor.getViewportPageBounds().center);
	expect(after.x !== before.x || after.y !== before.y).toBe(true);
});

test('the minimap toggles off and on via the toggle button', async ({ page }) => {
	const toggle = page.getByTestId('minimap.toggle-button');
	// Collapsed on load → expand → minimap shown → collapse → hidden.
	await expect(page.getByTestId('minimap')).toHaveCount(0);
	await toggle.click();
	await expect(page.getByTestId('minimap')).toBeVisible();
	await toggle.click();
	await expect(page.getByTestId('minimap')).toHaveCount(0);
});
