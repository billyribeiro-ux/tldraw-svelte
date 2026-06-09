import { expect, test } from '@playwright/test';

// Evidence for the LanguageMenu — tldraw's default UI renders a Language submenu in
// both the Help menu and the Main menu, listing every shipped locale and setting the
// editor's user locale. This is the structural parity piece (string translation of
// every label is a separate content effort).

declare global {
	interface Window {
		editor: import('@tldraw/editor').Editor;
	}
}

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	await page.waitForFunction(() => !!window.editor, undefined, { timeout: 15000 });
});

test('the help menu has a Language submenu that sets the editor locale', async ({ page }) => {
	await page.getByTestId('help-menu.button').click();
	// Open the Language submenu (the submenu trigger is a plain menuitem).
	await page.getByRole('menuitem', { name: 'Language' }).click();
	// Each locale row is a checkbox item (it carries a checked state); pick German.
	await page.getByRole('menuitemcheckbox', { name: 'Deutsch' }).click();
	await expect.poll(() => page.evaluate(() => window.editor.user.getLocale())).toBe('de');
});

test('the language submenu marks the current locale', async ({ page }) => {
	await page.evaluate(() => window.editor.user.updateUserPreferences({ locale: 'fr' }));
	await page.getByTestId('help-menu.button').click();
	await page.getByRole('menuitem', { name: 'Language' }).click();
	// The French row is checked (role menuitemcheckbox, aria-checked true).
	const french = page.getByRole('menuitemcheckbox', { name: 'Français' });
	await expect(french).toHaveAttribute('aria-checked', 'true');
});
