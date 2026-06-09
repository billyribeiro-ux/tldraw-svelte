import { describe, it, expect } from 'vitest';
import { createTLStore, Editor, StateNode } from '@tldraw/editor';
import { GeoShapeUtil, getGeoShapePath } from '@tldraw/tldraw';
import { createShapeId, type TLGeoShape } from '@tldraw/tlschema';

// Phase 0 evidence (browser project — needs DOM for Editor's TextManager): the
// REAL tldraw GeoShapeUtil is vendored, React-free, and works — a real `geo`
// record is created against the real schema, produces real geometry, and yields
// a real SVG path for every geo variant.

function makeEditor() {
	class Select extends StateNode {
		static override id = 'select';
	}
	const container = document.createElement('div');
	document.body.appendChild(container);
	const store = createTLStore({ shapeUtils: [GeoShapeUtil], bindingUtils: [] });
	return new Editor({
		store,
		shapeUtils: [GeoShapeUtil],
		bindingUtils: [],
		tools: [Select],
		getContainer: () => container,
		initialState: 'select'
	});
}

describe('real GeoShapeUtil (vendored from tldraw)', () => {
	it('creates a real geo rectangle and computes real geometry', () => {
		const editor = makeEditor();
		const id = createShapeId();
		editor.createShape<TLGeoShape>({
			id,
			type: 'geo',
			x: 0,
			y: 0,
			props: { geo: 'rectangle', w: 120, h: 80 }
		});
		const shape = editor.getShape(id) as TLGeoShape;
		expect(shape?.type).toBe('geo');
		expect(shape.props.geo).toBe('rectangle');
		const bounds = editor.getShapeGeometry(shape).bounds;
		expect(bounds.width).toBeCloseTo(120, 0);
		expect(bounds.height).toBeCloseTo(80, 0);
		editor.dispose();
	});

	it('produces a real path for multiple geo variants', () => {
		const editor = makeEditor();
		for (const geo of [
			'rectangle',
			'ellipse',
			'triangle',
			'diamond',
			'star',
			'hexagon'
		] as const) {
			const id = createShapeId();
			editor.createShape<TLGeoShape>({
				id,
				type: 'geo',
				x: 0,
				y: 0,
				props: { geo, w: 100, h: 100 }
			});
			const shape = editor.getShape(id) as TLGeoShape;
			const d = getGeoShapePath(shape, 2).toD();
			expect(typeof d).toBe('string');
			expect(d.length).toBeGreaterThan(0);
		}
		editor.dispose();
	});
});
