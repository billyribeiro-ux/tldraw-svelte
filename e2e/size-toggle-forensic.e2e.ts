import { expect, test } from '@playwright/test';

// FORENSIC: "draw something, then make the lines thinner from the right-side
// style panel — won't work at all". We reproduce the exact HUMAN flow with real
// pointer clicks (no programmatic selection) and assert on HARD EVIDENCE: the
// editor record AND the rendered SVG path must change when the size is clicked.

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

/** Draw a straight-ish horizontal stroke with the draw tool via real mouse. */
async function drawStroke(page: import('@playwright/test').Page, y = 250) {
	await page.evaluate(() => window.editor.setCurrentTool('draw'));
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	const startX = box.x + 150;
	await page.mouse.move(startX, box.y + y);
	await page.mouse.down();
	for (let i = 1; i <= 12; i++) {
		await page.mouse.move(startX + i * 16, box.y + y);
	}
	await page.mouse.up();
	const id = await page.evaluate(
		() => window.editor.getCurrentPageShapes().find((s) => s.type === 'draw')!.id as string
	);
	return { id, box, y };
}

function inkPathD(page: import('@playwright/test').Page) {
	return page.locator('[data-shape-type="draw"] svg.tl-draw path').first().getAttribute('d');
}

test('FORENSIC A: select a drawn line by CLICK, then click smaller size → record + DOM thinner', async ({
	page
}) => {
	const { id, box, y } = await drawStroke(page);

	// Switch to the SELECT tool via keyboard (real), then CLICK the stroke to select
	// it — exactly what a human does. The midpoint of the stroke is ~ (150+96, y).
	await page.keyboard.press('v');
	await expect.poll(() => page.evaluate(() => window.editor.getCurrentToolId())).toBe('select');
	await page.mouse.click(box.x + 150 + 96, box.y + y);

	// HARD EVIDENCE 0: clicking actually selected the drawn line.
	await expect.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds())).toContain(id);

	// Make it thick (xl) then thin (s) — the user's failing action, via real clicks.
	await page.getByTestId('style.size.xl').click();
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('xl');
	const dXl = await inkPathD(page);

	await page.getByTestId('style.size.s').click();
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('s');
	// The rendered SVG path must visibly change (DOM reacted to the record).
	await expect.poll(() => inkPathD(page)).not.toBe(dXl);
});

test('FORENSIC B: set size BEFORE drawing applies to the new stroke (draw tool active)', async ({
	page
}) => {
	await page.evaluate(() => window.editor.setCurrentTool('draw'));
	await page.getByTestId('style.size.s').click();
	const { id } = await drawStroke(page);
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('s');
});

// Decisive GEOMETRIC proof of "thinner": the rendered ink outline's bounding-box
// height (the actual painted thickness) must shrink when going xl -> s.
function inkBBoxHeight(page: import('@playwright/test').Page) {
	return page
		.locator('[data-shape-type="draw"] svg.tl-draw path')
		.first()
		.evaluate((el) => (el as unknown as SVGGraphicsElement).getBBox().height);
}

test('FORENSIC C: shrinking a selected stroke reduces the painted outline thickness', async ({
	page
}) => {
	const { id, box, y } = await drawStroke(page);
	await page.keyboard.press('v');
	await page.mouse.click(box.x + 150 + 96, box.y + y);
	await expect.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds())).toContain(id);

	await page.getByTestId('style.size.xl').click();
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('xl');
	const hXl = await inkBBoxHeight(page);
	await page.locator('.tl-canvas').screenshot({ path: 'test-results/stroke-xl.png' });

	await page.getByTestId('style.size.s').click();
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('s');
	const hS = await inkBBoxHeight(page);
	await page.locator('.tl-canvas').screenshot({ path: 'test-results/stroke-s.png' });

	// Hard evidence the line is visibly thinner: the small outline is clearly
	// shorter than the extra-large one.
	expect(hS).toBeLessThan(hXl);
});

test('FORENSIC D: direct default(m) -> small thins the selected stroke (no xl bump)', async ({
	page
}) => {
	const { id, box, y } = await drawStroke(page);
	await page.keyboard.press('v');
	await page.mouse.click(box.x + 150 + 96, box.y + y);
	await expect.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds())).toContain(id);

	// Default draw size is 'm'. Measure, then click 's' directly.
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('m');
	const hM = await inkBBoxHeight(page);

	await page.getByTestId('style.size.s').click();
	await expect
		.poll(() =>
			page.evaluate(
				(sid) => (window.editor.getShape(sid as never)?.props as { size: string }).size,
				id
			)
		)
		.toBe('s');
	const hS = await inkBBoxHeight(page);

	expect(hS).toBeLessThan(hM);
});

// The opacity slider sets the shape's `opacity` field; the rendered shape
// container must actually become transparent (regression: opacity was written to
// the record but never applied to the DOM, so the drawing never changed).
function shapeContainerOpacity(page: import('@playwright/test').Page) {
	return page
		.locator('.tl-shape[data-shape-type="draw"]')
		.first()
		.evaluate((el) => getComputedStyle(el).opacity);
}

test('FORENSIC E: the opacity slider actually changes the drawing opacity in the DOM', async ({
	page
}) => {
	const { id, box, y } = await drawStroke(page);
	await page.keyboard.press('v');
	await page.mouse.click(box.x + 150 + 96, box.y + y);
	await expect.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds())).toContain(id);

	// Fully opaque to start.
	expect(Number(await shapeContainerOpacity(page))).toBeCloseTo(1, 2);

	// Drag the opacity slider to a low value.
	const slider = page.getByTestId('style.opacity').getByRole('slider');
	await slider.fill('0.3');

	// HARD EVIDENCE 1: the record changed.
	await expect
		.poll(() => page.evaluate((sid) => window.editor.getShape(sid as never)?.opacity, id))
		.toBeCloseTo(0.3, 2);

	// HARD EVIDENCE 2: the rendered container is actually translucent now.
	await expect.poll(async () => Number(await shapeContainerOpacity(page))).toBeCloseTo(0.3, 2);
});
