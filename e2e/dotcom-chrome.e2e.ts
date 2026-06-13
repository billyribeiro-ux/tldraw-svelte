import { expect, test } from '@playwright/test';

// The cosmetic tldraw.com chrome: top-left logo, top-right share + 'Sign in to
// share', bottom-right 'Made with tldraw' badge. These are visual-only look-alikes
// (no accounts/sharing backend) — the share/sign-in buttons raise an info toast.

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

test('the dotcom chrome (logo, share, sign-in, made-with badge) is present', async ({ page }) => {
	await expect(page.locator('.tlui-logo')).toBeVisible();
	await expect(page.locator('.tlui-logo')).toContainText('Dev Draw');
	await expect(page.getByTestId('share-button')).toBeVisible();
	await expect(page.getByTestId('sign-in-button')).toBeVisible();
	await expect(page.getByTestId('sign-in-button')).toContainText('Sign in to share');
	await expect(page.getByTestId('made-with-tldraw')).toBeVisible();
});

test('share / sign-in are cosmetic and raise an info toast', async ({ page }) => {
	await page.getByTestId('sign-in-button').click();
	await expect(page.getByTestId('toast')).toContainText('Sign in to share');
});
