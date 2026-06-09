import { expect, test } from '@playwright/test';

// Phase A evidence: the FROM-SCRATCH UI primitives (no Bits UI/Radix) behave —
// button click, popover open/select + click-outside close, slider change, dialog
// open/focus/escape-close.

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/primitives');
});

test('button click fires', async ({ page }) => {
	await page.getByRole('button', { name: 'Primary' }).click();
	await expect(page.locator('[data-test="last-action"]')).toHaveText('primary');
});

test('popover opens, selects an item, and closes on outside click', async ({ page }) => {
	await page.locator('[data-test="popover-trigger"]').click();
	await expect(page.getByRole('menu')).toBeVisible();
	await page.getByRole('menuitem', { name: /Item A/ }).click();
	await expect(page.locator('[data-test="last-action"]')).toHaveText('item-a');

	// reopen, then click outside to close
	await page.locator('[data-test="popover-trigger"]').click();
	await expect(page.getByRole('menu')).toBeVisible();
	await page.locator('h1').click();
	await expect(page.getByRole('menu')).toHaveCount(0);
});

test('slider changes value', async ({ page }) => {
	const slider = page.getByRole('slider', { name: 'Opacity' });
	await slider.fill('5');
	await expect(page.locator('[data-test="slider-value"]')).toHaveText('5');
});

test('dialog opens, focuses input, and closes on Escape', async ({ page }) => {
	await page.locator('[data-test="open-dialog"]').click();
	const dialog = page.getByRole('dialog', { name: 'Test dialog' });
	await expect(dialog).toBeVisible();
	// focus moved into the dialog (the input is the first focusable)
	await expect(page.locator('[data-test="dialog-input"]')).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.locator('[data-test="last-action"]')).toHaveText('dialog-closed');
});
