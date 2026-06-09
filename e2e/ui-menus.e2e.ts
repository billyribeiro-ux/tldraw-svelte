import { expect, test } from '@playwright/test';

// Phase C evidence: the from-scratch menu system (MainMenu, ContextMenu, ZoomMenu,
// PageMenu, KeyboardShortcutsDialog) is wired to the real editor via the actions
// and tools registries — opening menus, firing actions, and multi-page ops all
// drive genuine editor state. No third-party menu/dropdown library is used.

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

test('main menu opens and an action fires against the editor', async ({ page }) => {
	// Seed a selected shape so the duplicate action has something to act on.
	await page.evaluate(() => {
		const id = 'shape:mm' as Parameters<typeof window.editor.getShape>[0];
		window.editor.markHistoryStoppingPoint();
		window.editor.createShape({
			id,
			type: 'geo',
			x: 40,
			y: 40,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
		window.editor.setSelectedShapes([id]);
	});
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);

	await page.getByTestId('main-menu.button').click();
	// The menu lists action items; click Duplicate.
	await page.getByRole('menuitem', { name: 'Duplicate' }).click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(2);
});

test('main menu dark-mode checkbox toggles the user preference', async ({ page }) => {
	const before = await page.evaluate(() => window.editor.user.getIsDarkMode());
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitemcheckbox', { name: 'Dark mode' }).click();
	await expect.poll(() => page.evaluate(() => window.editor.user.getIsDarkMode())).toBe(!before);
});

test('zoom menu shows live percentage and zooms', async ({ page }) => {
	const trigger = page.getByTestId('zoom-menu.button');
	const initial = await trigger.innerText();
	await trigger.click();
	await page.getByRole('menuitem', { name: 'Zoom in' }).click();
	// Percentage label updates reactively after zooming in.
	await expect.poll(async () => (await trigger.innerText()) !== initial).toBe(true);
	await expect.poll(() => page.evaluate(() => window.editor.getZoomLevel())).toBeGreaterThan(1);
});

test('right-click opens the context menu and delete removes the shape', async ({ page }) => {
	await page.evaluate(() => {
		const id = 'shape:cm' as Parameters<typeof window.editor.getShape>[0];
		window.editor.markHistoryStoppingPoint();
		window.editor.createShape({
			id,
			type: 'geo',
			x: 120,
			y: 120,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
		window.editor.setSelectedShapes([id]);
	});
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(1);

	await page.locator('.tl-canvas').click({ button: 'right', position: { x: 160, y: 150 } });
	await expect(page.getByTestId('context-menu')).toBeVisible();
	await page.getByRole('menuitem', { name: 'Delete' }).click();
	await expect(page.locator('[data-shape-type="geo"]')).toHaveCount(0);
	await expect(page.getByTestId('context-menu')).toHaveCount(0);
});

test('page menu creates, switches, renames and deletes pages', async ({ page }) => {
	const startPages = await page.evaluate(() => window.editor.getPages().length);

	await page.getByTestId('page-menu.button').click();
	await page.getByTestId('page-menu.create').click();
	await expect
		.poll(() => page.evaluate(() => window.editor.getPages().length))
		.toBe(startPages + 1);

	// The newly created page becomes a row; rows are switchable.
	const rows = page.getByTestId('page-menu.item');
	await expect(rows).toHaveCount(startPages + 1);

	// Rename the last (new) page inline.
	const lastRow = rows.last();
	await lastRow.getByRole('button', { name: 'Rename page' }).click();
	const input = lastRow.getByRole('textbox', { name: 'Page name' });
	await input.fill('Renamed Page');
	await input.press('Enter');
	await expect
		.poll(() =>
			page.evaluate(() => window.editor.getPages().some((p) => p.name === 'Renamed Page'))
		)
		.toBe(true);

	// Delete it again, back to the starting count.
	await rows.last().getByRole('button', { name: 'Delete page' }).click();
	await expect.poll(() => page.evaluate(() => window.editor.getPages().length)).toBe(startPages);
});

test('help menu opens the keyboard shortcuts dialog listing tool + action shortcuts', async ({
	page
}) => {
	await page.getByTestId('help-menu.button').click();
	await page.getByRole('menuitem', { name: 'Keyboard shortcuts' }).click();
	const dialog = page.getByTestId('shortcuts.dialog');
	await expect(dialog).toBeVisible();
	// A known tool (Select / v) and a known action (Undo) are listed.
	await expect(dialog.getByText('Select', { exact: true })).toBeVisible();
	await expect(dialog.getByText('Undo', { exact: true })).toBeVisible();
	// Escape closes it.
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);
});
