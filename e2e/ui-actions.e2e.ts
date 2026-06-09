import { expect, test } from '@playwright/test';

// Evidence for the QuickActions + ActionsMenu + ToggleToolLocked + mobile style
// panel — the always-visible action affordances tldraw shows, wired to the real
// editor with the real disabled rules and responsive behaviour.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		window.editor.setCurrentTool('select');
	});
});

test('quick actions: delete/duplicate disabled with no selection, enabled with one', async ({
	page
}) => {
	const del = page.locator('.tlui-quick-actions [data-action="delete"]');
	await expect(del).toBeDisabled();

	await page.evaluate(() => {
		const id = 'shape:qa' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 60,
			y: 60,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
		window.editor.setSelectedShapes([id]);
	});
	await expect(del).toBeEnabled();
	await del.click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(0);
});

test('quick actions: undo enables after an edit and reverts it', async ({ page }) => {
	const undo = page.locator('.tlui-quick-actions [data-action="undo"]');
	await page.evaluate(() => {
		window.editor.markHistoryStoppingPoint();
		window.editor.createShape({
			id: 'shape:u1' as never,
			type: 'geo',
			x: 40,
			y: 40,
			props: { geo: 'rectangle', w: 60, h: 60 }
		});
	});
	await expect(undo).toBeEnabled();
	await undo.click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(0);
});

test('actions menu: align is disabled for <2 shapes, fires for 2+', async ({ page }) => {
	await page.evaluate(() => {
		window.editor.createShape({
			id: 'shape:a1' as never,
			type: 'geo',
			x: 0,
			y: 0,
			props: { geo: 'rectangle', w: 60, h: 60 }
		});
		window.editor.createShape({
			id: 'shape:a2' as never,
			type: 'geo',
			x: 200,
			y: 80,
			props: { geo: 'rectangle', w: 60, h: 60 }
		});
		window.editor.setSelectedShapes(['shape:a1' as never]);
	});
	await page.getByTestId('actions-menu.button').click();
	const alignLeft = page.getByTestId('actions-menu').locator('[data-action="align-left"]');
	await expect(alignLeft).toBeDisabled(); // only 1 selected

	// Select both → align enabled, and clicking aligns their left edges.
	await page.evaluate(() =>
		window.editor.setSelectedShapes(['shape:a1' as never, 'shape:a2' as never])
	);
	await expect(alignLeft).toBeEnabled();
	await alignLeft.click();
	const xs = await page.evaluate(() => {
		const a = window.editor.getShape('shape:a1' as never)!;
		const b = window.editor.getShape('shape:a2' as never)!;
		return [(a as { x: number }).x, (b as { x: number }).x];
	});
	expect(xs[0]).toBeCloseTo(xs[1], 1);
});

test('tool lock toggle appears for a shape tool and flips isToolLocked', async ({ page }) => {
	// No lock button while on the select tool.
	await expect(page.getByTestId('toolbar.tool-lock')).toHaveCount(0);
	// Switch to the rectangle (geo) tool → lock button appears.
	await page.locator('.tlui-toolbar [data-tool="geo-rectangle"]').click();
	const lock = page.getByTestId('toolbar.tool-lock');
	await expect(lock).toBeVisible();
	await lock.click();
	await expect
		.poll(() => page.evaluate(() => window.editor.getInstanceState().isToolLocked))
		.toBe(true);
});

test('on a narrow viewport the style panel collapses to a mobile swatch button', async ({
	page
}) => {
	await page.setViewportSize({ width: 500, height: 800 });
	await page.evaluate(() => {
		const id = 'shape:m1' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 60,
			y: 60,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
		window.editor.setSelectedShapes([id]);
	});
	// Desktop panel hidden, mobile swatch shown.
	await expect(page.getByTestId('style-panel')).toHaveCount(0);
	const swatch = page.getByTestId('mobile-style.button');
	await expect(swatch).toBeVisible();
	// Opening it reveals the full style panel content.
	await swatch.click();
	await expect(page.getByTestId('mobile-style.panel')).toBeVisible();
	await expect(page.getByTestId('mobile-style.panel').getByTestId('style.color')).toBeVisible();
});
