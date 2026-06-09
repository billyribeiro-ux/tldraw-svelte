import { expect, test } from '@playwright/test';

// Phase 2 evidence: the REAL tldraw image / bookmark / embed shapes render via
// their Svelte renderers (asset resolution from scratch, no third-party libs).

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

test('a real image shape renders an <img> from a resolved asset', async ({ page }) => {
	await page.evaluate(() => {
		const editor = window.editor;
		// 1x1 transparent png data url
		const src =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
		const assetId = 'asset:img1' as never;
		editor.createAssets([
			{
				id: assetId,
				type: 'image',
				typeName: 'asset',
				props: { name: 'x', src, w: 100, h: 100, mimeType: 'image/png', isAnimated: false },
				meta: {}
			} as never
		]);
		editor.createShape({
			id: 'shape:img' as never,
			type: 'image',
			x: 60,
			y: 60,
			props: { w: 100, h: 100, assetId }
		});
	});

	await expect(page.locator('[data-shape-type="image"] img.tl-image')).toHaveCount(1);
});

test('a real bookmark shape renders a preview card', async ({ page }) => {
	await page.evaluate(() => {
		const editor = window.editor;
		const assetId = 'asset:bm1' as never;
		editor.createAssets([
			{
				id: assetId,
				type: 'bookmark',
				typeName: 'asset',
				props: {
					title: 'Example',
					description: 'An example site',
					image: '',
					favicon: '',
					src: 'https://example.com'
				},
				meta: {}
			} as never
		]);
		editor.createShape({
			id: 'shape:bm' as never,
			type: 'bookmark',
			x: 80,
			y: 80,
			props: { w: 300, h: 320, assetId, url: 'https://example.com' }
		});
	});

	await expect(page.locator('[data-shape-type="bookmark"] .tl-bookmark__container')).toHaveCount(1);
	await expect(page.locator('[data-shape-type="bookmark"]')).toContainText('example.com');
});

test('a real embed shape renders an <iframe>', async ({ page }) => {
	// Use a YouTube URL which the default embed definitions recognise.
	await page.evaluate(() => {
		window.editor.createShape({
			id: 'shape:embed' as never,
			type: 'embed',
			x: 80,
			y: 80,
			props: { w: 560, h: 315, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
		});
	});

	await expect(page.locator('[data-shape-type="embed"] iframe.tl-embed')).toHaveCount(1);
});
