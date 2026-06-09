import type { TLShapeId } from '@tldraw/tlschema'
import type { Editor } from '../editor/Editor'
import type { TLSvgExportOptions } from '../editor/types/misc-types'

// NOTE (Svelte port): the original exportToSvg.tsx rendered shapes to SVG via
// react-dom (`createRoot` + `getSvgJsx`). SVG/PNG export is ported in Phase 3
// using Svelte's server renderer. Until then this throws if called; it is NOT
// on the draw/move/resize path, so the editor instantiates and runs without it.
export interface TLSvgExportResult {
	svg: SVGSVGElement
	width: number
	height: number
	trimPadding: number
}

export async function exportToSvg(
	_editor: Editor,
	_shapeIds: TLShapeId[],
	_opts: TLSvgExportOptions = {}
): Promise<TLSvgExportResult | undefined> {
	throw new Error('exportToSvg is not yet ported to Svelte (Phase 3).')
}
