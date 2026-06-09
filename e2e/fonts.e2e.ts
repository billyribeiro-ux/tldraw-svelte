import { expect, test } from '@playwright/test';

// Visual-fidelity evidence: the port loads tldraw's REAL self-hosted fonts (Shantell
// Sans for the "draw" font, IBM Plex Sans/Serif/Mono), so UI text and shape text
// render in the genuine faces — not system-ui. Guards against the fonts silently
// falling back.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
});

test('the real tldraw font files are served (200) and registered', async ({ page }) => {
	const origin = new URL(page.url()).origin;
	for (const f of [
		'Shantell_Sans-Informal_Regular.woff2',
		'IBMPlexSans-Medium.woff2',
		'IBMPlexSerif-Medium.woff2',
		'IBMPlexMono-Medium.woff2'
	]) {
		const res = await page.request.get(`${origin}/tldraw-fonts/${f}`);
		expect(res.status(), `${f} should load`).toBe(200);
	}

	// The font families are registered in document.fonts (the @font-face rules ran).
	const families = await page.evaluate(() => {
		const set = new Set<string>();
		document.fonts.forEach((f) => set.add(f.family));
		return [...set];
	});
	expect(families).toContain('tldraw_draw');
	expect(families).toContain('tldraw_sans');
});

test('UI text uses the real tldraw_sans font', async ({ page }) => {
	// The container sets --tl-font-sans → tldraw_sans; real UI text (the page-menu
	// "Page 1" label) inherits it.
	const label = page.getByTestId('page-menu.button').locator('.tlui-page-menu__current');
	const family = await label.evaluate((el) => getComputedStyle(el).fontFamily);
	expect(family).toContain('tldraw_sans');
});
