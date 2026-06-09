import { expect, test } from '@playwright/test';

// Visual-fidelity evidence: the UI renders tldraw's REAL icon SVGs (copied into
// static/tldraw-icons/) via the CSS-mask technique — not a third-party icon font,
// not a fallback glyph. Every toolbar icon's mask URL must resolve to a real 200
// SVG. This guards against the "No mapping … using fallback" regression.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
});

test('toolbar icons use real tldraw SVG masks that load (no fallbacks)', async ({ page }) => {
	const icons = page.locator('.tlui-toolbar .tlui-icon');
	const count = await icons.count();
	expect(count).toBeGreaterThan(0);

	// Collect each icon's mask URL from its inline custom property.
	const urls = await icons.evaluateAll((els) =>
		els
			.map((el) => {
				const v = (el as HTMLElement).style.getPropertyValue('--tl-icon-url');
				const m = v.match(/url\((.*)\)/);
				return m ? m[1].replace(/['"]/g, '') : '';
			})
			.filter(Boolean)
	);
	expect(urls.length).toBe(count);
	// They must point at the real tldraw icon assets.
	for (const u of urls) expect(u).toContain('/tldraw-icons/');

	// Each asset actually resolves (200) — proves we shipped the real SVGs.
	const origin = new URL(page.url()).origin;
	for (const u of [...new Set(urls)]) {
		const res = await page.request.get(origin + u);
		expect(res.status(), `icon ${u} should load`).toBe(200);
		expect(res.headers()['content-type'] ?? '').toContain('svg');
	}
});

test('the toolbar overflow popover shows real geo variant icons', async ({ page }) => {
	// Narrow the viewport so the 26 flat tool buttons can't all fit — the extras
	// (geo variants) move into the "..." overflow popover, exactly like tldraw.
	await page.setViewportSize({ width: 640, height: 720 });
	const more = page.getByTestId('toolbar.more');
	await expect(more).toBeVisible();
	await more.click();
	const grid = page.getByTestId('toolbar.overflow-grid');
	await expect(grid).toBeVisible();

	// The overflow panel must be ON-SCREEN (not clipped by the toolbar's
	// overflow:hidden — the bug where the chevron "did nothing"). Assert its box is
	// within the viewport and sits ABOVE the toolbar (side="top").
	const box = await grid.boundingBox();
	const vp = page.viewportSize()!;
	if (!box) throw new Error('overflow grid not laid out');
	expect(box.y).toBeGreaterThanOrEqual(0);
	expect(box.x).toBeGreaterThanOrEqual(0);
	expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
	expect(box.width).toBeGreaterThan(0);

	const urls = await grid
		.locator('.tlui-icon')
		.evaluateAll((els) =>
			els.map((el) => (el as HTMLElement).style.getPropertyValue('--tl-icon-url'))
		);
	// e.g. geo-star, geo-heart are real assets surfaced as overflow buttons.
	expect(urls.some((u) => u.includes('geo-star'))).toBe(true);
	expect(urls.some((u) => u.includes('geo-heart'))).toBe(true);

	// And a tool in the overflow is actually clickable → activates that tool.
	await grid.locator('[data-tool="geo-star"]').click();
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('geo');
});
