import { expect, test } from '@playwright/test';

// Persistence evidence: a real geo shape drawn in the browser is persisted to
// browser IndexedDB and restored on reload — fully client-side, no backend
// (Vercel-friendly).

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test('persists shapes across reloads via browser IndexedDB', async ({ page }) => {
	await page.goto('/?doc=e2e-persist');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });

	// Clear any prior persisted state, then create a uniquely-sized real geo shape.
	const uniqueW = 137;
	await page.evaluate((w) => {
		const editor = window.editor;
		editor.selectAll();
		editor.deleteShapes(editor.getSelectedShapeIds());
		const id = `shape:persist-test` as Parameters<typeof editor.getShape>[0];
		editor.createShape({
			id,
			type: 'geo',
			x: 50,
			y: 50,
			props: { geo: 'rectangle', w, h: 90 }
		});
	}, uniqueW);

	// Wait for the debounced save to flush to the server.
	await page.waitForTimeout(1200);

	// Reload — the editor reconstructs and should load the saved snapshot.
	await page.goto('/?doc=e2e-persist');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });

	// Poll until the persisted shape is restored.
	await expect
		.poll(
			() =>
				page.evaluate(() => {
					const shapes = window.editor.getCurrentPageShapes();
					const geo = shapes.find((s) => s.type === 'geo');
					return geo ? (geo.props as { w: number }).w : null;
				}),
			{ timeout: 10000 }
		)
		.toBe(uniqueW);

	// And it renders.
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);
});
