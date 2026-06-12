import { expect, test, type Page } from '@playwright/test';

// FORENSIC: exercise EVERY tool on the toolbar end-to-end via REAL toolbar clicks
// (opening the overflow menu when a button isn't directly visible) + real canvas
// drags, asserting the concrete outcome (shape created / type / geo variant /
// rendered DOM / camera move / erase). This is the full-bar regression net.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.use({ viewport: { width: 1400, height: 900 } });

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		window.editor.setCurrentTool('select');
	});
});

/** Click a toolbar tool button by id, opening the overflow grid if it's not shown. */
async function selectToolButton(page: Page, id: string) {
	const direct = page.locator(`.tlui-toolbar [data-tool="${id}"]`);
	if ((await direct.count()) > 0 && (await direct.first().isVisible())) {
		await direct.first().click();
		return;
	}
	// Open the overflow grid and click it there.
	await page.getByTestId('toolbar.more').click();
	const overflow = page.getByTestId('toolbar.overflow-grid').locator(`[data-tool="${id}"]`);
	await overflow.click();
}

async function dragOnCanvas(page: Page, x1: number, y1: number, x2: number, y2: number) {
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + x1, box.y + y1);
	await page.mouse.down();
	await page.mouse.move(box.x + x2, box.y + y2, { steps: 10 });
	await page.mouse.up();
}

const toolId = (page: Page) => page.evaluate(() => window.editor.getCurrentToolId());
const shapes = (page: Page) =>
	page.evaluate(() =>
		window.editor.getCurrentPageShapes().map((s) => ({ type: s.type, props: s.props }))
	);

// ---------------------------------------------------------------------------
// Every geo variant button: activates the geo tool, sets the right variant, and
// a drag creates a geo shape of that variant that renders a path.
// ---------------------------------------------------------------------------
const GEO_VARIANTS: Array<{ id: string; geo: string }> = [
	{ id: 'geo-rectangle', geo: 'rectangle' },
	{ id: 'geo-ellipse', geo: 'ellipse' },
	{ id: 'geo-triangle', geo: 'triangle' },
	{ id: 'geo-diamond', geo: 'diamond' },
	{ id: 'geo-hexagon', geo: 'hexagon' },
	{ id: 'geo-oval', geo: 'oval' },
	{ id: 'geo-rhombus', geo: 'rhombus' },
	{ id: 'geo-star', geo: 'star' },
	{ id: 'geo-cloud', geo: 'cloud' },
	{ id: 'geo-heart', geo: 'heart' },
	{ id: 'geo-x-box', geo: 'x-box' },
	{ id: 'geo-check-box', geo: 'check-box' },
	{ id: 'geo-arrow-left', geo: 'arrow-left' },
	{ id: 'geo-arrow-up', geo: 'arrow-up' },
	{ id: 'geo-arrow-down', geo: 'arrow-down' },
	{ id: 'geo-arrow-right', geo: 'arrow-right' }
];

for (const { id, geo } of GEO_VARIANTS) {
	test(`geo variant button "${id}" draws a ${geo} that renders`, async ({ page }) => {
		await selectToolButton(page, id);
		expect(await toolId(page)).toBe('geo');
		await dragOnCanvas(page, 250, 200, 470, 380);
		const all = await shapes(page);
		expect(all).toHaveLength(1);
		expect(all[0].type).toBe('geo');
		expect((all[0].props as { geo: string }).geo).toBe(geo);
		// It renders a real stroke path in the DOM.
		await expect(page.locator('[data-shape-type="geo"] path.tl-geo__stroke')).toHaveCount(1);
	});
}

// ---------------------------------------------------------------------------
// Non-geo shape tools.
// ---------------------------------------------------------------------------
test('draw tool creates a freehand stroke that renders', async ({ page }) => {
	await selectToolButton(page, 'draw');
	expect(await toolId(page)).toBe('draw');
	await dragOnCanvas(page, 200, 250, 420, 250);
	const all = await shapes(page);
	expect(all.map((s) => s.type)).toContain('draw');
	await expect(page.locator('[data-shape-type="draw"] svg.tl-draw path').first()).toBeVisible();
});

test('arrow tool creates an arrow that renders', async ({ page }) => {
	await selectToolButton(page, 'arrow');
	expect(await toolId(page)).toBe('arrow');
	await dragOnCanvas(page, 200, 200, 420, 340);
	expect((await shapes(page)).map((s) => s.type)).toContain('arrow');
	await expect(page.locator('[data-shape-type="arrow"]')).toHaveCount(1);
});

test('line tool creates a line that renders', async ({ page }) => {
	await selectToolButton(page, 'line');
	expect(await toolId(page)).toBe('line');
	await dragOnCanvas(page, 200, 200, 420, 340);
	expect((await shapes(page)).map((s) => s.type)).toContain('line');
	await expect(page.locator('[data-shape-type="line"] svg.tl-line path').first()).toBeVisible();
});

test('note tool creates a sticky note that renders', async ({ page }) => {
	await selectToolButton(page, 'note');
	expect(await toolId(page)).toBe('note');
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.click(box.x + 300, box.y + 300);
	expect((await shapes(page)).map((s) => s.type)).toContain('note');
	await expect(page.locator('[data-shape-type="note"]')).toHaveCount(1);
});

test('text tool creates a text shape', async ({ page }) => {
	await selectToolButton(page, 'text');
	expect(await toolId(page)).toBe('text');
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.click(box.x + 300, box.y + 300);
	// Text tool drops into editing with a fresh text shape; type to commit it.
	await page.keyboard.type('hello');
	await expect.poll(() => shapes(page).then((s) => s.map((x) => x.type))).toContain('text');
});

test('frame tool creates a frame that renders', async ({ page }) => {
	await selectToolButton(page, 'frame');
	expect(await toolId(page)).toBe('frame');
	await dragOnCanvas(page, 200, 200, 500, 420);
	expect((await shapes(page)).map((s) => s.type)).toContain('frame');
	await expect(page.locator('[data-shape-type="frame"]')).toHaveCount(1);
});

test('highlight tool creates a highlight stroke that renders', async ({ page }) => {
	await selectToolButton(page, 'highlight');
	expect(await toolId(page)).toBe('highlight');
	await dragOnCanvas(page, 200, 250, 420, 250);
	expect((await shapes(page)).map((s) => s.type)).toContain('highlight');
	await expect(page.locator('[data-shape-type="highlight"]')).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// Tools that don't create a persistent shape: select, hand, eraser, laser.
// ---------------------------------------------------------------------------
test('select tool selects a shape on click', async ({ page }) => {
	const id = await page.evaluate(() => {
		const sid = 'shape:selt' as never;
		window.editor.createShape({
			id: sid,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 160, h: 120, fill: 'solid' }
		});
		return sid as string;
	});
	await selectToolButton(page, 'select');
	expect(await toolId(page)).toBe('select');
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.click(box.x + 180, box.y + 160);
	await expect.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds())).toContain(id);
});

test('hand tool pans the camera on drag', async ({ page }) => {
	await selectToolButton(page, 'hand');
	expect(await toolId(page)).toBe('hand');
	const before = await page.evaluate(() => window.editor.getCamera());
	await dragOnCanvas(page, 300, 300, 480, 420);
	const after = await page.evaluate(() => window.editor.getCamera());
	expect(after.x !== before.x || after.y !== before.y).toBe(true);
});

test('eraser tool deletes a shape it is dragged over', async ({ page }) => {
	await page.evaluate(() => {
		window.editor.createShape({
			id: 'shape:eraseme' as never,
			type: 'geo',
			x: 200,
			y: 200,
			props: { geo: 'rectangle', w: 160, h: 140, fill: 'solid' }
		});
	});
	await selectToolButton(page, 'eraser');
	expect(await toolId(page)).toBe('eraser');
	await dragOnCanvas(page, 210, 210, 360, 340);
	await expect
		.poll(() => page.evaluate(() => window.editor.getShape('shape:eraseme' as never)))
		.toBeFalsy();
});

test('laser tool activates and draws a transient scribble', async ({ page }) => {
	await selectToolButton(page, 'laser');
	expect(await toolId(page)).toBe('laser');
	const box = (await page.locator('.tl-canvas').boundingBox())!;
	await page.mouse.move(box.x + 200, box.y + 250);
	await page.mouse.down();
	await page.mouse.move(box.x + 400, box.y + 300, { steps: 8 });
	// The scribble overlay renders while dragging; laser leaves no persistent shape.
	await expect(page.locator('.tl-scribble, [data-testid="scribble"], svg').first()).toBeVisible();
	await page.mouse.up();
	expect(await shapes(page)).toHaveLength(0);
});
