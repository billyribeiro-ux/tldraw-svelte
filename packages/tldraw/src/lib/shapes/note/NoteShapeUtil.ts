import type {
	IndexKey,
	SvgExportContext,
	TLHandle,
	TLNoteShape,
	TLNoteShapeProps,
	TLResizeInfo,
	TLShape,
} from '@tldraw/editor'
import {
	EMPTY_ARRAY,
	Group2d,
	Rectangle2d,
	ShapeUtil,
	WeakCache,
	exhaustiveSwitchError,
	getColorValue,
	getFontsFromRichText,
	isEqual,
	lerp,
	noteShapeMigrations,
	noteShapeProps,
	resizeScaled,
	rng,
	toRichText,
} from '@tldraw/editor'
import {
	isEmptyRichText,
	renderHtmlFromRichTextForMeasurement,
	renderPlaintextFromRichText,
} from '../../utils/text/richText'
import {
	LABEL_FONT_SIZES,
	LABEL_PADDING,
	TEXT_PROPS,
	getFontFamily,
} from '../shared/default-shape-constants'
import { DefaultFontFaces } from '../shared/defaultFonts'
import type { ShapeOptionsWithDisplayValues } from '../shared/getDisplayValues'
import { getDisplayValues } from '../shared/getDisplayValues'
import { CLONE_HANDLE_MARGIN } from './noteHelpers'

const NOTE_SHAPE_HORIZONTAL_ALIGNS = Object.freeze({
	start: 'start',
	middle: 'center',
	end: 'end',
	'start-legacy': 'start',
	'end-legacy': 'end',
	'middle-legacy': 'center',
} as const)

const NOTE_SHAPE_VERTICAL_ALIGNS = Object.freeze({
	start: 'start',
	middle: 'middle',
	end: 'end',
} as const)

/** @public */
export interface NoteShapeUtilDisplayValues {
	noteWidth: number
	noteHeight: number
	noteBackgroundColor: string
	borderColor: string
	borderWidth: number
	labelColor: string
	labelFontFamily: string
	labelFontSize: number
	labelLineHeight: number
	labelFontWeight: string
	labelFontVariant: string
	labelFontStyle: string
	labelPadding: number
	labelHorizontalAlign: 'start' | 'center' | 'end'
	labelVerticalAlign: 'start' | 'middle' | 'end'
}

/** @public */
export interface NoteShapeOptions
	extends ShapeOptionsWithDisplayValues<TLNoteShape, NoteShapeUtilDisplayValues> {
	/**
	 * How should the note shape resize? By default it does not resize (except automatically based on its text content),
	 * but you can set it to be user-resizable using scale.
	 */
	resizeMode: 'none' | 'scale'
}

/** @public */
export class NoteShapeUtil extends ShapeUtil<TLNoteShape> {
	static override type = 'note' as const
	static override props = noteShapeProps
	static override migrations = noteShapeMigrations

	override options: NoteShapeOptions = {
		resizeMode: 'none',
		getDefaultDisplayValues(_editor, shape, theme, colorMode): NoteShapeUtilDisplayValues {
			const { color, labelColor, font, size, align, verticalAlign } = shape.props
			const colors = theme.colors[colorMode]
			return {
				noteWidth: 200,
				noteHeight: 200,
				noteBackgroundColor: getColorValue(colors, color, 'noteFill'),
				borderColor: colors.noteBorder,
				borderWidth: 2,
				labelColor:
					labelColor === 'black'
						? getColorValue(colors, color, 'noteText')
						: getColorValue(colors, labelColor, 'fill'),
				labelFontFamily: getFontFamily(theme, font),
				labelFontSize: theme.fontSize * LABEL_FONT_SIZES[size],
				labelLineHeight: theme.lineHeight,
				labelFontWeight: TEXT_PROPS.fontWeight,
				labelFontVariant: TEXT_PROPS.fontVariant,
				labelFontStyle: TEXT_PROPS.fontStyle,
				labelPadding: LABEL_PADDING,
				labelHorizontalAlign: NOTE_SHAPE_HORIZONTAL_ALIGNS[align],
				labelVerticalAlign: NOTE_SHAPE_VERTICAL_ALIGNS[verticalAlign],
			}
		},
		getCustomDisplayValues(): Partial<NoteShapeUtilDisplayValues> {
			return {}
		},
	}

	override canEdit(_shape: TLNoteShape) {
		return true
	}
	override hideResizeHandles(_shape: TLNoteShape) {
		const { resizeMode } = this.options
		switch (resizeMode) {
			case 'none': {
				return true
			}
			case 'scale': {
				return false
			}
			default: {
				throw exhaustiveSwitchError(resizeMode)
			}
		}
	}

	override isAspectRatioLocked(_shape: TLNoteShape) {
		return this.options.resizeMode === 'scale'
	}

	override hideSelectionBoundsFg(_shape: TLNoteShape) {
		return false
	}

	getDefaultProps(): TLNoteShape['props'] {
		return {
			color: 'black',
			richText: toRichText(''),
			size: 'm',
			font: 'draw',
			align: 'middle',
			verticalAlign: 'middle',
			labelColor: 'black',
			growY: 0,
			fontSizeAdjustment: 1,
			url: '',
			scale: 1,
			textFirstEditedBy: null,
		}
	}

	getGeometry(shape: TLNoteShape) {
		const { labelHeight, labelWidth } = this.getLabelSize(shape)
		const { scale } = shape.props

		const dv = getDisplayValues(this, shape)

		const lh = labelHeight * scale
		const lw = labelWidth * scale
		const nw = dv.noteWidth * scale
		const nh = getNoteHeight(shape, dv.noteHeight)

		return new Group2d({
			children: [
				new Rectangle2d({ width: nw, height: nh, isFilled: true }),
				new Rectangle2d({
					x:
						dv.labelHorizontalAlign === 'start'
							? 0
							: dv.labelHorizontalAlign === 'end'
								? nw - lw
								: (nw - lw) / 2,
					y:
						dv.labelVerticalAlign === 'start'
							? 0
							: dv.labelVerticalAlign === 'end'
								? nh - lh
								: (nh - lh) / 2,
					width: lw,
					height: lh,
					isFilled: true,
					isLabel: true,
					excludeFromShapeBounds: true,
				}),
			],
		})
	}

	override getHandles(shape: TLNoteShape): TLHandle[] {
		const { scale } = shape.props
		const isCoarsePointer = this.editor.getInstanceState().isCoarsePointer
		if (isCoarsePointer) return []

		const zoom = this.editor.getEfficientZoomLevel()
		if (zoom * scale < 0.25) return []

		const dv = getDisplayValues(this, shape)
		const nh = getNoteHeight(shape, dv.noteHeight)
		const nw = dv.noteWidth * scale
		const offset = (CLONE_HANDLE_MARGIN / zoom) * scale

		if (zoom * scale < 0.5) {
			return [
				{
					id: 'bottom',
					index: 'a3' as IndexKey,
					type: 'clone',
					x: nw / 2,
					y: nh + offset,
				},
			]
		}

		return [
			{
				id: 'top',
				index: 'a1' as IndexKey,
				type: 'clone',
				x: nw / 2,
				y: -offset,
			},
			{
				id: 'right',
				index: 'a2' as IndexKey,
				type: 'clone',
				x: nw + offset,
				y: nh / 2,
			},
			{
				id: 'bottom',
				index: 'a3' as IndexKey,
				type: 'clone',
				x: nw / 2,
				y: nh + offset,
			},
			{
				id: 'left',
				index: 'a4' as IndexKey,
				type: 'clone',
				x: -offset,
				y: nh / 2,
			},
		]
	}

	override onResize(shape: any, info: TLResizeInfo<any>) {
		const { resizeMode } = this.options
		switch (resizeMode) {
			case 'none': {
				return undefined
			}
			case 'scale': {
				return resizeScaled(shape, info)
			}
			default: {
				throw exhaustiveSwitchError(resizeMode)
			}
		}
	}

	override getText(shape: TLNoteShape) {
		return renderPlaintextFromRichText(this.editor, shape.props.richText)
	}

	override getReferencedUserIds(shape: TLNoteShape) {
		return shape.props.textFirstEditedBy ? [shape.props.textFirstEditedBy] : []
	}

	override getFontFaces(shape: TLNoteShape) {
		// Svelte port: the original also looked up theme font faces via
		// `getThemeFontFaces` from `../shared/defaultFonts` (a React render helper
		// we do not vendor). We keep the framework-free branches: faces derived
		// from the rich text, plus the attribution sans face.
		const fonts = isEmptyRichText(shape.props.richText)
			? []
			: getFontsFromRichText(this.editor, shape.props.richText, {
					family: `tldraw_${shape.props.font}`,
					weight: 'normal',
					style: 'normal',
				})

		if (shape.props.textFirstEditedBy && !isEmptyRichText(shape.props.richText)) {
			return [...fonts, DefaultFontFaces.tldraw_sans.normal.normal]
		}

		return fonts.length ? fonts : EMPTY_ARRAY
	}

	component(_shape: TLNoteShape) {
		// Svelte port: rendering (note container rect + shadow + RichTextLabel
		// + attribution + hyperlink) is handled by the Svelte component, not by a
		// React component() method. See the renderer in the Svelte app, which uses
		// `getNoteHeight` and `getNoteShadow` exported from this module.
		return null
	}

	override getIndicatorPath(shape: TLNoteShape): Path2D {
		const { scale } = shape.props
		const dv = getDisplayValues(this, shape)
		const path = new Path2D()
		path.rect(0, 0, dv.noteWidth * scale, getNoteHeight(shape, dv.noteHeight))
		return path
	}

	override toSvg(_shape: TLNoteShape, _ctx: SvgExportContext) {
		// Svelte port: the original returned React JSX (shadow filter def + rects +
		// RichTextSVG + attribution text). SVG export is handled by the Svelte
		// renderer instead.
		throw new Error('not ported (Phase G SVG export)')
	}

	override onBeforeCreate(next: TLNoteShape) {
		return this.getNoteSizeAdjustments(next)
	}

	override onBeforeUpdate(prev: TLNoteShape, next: TLNoteShape) {
		const richTextChanged = !isEqual(prev.props.richText, next.props.richText)

		if (
			!richTextChanged &&
			prev.props.font === next.props.font &&
			prev.props.size === next.props.size
		) {
			return
		}

		let shape = next
		if (richTextChanged) {
			if (isEmptyRichText(next.props.richText)) {
				shape = {
					...shape,
					props: { ...shape.props, textFirstEditedBy: null },
				}
			} else if (!prev.props.textFirstEditedBy) {
				shape = {
					...shape,
					props: { ...shape.props, textFirstEditedBy: this.editor.getAttributionUserId() },
				}
			}
		}

		return this.getNoteSizeAdjustments(shape) ?? (richTextChanged ? shape : undefined)
	}

	override getInterpolatedProps(
		startShape: TLNoteShape,
		endShape: TLNoteShape,
		t: number
	): TLNoteShapeProps {
		return {
			...(t > 0.5 ? endShape.props : startShape.props),
			scale: lerp(startShape.props.scale, endShape.props.scale, t),
		}
	}

	/**
	 * Get the growY and fontSizeAdjustment for a shape.
	 */
	private getNoteSizeAdjustments(shape: TLNoteShape) {
		const dv = getDisplayValues(this, shape)
		const { labelHeight, fontSizeAdjustment } = this.getLabelSize(shape)
		// When the label height is more than the height of the shape, we add extra height to it
		const growY = Math.max(0, labelHeight - dv.noteHeight)

		if (growY !== shape.props.growY || fontSizeAdjustment !== shape.props.fontSizeAdjustment) {
			return {
				...shape,
				props: {
					...shape.props,
					growY,
					fontSizeAdjustment,
				},
			}
		}

		return undefined
	}

	private _labelSizesForNoteCache = new WeakCache<
		TLShape,
		{ labelHeight: number; labelWidth: number; fontSizeAdjustment: number }
	>()

	/**
	 * Get the cached label size for the shape.
	 */
	private getLabelSize(shape: TLNoteShape) {
		return this._labelSizesForNoteCache.get(shape, () => this.measureNoteLabelSize(shape))
	}

	/**
	 * Expensively measure the label size for a note shape.
	 */
	private measureNoteLabelSize(shape: TLNoteShape) {
		const dv = getDisplayValues(this, shape)
		const { richText } = shape.props

		if (isEmptyRichText(richText)) {
			const minHeight = dv.labelFontSize * dv.labelLineHeight + dv.labelPadding * 2
			return { labelHeight: minHeight, labelWidth: 100, fontSizeAdjustment: 1 }
		}

		const unadjustedFontSize = dv.labelFontSize

		let fontSizeAdjustment = unadjustedFontSize
		let iterations = 0
		let labelHeight = dv.noteHeight
		let labelWidth = dv.noteWidth

		// N.B. For some note shapes with text like 'hjhjhjhjhjhjhjhj', you'll run into
		// some text measurement fuzziness where the browser swears there's no overflow (scrollWidth === width)
		// but really there is when you enable overflow-wrap again. This helps account for that little bit
		// of give.
		const FUZZ = 1

		// We slightly make the font smaller if the text is too big for the note, width-wise.
		do {
			fontSizeAdjustment = Math.min(unadjustedFontSize, unadjustedFontSize - iterations)
			const html = renderHtmlFromRichTextForMeasurement(this.editor, richText)
			const nextTextSize = this.editor.textMeasure.measureHtml(html, {
				...TEXT_PROPS,
				lineHeight: dv.labelLineHeight,
				fontFamily: dv.labelFontFamily,
				fontSize: fontSizeAdjustment,
				maxWidth: dv.noteWidth - dv.labelPadding * 2 - FUZZ,
				disableOverflowWrapBreaking: true,
				measureScrollWidth: true,
			})

			labelHeight = nextTextSize.h + dv.labelPadding * 2
			labelWidth = nextTextSize.w + dv.labelPadding * 2

			if (fontSizeAdjustment <= 14) {
				// Too small, just rely now on CSS `overflow-wrap: break-word`
				// We need to recalculate the text measurement here with break-word enabled.
				const html = renderHtmlFromRichTextForMeasurement(this.editor, richText)
				const nextTextSizeWithOverflowBreak = this.editor.textMeasure.measureHtml(html, {
					...TEXT_PROPS,
					lineHeight: dv.labelLineHeight,
					fontFamily: dv.labelFontFamily,
					fontSize: fontSizeAdjustment,
					maxWidth: dv.noteWidth - dv.labelPadding * 2 - FUZZ,
				})
				labelHeight = nextTextSizeWithOverflowBreak.h + dv.labelPadding * 2
				labelWidth = nextTextSizeWithOverflowBreak.w + dv.labelPadding * 2
				break
			}

			if (nextTextSize.scrollWidth.toFixed(0) === nextTextSize.w.toFixed(0)) {
				break
			}
		} while (iterations++ < 50)

		return {
			labelHeight: labelHeight,
			labelWidth: labelWidth,
			fontSizeAdjustment:
				fontSizeAdjustment === unadjustedFontSize ? 1 : fontSizeAdjustment / unadjustedFontSize,
		}
	}
}

/**
 * Get the on-screen height of a note shape, accounting for its `growY` and `scale`.
 *
 * @public
 */
export function getNoteHeight(shape: TLNoteShape, noteHeight: number) {
	return (noteHeight + shape.props.growY) * shape.props.scale
}

/**
 * Build the CSS box-shadow string for a note shape, seeded by its id so the
 * "lift" is stable per-shape. Consumed by the Svelte note renderer.
 *
 * @public
 */
export function getNoteShadow(id: string, rotation: number, scale: number) {
	const random = rng(id) // seeded based on id
	const lift = Math.abs(random()) + 0.5 // 0 to 1.5
	const oy = Math.cos(rotation)
	const a = 5 * scale
	const b = 4 * scale
	const c = 6 * scale
	const d = 7 * scale
	// Clamped so shadow never goes above the note at small scales (e.g. dynamic size mode at high zoom)
	return `0px ${Math.max(0, a - lift)}px ${a}px -${a}px rgba(15, 23, 31, .6),
	0px ${(b + lift * d) * Math.max(0, oy)}px ${c + lift * d}px -${b + lift * c}px rgba(15, 23, 31, ${(0.3 + lift * 0.1).toFixed(2)}),
	0px ${48 * scale}px ${10 * scale}px -${10 * scale}px inset rgba(15, 23, 44, ${((0.022 + random() * 0.005) * ((1 + oy) / 2)).toFixed(2)})`
}
