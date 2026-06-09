import type { Component } from 'svelte';
import type { TLShape } from '@tldraw/editor';

/**
 * Maps a real tldraw shape `type` (`geo`, `draw`, `arrow`, `text`, `note`,
 * `line`, `frame`, `image`, `video`, `bookmark`, `embed`, `highlight`) to the
 * Svelte component that renders it. This replaces tldraw's React model where
 * `ShapeUtil.component(shape)` returned JSX; in the Svelte port the host
 * (`Shape.svelte`) looks up the renderer here and renders it dynamically.
 *
 * Renderers are registered per phase as each real shape is converted:
 *   Phase 1 → geo, draw, line, arrow   Phase 2 → text, note, frame, image,
 *   video, bookmark, embed, highlight.
 */
export type ShapeComponent = Component<{ shape: TLShape }>;

const registry: Record<string, ShapeComponent> = {};

export function registerShapeComponent(type: string, component: ShapeComponent): void {
	registry[type] = component;
}

export function getShapeComponent(type: string): ShapeComponent | undefined {
	return registry[type];
}
