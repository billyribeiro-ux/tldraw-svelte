/* eslint-disable react-hooks/rules-of-hooks */
import type {
	SvgExportContext,
	TLHighlightShape,
	TLHighlightShapeProps,
	TLResizeInfo,
	VecLike} from '@tldraw/editor';
import {
	Circle2d,
	Editor,
	Polygon2d,
	ShapeUtil,
	debugFlags,
	getColorValue,
	highlightShapeMigrations,
	highlightShapeProps,
	last,
	lerp,
	rng,
	tlenvReactive,
} from '@tldraw/editor'
import { getHighlightFreehandSettings, getPointsFromDrawSegments } from '../draw/getPath'
import { FONT_SIZES } from '../shared/default-shape-constants'
import { getStrokeOutlinePoints } from '../shared/freehand/getStrokeOutlinePoints'
import { getStrokePoints } from '../shared/freehand/getStrokePoints'
import { setStrokePointRadii } from '../shared/freehand/setStrokePointRadii'
import { getSvgPathFromStrokePoints } from '../shared/freehand/svg'
import type { ShapeOptionsWithDisplayValues } from '../shared/getDisplayValues'
import { getDisplayValues } from '../shared/getDisplayValues'
import { interpolateSegments } from '../shared/interpolate-props'

/** @public */
export interface HighlightShapeUtilDisplayValues {
	strokeColor: string
	strokeWidth: number
	underlayOpacity: number
	overlayOpacity: number
}

/** @public */
export interface HighlightShapeOptions extends ShapeOptionsWithDisplayValues<
	TLHighlightShape,
	HighlightShapeUtilDisplayValues
> {
	/**
	 * The maximum number of points in a line before the draw tool will begin a new shape.
	 * A higher number will lead to poor performance while drawing very long lines.
	 */
	readonly maxPointsPerShape: number
}

/** @public */
export class HighlightShapeUtil extends ShapeUtil<TLHighlightShape> {
	static override type = 'highlight' as const
	static override props = highlightShapeProps
	static override migrations = highlightShapeMigrations

	override options: HighlightShapeOptions = {
		maxPointsPerShape: 600,
		getDefaultDisplayValues(_editor, shape, theme, colorMode): HighlightShapeUtilDisplayValues {
			const { color, size } = shape.props
			const colors = theme.colors[colorMode]
			const useP3 = !debugFlags.forceSrgb.get() && tlenvReactive.get().supportsP3ColorSpace
			const strokeColor = useP3
				? getColorValue(colors, color, 'highlightP3')
				: getColorValue(colors, color, 'highlightSrgb')
			return {
				strokeColor,
				strokeWidth: theme.fontSize * FONT_SIZES[size] * 1.12,
				underlayOpacity: 0.82,
				overlayOpacity: 0.35,
			}
		},
		getCustomDisplayValues(): Partial<HighlightShapeUtilDisplayValues> {
			return {}
		},
	}

	override hideResizeHandles(shape: TLHighlightShape) {
		return getIsDot(shape)
	}
	override hideRotateHandle(shape: TLHighlightShape) {
		return getIsDot(shape)
	}
	override hideSelectionBoundsFg(shape: TLHighlightShape) {
		return getIsDot(shape)
	}

	override getDefaultProps(): TLHighlightShape['props'] {
		return {
			segments: [],
			color: 'black',
			size: 'm',
			isComplete: false,
			isPen: false,
			scale: 1,
			scaleX: 1,
			scaleY: 1,
		}
	}

	getGeometry(shape: TLHighlightShape) {
		const dv = getDisplayValues(this, shape)
		const strokeWidth = dv.strokeWidth * shape.props.scale
		if (getIsDot(shape)) {
			return new Circle2d({
				x: -strokeWidth / 2,
				y: -strokeWidth / 2,
				radius: strokeWidth / 2,
				isFilled: true,
			})
		}

		const { strokePoints, sw } = getHighlightStrokePoints(shape, strokeWidth, true)
		const opts = getHighlightFreehandSettings({ strokeWidth: sw, showAsComplete: true })
		setStrokePointRadii(strokePoints, opts)

		return new Polygon2d({
			points: getStrokeOutlinePoints(strokePoints, opts),
			isFilled: true,
		})
	}

	// Svelte port: rendering handled by HighlightShape.svelte (overlay layer) via
	// the exported getHighlightStrokePoints/getShapeDot + display values.
	component() {
		return null
	}

	override backgroundComponent() {
		// Underlay (dimmed) layer is rendered by HighlightShape.svelte's bg mode.
		return null
	}

	override getIndicatorPath(shape: TLHighlightShape): Path2D {
		const dv = getDisplayValues(this, shape)
		const strokeWidth = dv.strokeWidth * shape.props.scale
		const zoomLevel = this.editor.getEfficientZoomLevel()
		const forceSolid = strokeWidth / zoomLevel < 1.5

		const { strokePoints, sw } = getHighlightStrokePoints(shape, strokeWidth, forceSolid)
		const allPointsFromSegments = getPointsFromDrawSegments(
			shape.props.segments,
			shape.props.scaleX,
			shape.props.scaleY
		)

		let strokePath
		if (strokePoints.length < 2) {
			strokePath = getIndicatorDot(allPointsFromSegments[0], sw)
		} else {
			strokePath = getSvgPathFromStrokePoints(strokePoints, false)
		}

		return new Path2D(strokePath)
	}

	override toSvg(_shape: TLHighlightShape, _ctx: SvgExportContext) {
		throw new Error('not ported (Phase G SVG export)')
	}

	override toBackgroundSvg(_shape: TLHighlightShape, _ctx: SvgExportContext) {
		throw new Error('not ported (Phase G SVG export)')
	}

	override onResize(shape: TLHighlightShape, info: TLResizeInfo<TLHighlightShape>) {
		const newScaleX = info.scaleX * shape.props.scaleX
		const newScaleY = info.scaleY * shape.props.scaleY
		if (newScaleX === 0 || newScaleY === 0) return

		return {
			props: {
				scaleX: newScaleX,
				scaleY: newScaleY,
			},
		}
	}
	override getInterpolatedProps(
		startShape: TLHighlightShape,
		endShape: TLHighlightShape,
		t: number
	): TLHighlightShapeProps {
		return {
			...(t > 0.5 ? endShape.props : startShape.props),
			...endShape.props,
			segments: interpolateSegments(startShape.props.segments, endShape.props.segments, t),
			scale: lerp(startShape.props.scale, endShape.props.scale, t),
		}
	}
}

export function getShapeDot(point: VecLike) {
	const r = 0.1
	return `M ${point.x} ${point.y} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${
		r * 2
	},0`
}

function getIndicatorDot(point: VecLike, sw: number) {
	const r = sw / 2
	return `M ${point.x} ${point.y} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${
		r * 2
	},0`
}

export function getHighlightStrokePoints(
	shape: TLHighlightShape,
	strokeWidth: number,
	forceSolid: boolean
) {
	const allPointsFromSegments = getPointsFromDrawSegments(
		shape.props.segments,
		shape.props.scaleX,
		shape.props.scaleY
	)
	const showAsComplete = shape.props.isComplete || last(shape.props.segments)?.type === 'straight'

	let sw = strokeWidth
	if (!forceSolid && !shape.props.isPen && allPointsFromSegments.length === 1) {
		sw += rng(shape.id)() * (strokeWidth / 6)
	}

	const options = getHighlightFreehandSettings({
		strokeWidth: sw,
		showAsComplete,
	})

	const strokePoints = getStrokePoints(allPointsFromSegments, options)

	return { strokePoints, sw }
}

function getIsDot(shape: TLHighlightShape) {
	// First point is 16 base64 chars (3 Float32s = 12 bytes)
	// Each delta point is 8 base64 chars (3 Float16s = 6 bytes)
	// 1 point = 16 chars, 2 points = 24 chars
	// Check if we have less than 2 points without decoding
	return shape.props.segments.length === 1 && shape.props.segments[0].path.length < 24
}

