import { expect, test } from '@playwright/test';

// Phase D evidence: the from-scratch StyleProp style panel reads the editor's REAL
// shared styles and writes them via setStyleForSelectedShapes + setStyleForNextShapes
// — the exact StyleProps the converted shapes declare. Changing a style updates the
// shape record AND is remembered for the next shape. No third-party UI library.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

async function selectNewGeo(page: import('@playwright/test').Page, id: string) {
	await page.evaluate((sid) => {
		const shapeId = sid as Parameters<typeof window.editor.getShape>[0];
		window.editor.markHistoryStoppingPoint();
		window.editor.createShape({
			id: shapeId,
			type: 'geo',
			x: 40,
			y: 40,
			props: { geo: 'rectangle', w: 100, h: 80 }
		});
		window.editor.setSelectedShapes([shapeId]);
	}, id);
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

test('the style panel shows next-shape defaults, then the selected shape pickers', async ({
	page
}) => {
	// tldraw shows the panel even on the select tool with nothing selected (seeded
	// from next-shape defaults: color/dash/fill/size), but NOT the geo dropdown.
	const panel = page.getByTestId('style-panel');
	await expect(panel).toBeVisible();
	await expect(panel.getByTestId('style.size')).toBeVisible();
	await expect(panel.getByTestId('style.geo')).toHaveCount(0); // no shape selected yet

	// Selecting a geo shape narrows it to that shape's full style set incl. geo.
	await selectNewGeo(page, 'shape:sp1');
	await expect(panel).toBeVisible();
	await expect(panel.getByTestId('style.color')).toBeVisible();
	await expect(panel.getByTestId('style.fill')).toBeVisible();
	await expect(panel.getByTestId('style.dash')).toBeVisible();
	await expect(panel.getByTestId('style.size')).toBeVisible();
	await expect(panel.getByTestId('style.geo')).toBeVisible();
});

test('changing color writes DefaultColorStyle to the selected shape', async ({ page }) => {
	await selectNewGeo(page, 'shape:sp2');
	await page.getByTestId('style.color.blue').click();
	await expect
		.poll(() =>
			page.evaluate(() => window.editor.getShape('shape:sp2' as never)?.props as { color: string })
		)
		.toMatchObject({ color: 'blue' });
});

test('changing fill + size updates the shape record', async ({ page }) => {
	await selectNewGeo(page, 'shape:sp3');
	await page.getByTestId('style.fill.solid').click();
	await page.getByTestId('style.size.xl').click();
	await expect
		.poll(() =>
			page.evaluate(
				() => window.editor.getShape('shape:sp3' as never)?.props as { fill: string; size: string }
			)
		)
		.toMatchObject({ fill: 'solid', size: 'xl' });
});

test('opacity slider sets the shape opacity', async ({ page }) => {
	await selectNewGeo(page, 'shape:sp4');
	const slider = page.getByTestId('style.opacity').getByRole('slider');
	await slider.fill('0.5');
	await expect
		.poll(() => page.evaluate(() => window.editor.getShape('shape:sp4' as never)?.opacity))
		.toBe(0.5);
});

test('the active option is highlighted from the shared style value', async ({ page }) => {
	await selectNewGeo(page, 'shape:sp5');
	const dashDashed = page.getByTestId('style.dash.dashed');
	await dashDashed.click();
	await expect(dashDashed).toHaveAttribute('aria-checked', 'true');
});

test('style choice is remembered for the next shape (setStyleForNextShapes)', async ({ page }) => {
	await selectNewGeo(page, 'shape:sp6');
	await page.getByTestId('style.color.red').click();
	// Deselect, then draw a brand-new shape with the geo tool — it should inherit red.
	await page.evaluate(() => window.editor.selectNone());
	await page.evaluate(() => {
		const id = 'shape:sp6b' as Parameters<typeof window.editor.getShape>[0];
		window.editor.markHistoryStoppingPoint();
		window.editor.createShape({
			id,
			type: 'geo',
			x: 200,
			y: 40,
			props: { geo: 'ellipse', w: 60, h: 60 }
		});
	});
	await expect
		.poll(() =>
			page.evaluate(
				() => (window.editor.getShape('shape:sp6b' as never)?.props as { color: string })?.color
			)
		)
		.toBe('red');
});

test('the style panel shows while a drawing tool is active, so thickness is set before drawing', async ({
	page
}) => {
	// Regression for the "line thickness not working" bug: tldraw shows the style
	// panel when a shape tool is active (not just on selection), seeded from the
	// next-shape styles — so you can pick the size BEFORE drawing.
	await page.evaluate(() => window.editor.setCurrentTool('draw'));
	const panel = page.getByTestId('style-panel');
	await expect(panel).toBeVisible();
	await expect(panel.getByTestId('style.size')).toBeVisible();

	// Pick XL, then draw a stroke — it must come out thick (size = xl).
	await page.getByTestId('style.size.xl').click();
	await page.evaluate(() => window.editor.setCurrentTool('draw'));
	const canvas = page.locator('.tl-canvas');
	await canvas.hover({ position: { x: 300, y: 300 } });
	await page.mouse.down();
	await page.mouse.move(400, 300);
	await page.mouse.up();
	await expect
		.poll(() =>
			page.evaluate(
				() => (window.editor.getCurrentPageShapes()[0]?.props as { size?: string })?.size
			)
		)
		.toBe('xl');
});
