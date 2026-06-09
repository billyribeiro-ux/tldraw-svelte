import { createContext } from 'svelte';
import type { Editor, TLGeoShapeGeoStyle } from '@tldraw/editor';
import { GeoShapeGeoStyle } from '@tldraw/editor';

/**
 * A toolbar tool — from-scratch port of tldraw's `TLUiToolItem`. `onSelect`
 * activates the tool via `editor.setCurrentTool`. `isActive` reports whether this
 * entry is the current tool (geo variants additionally check the next-shape geo
 * style, mirroring how tldraw highlights the active geo variant in the toolbar).
 *
 * @public
 */
export interface ToolItem {
	id: string;
	label: string;
	icon: string;
	kbd?: string;
	/** For geo-variant entries: the `GeoShapeGeoStyle` value this button selects. */
	geo?: TLGeoShapeGeoStyle;
	onSelect(source: string): void;
	isActive(): boolean;
}

export type ToolsRegistry = Record<string, ToolItem>;

export const [getTools, setTools] = createContext<ToolsRegistry>();

/**
 * The toolbar order, matching tldraw's `DefaultToolbarContent` exactly: select,
 * hand, draw, eraser, arrow, text, note, then every geo variant as its own flat
 * button (rectangle, ellipse, triangle, diamond, hexagon, oval, rhombus, star,
 * cloud, heart, x-box, check-box, the 4 geo arrows), then line, highlight, frame.
 * (Asset + Laser are omitted — no asset tool / LaserTool is wired in this port.)
 *
 * @public
 */
export const TOOLBAR_ORDER = [
	'select',
	'hand',
	'draw',
	'eraser',
	'arrow',
	'text',
	'note',
	'geo-rectangle',
	'geo-ellipse',
	'geo-triangle',
	'geo-diamond',
	'geo-hexagon',
	'geo-oval',
	'geo-rhombus',
	'geo-star',
	'geo-cloud',
	'geo-heart',
	'geo-x-box',
	'geo-check-box',
	'geo-arrow-left',
	'geo-arrow-up',
	'geo-arrow-down',
	'geo-arrow-right',
	'line',
	'highlight',
	'laser',
	'frame'
];

/**
 * Build the default tools registry from the editor.
 *
 * Geo variants are individual entries that proxy to the single `geo` tool: selecting
 * one sets `GeoShapeGeoStyle` for the next shape (via `setStyleForNextShapes`) and
 * activates the geo tool — exactly how tldraw's toolbar exposes geo shapes as
 * distinct flat buttons backed by one tool.
 */
export function createDefaultTools(editor: Editor): ToolsRegistry {
	const simple: Array<{ id: string; label: string; icon: string; kbd?: string }> = [
		{ id: 'select', label: 'Select', icon: 'tool-select', kbd: 'v' },
		{ id: 'hand', label: 'Hand', icon: 'tool-hand', kbd: 'h' },
		{ id: 'draw', label: 'Draw', icon: 'tool-draw', kbd: 'd' },
		{ id: 'eraser', label: 'Eraser', icon: 'tool-eraser', kbd: 'e' },
		{ id: 'arrow', label: 'Arrow', icon: 'tool-arrow', kbd: 'a' },
		{ id: 'text', label: 'Text', icon: 'tool-text', kbd: 't' },
		{ id: 'note', label: 'Note', icon: 'tool-note', kbd: 'n' },
		{ id: 'line', label: 'Line', icon: 'tool-line', kbd: 'l' },
		{ id: 'highlight', label: 'Highlight', icon: 'tool-highlight', kbd: '!d' },
		{ id: 'laser', label: 'Laser', icon: 'tool-laser', kbd: 'k' },
		{ id: 'frame', label: 'Frame', icon: 'tool-frame', kbd: 'f' }
	];

	// Geo variants surfaced as flat toolbar buttons. Rectangle keeps `r`, ellipse
	// keeps `o` (tldraw's hotkeys); the rest have no hotkey.
	const geoVariants: Array<{
		id: string;
		label: string;
		icon: string;
		geo: TLGeoShapeGeoStyle;
		kbd?: string;
	}> = [
		{ id: 'geo-rectangle', label: 'Rectangle', icon: 'geo-rectangle', geo: 'rectangle', kbd: 'r' },
		{ id: 'geo-ellipse', label: 'Ellipse', icon: 'geo-ellipse', geo: 'ellipse', kbd: 'o' },
		{ id: 'geo-triangle', label: 'Triangle', icon: 'geo-triangle', geo: 'triangle' },
		{ id: 'geo-diamond', label: 'Diamond', icon: 'geo-diamond', geo: 'diamond' },
		{ id: 'geo-hexagon', label: 'Hexagon', icon: 'geo-hexagon', geo: 'hexagon' },
		{ id: 'geo-oval', label: 'Oval', icon: 'geo-oval', geo: 'oval' },
		{ id: 'geo-rhombus', label: 'Rhombus', icon: 'geo-rhombus', geo: 'rhombus' },
		{ id: 'geo-star', label: 'Star', icon: 'geo-star', geo: 'star' },
		{ id: 'geo-cloud', label: 'Cloud', icon: 'geo-cloud', geo: 'cloud' },
		{ id: 'geo-heart', label: 'Heart', icon: 'geo-heart', geo: 'heart' },
		{ id: 'geo-x-box', label: 'X Box', icon: 'geo-x-box', geo: 'x-box' },
		{ id: 'geo-check-box', label: 'Checkbox', icon: 'geo-check-box', geo: 'check-box' },
		{ id: 'geo-arrow-left', label: 'Arrow left', icon: 'geo-arrow-left', geo: 'arrow-left' },
		{ id: 'geo-arrow-up', label: 'Arrow up', icon: 'geo-arrow-up', geo: 'arrow-up' },
		{ id: 'geo-arrow-down', label: 'Arrow down', icon: 'geo-arrow-down', geo: 'arrow-down' },
		{ id: 'geo-arrow-right', label: 'Arrow right', icon: 'geo-arrow-right', geo: 'arrow-right' }
	];

	const registry: ToolsRegistry = {};

	for (const def of simple) {
		registry[def.id] = {
			...def,
			onSelect: () => editor.setCurrentTool(def.id),
			isActive: () => editor.getCurrentToolId() === def.id
		};
	}

	for (const def of geoVariants) {
		registry[def.id] = {
			id: def.id,
			label: def.label,
			icon: def.icon,
			kbd: def.kbd,
			geo: def.geo,
			onSelect: () => {
				// Set the geo variant for the next shape, then activate the geo tool —
				// the tool's Pointing state reads getStyleForNextShape(GeoShapeGeoStyle).
				editor.setStyleForNextShapes(GeoShapeGeoStyle, def.geo);
				editor.setCurrentTool('geo');
			},
			isActive: () =>
				editor.getCurrentToolId() === 'geo' &&
				editor.getStyleForNextShape(GeoShapeGeoStyle) === def.geo
		};
	}

	return registry;
}
