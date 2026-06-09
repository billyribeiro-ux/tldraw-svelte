import { expect, test } from '@playwright/test';

// Phase G evidence: the from-scratch SVG exporter composes each shape's real
// Geometry2d outline + page transform + resolved theme color into an <svg> string
// and downloads it. No third-party library, no React exportToSvg.

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

test('exporting the page downloads a valid SVG containing the shape geometry', async ({ page }) => {
	await page.evaluate(() => {
		const id = 'shape:exp' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id,
			type: 'geo',
			x: 100,
			y: 100,
			props: { geo: 'rectangle', w: 120, h: 90, color: 'blue', fill: 'solid' }
		});
	});

	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: 'Export as SVG' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('tldraw-export.svg');

	// Read the downloaded bytes and assert it is a real SVG with a path + the
	// resolved blue stroke from the theme.
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const svg = Buffer.concat(chunks).toString('utf8');

	expect(svg).toContain('<svg');
	expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
	expect(svg).toContain('<path');
	expect(svg).toContain('viewBox=');
	// Blue solid in the default light theme is #4465e9.
	expect(svg.toLowerCase()).toContain('#4465e9');

	// A success toast confirms the export.
	await expect(page.getByTestId('toast')).toContainText('Exported as SVG');
});

test('exporting only the selection limits the SVG to selected shapes', async ({ page }) => {
	await page.evaluate(() => {
		const a = 'shape:a' as Parameters<typeof window.editor.getShape>[0];
		const b = 'shape:b' as Parameters<typeof window.editor.getShape>[0];
		window.editor.createShape({
			id: a,
			type: 'geo',
			x: 0,
			y: 0,
			props: { geo: 'rectangle', w: 50, h: 50 }
		});
		window.editor.createShape({
			id: b,
			type: 'geo',
			x: 400,
			y: 400,
			props: { geo: 'ellipse', w: 50, h: 50 }
		});
		window.editor.setSelectedShapes([a]);
	});

	const downloadPromise = page.waitForEvent('download');
	await page.getByTestId('main-menu.button').click();
	await page.getByRole('menuitem', { name: 'Export as SVG' }).click();
	const download = await downloadPromise;

	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(chunk as Buffer);
	const svg = Buffer.concat(chunks).toString('utf8');

	// Only one shape selected → exactly one <g> group in the export.
	const groups = svg.match(/<g /g) ?? [];
	expect(groups.length).toBe(1);
});
