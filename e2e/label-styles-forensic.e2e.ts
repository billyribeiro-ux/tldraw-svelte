import { expect, test } from '@playwright/test';

// FORENSIC: the Font / Horizontal-align / Vertical-align / Shape controls. They
// act on a shape's TEXT LABEL. Geo shapes previously rendered no label at all, so
// these did nothing visually on a box. Now geo renders a RichTextLabel and the
// vertical-align actually applies. We assert on the rendered DOM, not just records.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

const RT = (t: string) => ({
	type: 'doc',
	content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }]
});

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		window.editor.setCurrentTool('select');
	});
});

async function geoWithText(page: import('@playwright/test').Page, id: string, text: string) {
	await page.evaluate(
		({ id, rt }) => {
			window.editor.createShape({
				id: id as never,
				type: 'geo',
				x: 80,
				y: 80,
				props: { geo: 'rectangle', w: 240, h: 160, richText: rt as never }
			});
			window.editor.setSelectedShapes([id as never]);
		},
		{ id, rt: RT(text) }
	);
}

function labelOf(page: import('@playwright/test').Page, id: string) {
	return page.locator(`[data-shape-id="${id}"] .tl-rich-text-label`).first();
}

test('a geo box with text now renders a label (was missing entirely)', async ({ page }) => {
	await geoWithText(page, 'shape:gl1', 'HELLO');
	const label = labelOf(page, 'shape:gl1');
	await expect(label).toHaveCount(1);
	await expect(label).toContainText('HELLO');
});

test('Font changes the geo label font-family in the DOM', async ({ page }) => {
	await geoWithText(page, 'shape:gl2', 'Type');
	const label = labelOf(page, 'shape:gl2');
	const before = await label.evaluate((el) => getComputedStyle(el).fontFamily);
	await page.getByTestId('style.font.mono').click();
	await expect.poll(() => label.evaluate((el) => getComputedStyle(el).fontFamily)).not.toBe(before);
});

test('Vertical align actually moves the label (justify-content), not just the record', async ({
	page
}) => {
	await geoWithText(page, 'shape:gl3', 'Pos');
	const label = labelOf(page, 'shape:gl3');
	// Default is middle → center.
	await expect
		.poll(() => label.evaluate((el) => getComputedStyle(el).justifyContent))
		.toBe('center');
	// Top.
	await page.getByTestId('style.verticalAlign.start').click();
	await expect
		.poll(() => label.evaluate((el) => getComputedStyle(el).justifyContent))
		.toBe('flex-start');
	// Bottom.
	await page.getByTestId('style.verticalAlign.end').click();
	await expect
		.poll(() => label.evaluate((el) => getComputedStyle(el).justifyContent))
		.toBe('flex-end');
});

test('Horizontal align sets the label align-items/text-align', async ({ page }) => {
	await geoWithText(page, 'shape:gl4', 'Pos');
	const label = labelOf(page, 'shape:gl4');
	await page.getByTestId('style.align.start').click();
	await expect
		.poll(() => label.evaluate((el) => getComputedStyle(el).alignItems))
		.toBe('flex-start');
	await page.getByTestId('style.align.end').click();
	await expect.poll(() => label.evaluate((el) => getComputedStyle(el).alignItems)).toBe('flex-end');
});

test('Shape dropdown changes the geo type and the rendered path', async ({ page }) => {
	await page.evaluate(() => {
		window.editor.createShape({
			id: 'shape:gl5' as never,
			type: 'geo',
			x: 80,
			y: 80,
			props: { geo: 'rectangle', w: 200, h: 140 }
		});
		window.editor.setSelectedShapes(['shape:gl5' as never]);
	});
	const pathBefore = await page
		.locator('[data-shape-id="shape:gl5"] path.tl-geo__stroke')
		.first()
		.getAttribute('d');
	// Open the Shape dropdown and pick Ellipse from the menu (items are
	// menuitemcheckbox since they carry checked state).
	await page.getByTestId('style.geo').click();
	await page.getByRole('menuitemcheckbox', { name: /ellipse/i }).click();
	await expect
		.poll(() =>
			page.evaluate(
				() => (window.editor.getShape('shape:gl5' as never)?.props as { geo: string }).geo
			)
		)
		.toBe('ellipse');
	await expect
		.poll(() =>
			page.locator('[data-shape-id="shape:gl5"] path.tl-geo__stroke').first().getAttribute('d')
		)
		.not.toBe(pathBefore);
});
