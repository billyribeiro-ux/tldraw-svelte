import { expect, test, type Page } from '@playwright/test';

// DEEP FORENSIC: exercise every major user-facing function via REAL interaction
// (toolbar/menu clicks, canvas drags, keyboard, right-click) and assert on the
// resulting editor state AND/OR rendered DOM. No programmatic shortcuts for the
// action under test. Each failure here is a real, reproducible defect.

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.use({ viewport: { width: 1400, height: 900 } });

async function canvasBox(page: Page) {
	return (await page.locator('.tl-canvas').boundingBox())!;
}

/** Draw a geo rectangle via the toolbar + a real drag; returns its id. */
async function drawRect(page: Page, x1: number, y1: number, x2: number, y2: number) {
	await page.locator('.tlui-toolbar [data-tool="geo-rectangle"]').click();
	const b = await canvasBox(page);
	await page.mouse.move(b.x + x1, b.y + y1);
	await page.mouse.down();
	await page.mouse.move(b.x + x2, b.y + y2, { steps: 8 });
	await page.mouse.up();
	return page.evaluate(() => window.editor.getSelectedShapeIds()[0] as string);
}

const props = (page: Page, id: string) =>
	page.evaluate((i) => window.editor.getShape(i as never)?.props as Record<string, unknown>, id);
const count = (page: Page) => page.evaluate(() => window.editor.getCurrentPageShapes().length);

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
	await page.evaluate(() => {
		window.editor.selectAll();
		window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		window.editor.setCurrentTool('select');
	});
});

// ---------------------------------------------------------------------------
// STYLE PANEL — every picker via real clicks, asserting the rendered DOM.
// ---------------------------------------------------------------------------
test.describe('style panel (real clicks -> rendered DOM)', () => {
	test('color updates the rendered stroke color', async ({ page }) => {
		const id = await drawRect(page, 200, 200, 400, 360);
		await page.getByTestId('style.color.red').click();
		await expect.poll(() => props(page, id).then((p) => p.color)).toBe('red');
		const stroke = await page
			.locator('[data-shape-type="geo"] path.tl-geo__stroke')
			.first()
			.getAttribute('stroke');
		expect(stroke).not.toBe('');
	});

	test('fill solid renders a fill path', async ({ page }) => {
		await drawRect(page, 200, 200, 400, 360);
		await page.getByTestId('style.fill.solid').click();
		await expect(page.locator('[data-shape-type="geo"] path.tl-geo__fill')).toHaveCount(1);
	});

	test('dash dotted updates the record and stroke-dasharray', async ({ page }) => {
		const id = await drawRect(page, 200, 200, 400, 360);
		await page.getByTestId('style.dash.dotted').click();
		await expect.poll(() => props(page, id).then((p) => p.dash)).toBe('dotted');
		const da = await page
			.locator('[data-shape-type="geo"] path.tl-geo__stroke')
			.first()
			.getAttribute('stroke-dasharray');
		expect(da).toBeTruthy();
	});

	test('size XL thickens the rendered stroke', async ({ page }) => {
		await drawRect(page, 200, 200, 400, 360);
		const sw = () =>
			page
				.locator('[data-shape-type="geo"] path.tl-geo__stroke')
				.first()
				.evaluate((el) => parseFloat(el.getAttribute('stroke-width')!));
		const before = await sw();
		await page.getByTestId('style.size.xl').click();
		await expect.poll(sw).toBeGreaterThan(before);
	});
});

// ---------------------------------------------------------------------------
// SELECTION & TRANSFORM — brush, multi-select, move, resize, rotate.
// ---------------------------------------------------------------------------
test.describe('selection & transform', () => {
	test('brush-select drags a box over shapes to select them', async ({ page }) => {
		await drawRect(page, 150, 150, 250, 250);
		await drawRect(page, 300, 150, 400, 250);
		await page.keyboard.press('Escape');
		await page.locator('.tlui-toolbar [data-tool="select"]').click();
		await page.evaluate(() => window.editor.selectNone());
		const b = await canvasBox(page);
		// Brush from empty space across both shapes.
		await page.mouse.move(b.x + 120, b.y + 120);
		await page.mouse.down();
		await page.mouse.move(b.x + 430, b.y + 280, { steps: 10 });
		await page.mouse.up();
		await expect
			.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds().length))
			.toBe(2);
	});

	test('resize handle makes a shape bigger', async ({ page }) => {
		const id = await drawRect(page, 200, 200, 360, 320);
		const before = await page.evaluate(
			(i) => window.editor.getShapeGeometry(window.editor.getShape(i as never)!).bounds.width,
			id
		);
		// Drag the bottom-right corner handle outward.
		const handle = page.locator('[data-handle="bottom_right"]');
		await expect(handle).toBeVisible();
		const hb = (await handle.boundingBox())!;
		await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
		await page.mouse.down();
		await page.mouse.move(hb.x + 120, hb.y + 120, { steps: 10 });
		await page.mouse.up();
		const after = await page.evaluate(
			(i) => window.editor.getShapeGeometry(window.editor.getShape(i as never)!).bounds.width,
			id
		);
		expect(after).toBeGreaterThan(before);
	});

	test('rotate handle rotates the selection', async ({ page }) => {
		const id = await drawRect(page, 250, 250, 400, 380);
		// The rotate region just outside the top-right corner (newly wired up).
		const handle = page.locator('[data-handle="top_right_rotate"]');
		await expect(handle).toBeVisible();
		const hb = (await handle.boundingBox())!;
		// Drag it in an arc around the shape centre to rotate.
		await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
		await page.mouse.down();
		await page.mouse.move(hb.x + 120, hb.y + 90, { steps: 12 });
		await page.mouse.up();
		await expect
			.poll(() => page.evaluate((i) => window.editor.getShape(i as never)?.rotation, id))
			.not.toBe(0);
	});
});

// ---------------------------------------------------------------------------
// QUICK ACTIONS — undo / redo / delete / duplicate (real clicks).
// ---------------------------------------------------------------------------
test.describe('quick actions', () => {
	test('delete removes the selected shape', async ({ page }) => {
		await drawRect(page, 200, 200, 360, 320);
		expect(await count(page)).toBe(1);
		await page.locator('[data-action="delete"]').click();
		await expect.poll(() => count(page)).toBe(0);
	});

	test('duplicate makes a second shape', async ({ page }) => {
		await drawRect(page, 200, 200, 360, 320);
		await page.locator('[data-action="duplicate"]').click();
		await expect.poll(() => count(page)).toBe(2);
	});

	test('undo then redo reverts and re-applies', async ({ page }) => {
		await drawRect(page, 200, 200, 360, 320);
		expect(await count(page)).toBe(1);
		await page.locator('[data-action="undo"]').click();
		await expect.poll(() => count(page)).toBe(0);
		await page.locator('[data-action="redo"]').click();
		await expect.poll(() => count(page)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// CLIPBOARD — copy / paste / cut via keyboard.
// ---------------------------------------------------------------------------
test.describe('clipboard', () => {
	test('copy + paste duplicates via keyboard', async ({ page }) => {
		await drawRect(page, 200, 200, 360, 320);
		await page.keyboard.press('Control+c');
		await page.keyboard.press('Control+v');
		await expect.poll(() => count(page)).toBeGreaterThanOrEqual(2);
	});
});

// ---------------------------------------------------------------------------
// ACTIONS MENU — rotate clockwise (real click); flip lives in the context menu.
// ---------------------------------------------------------------------------
test.describe('actions menu', () => {
	test('rotate clockwise rotates the selection', async ({ page }) => {
		const id = await drawRect(page, 200, 200, 400, 320);
		await page.getByTestId('actions-menu.button').click();
		await page.getByTestId('actions-menu').locator('[data-action="rotate-cw"]').click();
		await expect
			.poll(() => page.evaluate((i) => window.editor.getShape(i as never)?.rotation, id))
			.not.toBe(0);
	});

	test('flip horizontal (context menu) mirrors a multi-selection', async ({ page }) => {
		// Flip on a single axis-aligned shape is a visual no-op, so use two shapes:
		// flipping horizontally swaps their left/right positions.
		const id1 = await drawRect(page, 150, 200, 250, 300);
		await drawRect(page, 430, 200, 530, 300);
		await page.keyboard.press('Control+a');
		await expect
			.poll(() => page.evaluate(() => window.editor.getSelectedShapeIds().length))
			.toBe(2);
		const x1 = await page.evaluate((i) => window.editor.getShape(i as never)!.x, id1);
		await page.locator('.tl-canvas').click({ button: 'right', position: { x: 480, y: 250 } });
		await expect(page.getByTestId('context-menu')).toBeVisible();
		await page.getByRole('menuitem', { name: 'Flip horizontal' }).click();
		await expect
			.poll(() => page.evaluate((i) => window.editor.getShape(i as never)!.x, id1))
			.not.toBe(x1);
	});
});

// ---------------------------------------------------------------------------
// PAGES — create / switch / via the page menu (real clicks).
// ---------------------------------------------------------------------------
test.describe('pages', () => {
	test('create a new page adds and switches to it', async ({ page }) => {
		const before = await page.evaluate(() => window.editor.getPages().length);
		await page.getByTestId('page-menu.button').click();
		await page.getByTestId('page-menu.create').click();
		await expect.poll(() => page.evaluate(() => window.editor.getPages().length)).toBe(before + 1);
	});
});

// ---------------------------------------------------------------------------
// ZOOM / NAVIGATION (real clicks).
// ---------------------------------------------------------------------------
test.describe('zoom & navigation', () => {
	// The +/- buttons live in the navigation panel, revealed by expanding the
	// (collapsed-by-default, tldraw-faithful) minimap.
	async function expandMinimap(page: Page) {
		if ((await page.getByTestId('nav.zoom-in').count()) === 0) {
			await page.getByTestId('minimap.toggle-button').click();
		}
		await expect(page.getByTestId('nav.zoom-in')).toBeVisible();
	}

	test('zoom-in button increases zoom', async ({ page }) => {
		await expandMinimap(page);
		const before = await page.evaluate(() => window.editor.getZoomLevel());
		await page.getByTestId('nav.zoom-in').click();
		await expect
			.poll(() => page.evaluate(() => window.editor.getZoomLevel()))
			.toBeGreaterThan(before);
	});

	test('zoom-out button decreases zoom', async ({ page }) => {
		await expandMinimap(page);
		const before = await page.evaluate(() => window.editor.getZoomLevel());
		await page.getByTestId('nav.zoom-out').click();
		await expect.poll(() => page.evaluate(() => window.editor.getZoomLevel())).toBeLessThan(before);
	});
});

// ---------------------------------------------------------------------------
// CONTEXT MENU (right-click) -> delete.
// ---------------------------------------------------------------------------
test.describe('context menu', () => {
	test('right-click a shape and delete removes it', async ({ page }) => {
		await drawRect(page, 200, 200, 360, 320);
		await page.locator('.tl-canvas').click({ button: 'right', position: { x: 280, y: 260 } });
		await expect(page.getByTestId('context-menu')).toBeVisible();
		await page.getByRole('menuitem', { name: 'Delete' }).click();
		await expect.poll(() => count(page)).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// DARK MODE — via the main menu (real clicks), asserting the theme class.
// ---------------------------------------------------------------------------
test.describe('dark mode', () => {
	test('toggling dark mode flips the editor theme class', async ({ page }) => {
		const isDark = () => page.locator('.tl-container.tl-theme__dark').count();
		expect(await isDark()).toBe(0);
		await page.getByTestId('main-menu.button').click();
		await page.getByRole('menuitemcheckbox', { name: /dark mode/i }).click();
		await expect.poll(isDark).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// TEXT EDITING — double-click a shape to edit its label, type, commit.
// ---------------------------------------------------------------------------
test.describe('label editing', () => {
	test('double-click a box enters edit mode and typed text commits', async ({ page }) => {
		const id = await drawRect(page, 250, 250, 500, 420);
		const b = await canvasBox(page);
		await page.mouse.dblclick(b.x + 375, b.y + 335);
		await expect.poll(() => page.evaluate(() => window.editor.getEditingShapeId())).toBe(id);
		await page.keyboard.type('Label!');
		await expect
			.poll(() =>
				page.evaluate((i) => JSON.stringify(window.editor.getShape(i as never)?.props), id)
			)
			.toContain('Label!');
	});
});

// ---------------------------------------------------------------------------
// PERSISTENCE — a reload keeps the drawing.
// ---------------------------------------------------------------------------
test.describe('persistence', () => {
	test('shapes survive a page reload (with a ?doc= key)', async ({ page }) => {
		// The route persists to IndexedDB only when a ?doc= key is present.
		const url = '/?doc=e2e-deep-persist-' + Date.now();
		await page.goto(url);
		await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
		await page.evaluate(() => {
			window.editor.selectAll();
			window.editor.deleteShapes(window.editor.getSelectedShapeIds());
		});
		await drawRect(page, 200, 200, 360, 320);
		await expect.poll(() => count(page)).toBe(1);
		// Let the debounced IndexedDB write flush before reloading.
		await page.waitForTimeout(1200);
		await page.goto(url);
		await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
		await expect.poll(() => count(page)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// GRID / SNAP / FRAME-RENAME — newly wired-up overlays + editing.
// ---------------------------------------------------------------------------
test.describe('grid, snap & frame rename', () => {
	test('grid renders when grid mode is on', async ({ page }) => {
		expect(await page.locator('.tl-grid').count()).toBe(0);
		await page.evaluate(() => window.editor.updateInstanceState({ isGridMode: true }));
		await expect(page.locator('.tl-grid')).toHaveCount(1);
	});

	test('snap indicators render while dragging an aligned shape (snap mode)', async ({ page }) => {
		await page.evaluate(() => {
			window.editor.user.updateUserPreferences({ isSnapMode: true });
			window.editor.createShape({
				id: 'shape:ref' as never,
				type: 'geo',
				x: 500,
				y: 200,
				props: { geo: 'rectangle', w: 120, h: 120 }
			});
			window.editor.createShape({
				id: 'shape:mov' as never,
				type: 'geo',
				x: 500,
				y: 450,
				props: { geo: 'rectangle', w: 120, h: 120 }
			});
			window.editor.setSelectedShapes(['shape:mov' as never]);
		});
		const b = await canvasBox(page);
		await page.mouse.move(b.x + 560, b.y + 510);
		await page.mouse.down();
		await page.mouse.move(b.x + 566, b.y + 470, { steps: 12 });
		await page.mouse.move(b.x + 560, b.y + 462, { steps: 8 });
		await expect
			.poll(() => page.locator('.tl-snaps line, .tl-snaps polyline').count())
			.toBeGreaterThan(0);
		await page.mouse.up();
	});

	test('double-click a frame heading renames the frame', async ({ page }) => {
		await page.evaluate(() => {
			window.editor.createShape({
				id: 'shape:fr' as never,
				type: 'frame',
				x: 200,
				y: 200,
				props: { w: 300, h: 200 }
			});
		});
		await page.locator('[data-shape-id="shape:fr"] .tl-frame__heading').dblclick();
		const input = page.locator('[data-shape-id="shape:fr"] input.tl-frame__heading--input');
		await expect(input).toBeVisible();
		await input.fill('My Frame');
		await page.keyboard.press('Enter');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window.editor.getShape('shape:fr' as never)?.props as { name: string }).name
				)
			)
			.toBe('My Frame');
	});
});

// ---------------------------------------------------------------------------
// POPOVER VIEWPORT-FIT — the top-right style panel's "Shape" dropdown sits near
// the screen bottom; opening it must not run off-screen (it flips up / clamps).
// ---------------------------------------------------------------------------
test.describe('popover stays on screen', () => {
	test('the "Shape" dropdown opens fully within the viewport', async ({ page }) => {
		const vp = page.viewportSize()!;
		await drawRect(page, 80, 80, 220, 180);
		await page.getByTestId('style.geo').click();
		const menu = page.locator('.tlui-style-dropdown__grid');
		await expect(menu).toBeVisible();
		const r = await menu.evaluate((el) => {
			const b = el.getBoundingClientRect();
			return { top: b.top, left: b.left, right: b.right, bottom: b.bottom };
		});
		// Fully on screen (small tolerance).
		expect(r.top).toBeGreaterThanOrEqual(-1);
		expect(r.left).toBeGreaterThanOrEqual(-1);
		expect(r.right).toBeLessThanOrEqual(vp.width + 1);
		expect(r.bottom).toBeLessThanOrEqual(vp.height + 1);
		// And the options are reachable.
		await expect(page.getByTestId('style.geo.ellipse')).toBeVisible();
	});
});
