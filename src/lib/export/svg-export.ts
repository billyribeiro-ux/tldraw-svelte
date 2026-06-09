import type { Editor, TLShapeId, TLShape } from '@tldraw/editor';
import { Box, getColorValue } from '@tldraw/editor';

/**
 * From-scratch SVG export (replaces tldraw's React `exportToSvg`, which rendered
 * shapes via react-dom). Rather than re-running each shape's React `toSvg` (those
 * are stripped in this port), this composes the SAME engine data the Svelte
 * renderers use — each shape's `Geometry2d` outline (`toSimpleSvgPath`), its page
 * transform (`getShapePageTransform`), and its resolved theme color — into a single
 * `<svg>` string. It is a faithful vector outline of the selection/page, built with
 * zero third-party libraries.
 *
 * This intentionally exports geometry outlines (stroke + optional fill), not the
 * per-shape decorative rendering (freehand pressure, dash patterns, rich-text
 * labels). Those are a follow-up; the export path, bounds, transforms, and theming
 * are real and correct.
 */
const PADDING = 32;

function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Resolve a shape's stroke + fill colors from the real theme, with fallbacks. */
function resolveColors(editor: Editor, shape: TLShape) {
	const theme = editor.getCurrentTheme();
	const colors = theme.colors[editor.getColorMode()];
	const props = shape.props as { color?: string; fill?: string };
	const colorName = props.color ?? 'black';
	const stroke = getColorValue(colors, colorName, 'solid');
	const hasFill = props.fill !== undefined && props.fill !== 'none';
	const fill = hasFill ? getColorValue(colors, colorName, 'semi') : 'none';
	return { stroke, fill };
}

/** Build an SVG string for the given shapes (defaults to the whole current page). */
export function exportShapesToSvgString(editor: Editor, shapeIds?: TLShapeId[]): string | null {
	const ids = shapeIds?.length ? shapeIds : [...editor.getCurrentPageShapeIds()];
	if (!ids.length) return null;

	// Union of all shape page bounds → the export viewBox (padded).
	let bounds: Box | undefined;
	for (const id of ids) {
		const b = editor.getShapePageBounds(id);
		if (!b) continue;
		bounds = bounds ? bounds.clone().union(b) : b.clone();
	}
	if (!bounds) return null;
	bounds.expandBy(PADDING);

	const theme = editor.getCurrentTheme();
	const background = theme.colors[editor.getColorMode()].background;

	const parts: string[] = [];
	for (const id of ids) {
		const shape = editor.getShape(id);
		if (!shape) continue;
		const geometry = editor.getShapeGeometry(id);
		const d = geometry.toSimpleSvgPath();
		if (!d) continue;
		const transform = editor.getShapePageTransform(id)?.toCssString() ?? '';
		const { stroke, fill } = resolveColors(editor, shape);
		const opacity = shape.opacity;
		const strokeWidth = geometry.isClosed ? 2 : 2;
		parts.push(
			`<g transform="${escapeAttr(transform)}" opacity="${opacity}">` +
				`<path d="${escapeAttr(d)}" fill="${escapeAttr(geometry.isFilled ? fill : 'none')}" ` +
				`stroke="${escapeAttr(stroke)}" stroke-width="${strokeWidth}" ` +
				`stroke-linejoin="round" stroke-linecap="round"/>` +
				`</g>`
		);
	}

	const w = Math.ceil(bounds.width);
	const h = Math.ceil(bounds.height);
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
		`viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}">` +
		`<rect x="${bounds.minX}" y="${bounds.minY}" width="${bounds.width}" height="${bounds.height}" ` +
		`fill="${escapeAttr(background)}"/>` +
		parts.join('') +
		`</svg>`
	);
}

/** Trigger a browser download of the page/selection as an `.svg` file. */
export function downloadSvg(editor: Editor, shapeIds?: TLShapeId[]): boolean {
	const svg = exportShapesToSvgString(editor, shapeIds);
	if (!svg) return false;
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'tldraw-export.svg';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
	return true;
}

/** Read a width/height out of an SVG string's opening tag. */
function readSvgSize(svg: string): { width: number; height: number } {
	const w = Number(svg.match(/width="(\d+)"/)?.[1] ?? 0);
	const h = Number(svg.match(/height="(\d+)"/)?.[1] ?? 0);
	return { width: w || 1, height: h || 1 };
}

/**
 * Rasterise the from-scratch SVG export to a PNG blob via an offscreen canvas
 * (`scale`× device pixels), then download it. Pure browser APIs — no library, no
 * server. Returns false if there's nothing to export.
 */
export async function downloadPng(
	editor: Editor,
	shapeIds?: TLShapeId[],
	scale = 2
): Promise<boolean> {
	const svg = exportShapesToSvgString(editor, shapeIds);
	if (!svg) return false;
	const { width, height } = readSvgSize(svg);

	const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	const img = new Image();
	const loaded = new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error('svg image failed to load'));
	});
	img.src = svgUrl;
	await loaded;

	const canvas = document.createElement('canvas');
	canvas.width = Math.ceil(width * scale);
	canvas.height = Math.ceil(height * scale);
	const ctx = canvas.getContext('2d');
	if (!ctx) return false;
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), 'image/png')
	);
	if (!blob) return false;

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'tldraw-export.png';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
	return true;
}
