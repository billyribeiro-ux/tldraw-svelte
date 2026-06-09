/**
 * Maps the icon names used throughout the from-scratch UI to tldraw's REAL icon
 * SVG assets (copied verbatim from `@tldraw/assets` into `static/tldraw-icons/`).
 * Icons are rendered exactly as tldraw does — a `<div>` whose `mask-image` is the
 * SVG, tinted via `currentColor` (see Icon.svelte) — NOT via a third-party icon
 * font. This is what makes the icons pixel-identical to tldraw.
 *
 * Most of our names already match tldraw's filenames; the few aliases below map
 * our semantic names (tool-select, tool-draw, tool-geo) to tldraw's asset names
 * (tool-pointer, tool-pencil, geo-rectangle).
 */
const ALIASES: Record<string, string> = {
	'tool-select': 'tool-pointer',
	'tool-draw': 'tool-pencil',
	'tool-geo': 'geo-rectangle',
	'tool-ellipse': 'geo-ellipse'
};

/** The public URL of a tldraw icon SVG for a given icon name. */
export function iconUrl(name: string): string {
	const file = ALIASES[name] ?? name;
	return `/tldraw-icons/${file}.svg`;
}
