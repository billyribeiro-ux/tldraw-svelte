import { expect, test } from '@playwright/test';

// Phase F evidence: the from-scratch Toasts viewport + a11y live region are wired
// into the UI root. An action raises a toast that auto-dismisses and is manually
// dismissible; switching tools updates the aria-live region. No third-party
// toast/dialog library (Dialog primitive is the from-scratch one from Phase A).

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

test('the export action raises a toast (with no shapes: a warning)', async ({ page }) => {
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: 'Export as SVG' }).click();
	const toast = page.getByTestId('toast');
	await expect(toast).toBeVisible();
	await expect(toast).toContainText('Nothing to export');
});

test('a toast can be dismissed manually', async ({ page }) => {
	// With a shape present, export raises an info toast (kept long enough to dismiss).
	await page.evaluate(() => {
		const id = 'shape:tst' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 40,
			y: 40,
			props: { geo: 'rectangle', w: 80, h: 60 }
		});
	});
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: 'Export as SVG' }).click();
	const toast = page.getByTestId('toast');
	await expect(toast).toBeVisible();
	await toast.getByRole('button', { name: 'Dismiss notification' }).click();
	await expect(toast).toHaveCount(0);
});

test('the a11y live region announces the current tool', async ({ page }) => {
	const region = page.getByTestId('a11y-live-region');
	await expect(region).toHaveAttribute('aria-live', 'polite');
	await page.locator('.tlui-toolbar [data-tool="draw"]').click();
	await expect.poll(() => region.innerText()).toContain('Draw tool');
	await page.locator('.tlui-toolbar [data-tool="arrow"]').click();
	await expect.poll(() => region.innerText()).toContain('Arrow tool');
});
