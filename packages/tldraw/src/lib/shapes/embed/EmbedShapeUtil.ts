import {
	BaseBoxShapeUtil,
	type TLEmbedShape,
	type TLEmbedShapeProps,
	type TLResizeInfo,
	embedShapeMigrations,
	embedShapeProps,
	lerp,
	resizeBox,
} from '@tldraw/editor'
import {
	DEFAULT_EMBED_DEFINITIONS,
	type EmbedDefinition,
	type TLEmbedDefinition,
} from '../../defaultEmbedDefinitions'
import { type TLEmbedResult, getEmbedInfo } from '../../utils/embeds/embeds'
import type { ShapeOptionsWithDisplayValues } from '../shared/getDisplayValues'

/** @public */
export interface EmbedShapeUtilDisplayValues {
	showShadow: boolean
}

/** @public */
export interface EmbedShapeOptions extends ShapeOptionsWithDisplayValues<
	TLEmbedShape,
	EmbedShapeUtilDisplayValues
> {
	/** The embed definitions to use for this shape util. */
	readonly embedDefinitions: readonly TLEmbedDefinition[]
}

/** @public */
export class EmbedShapeUtil extends BaseBoxShapeUtil<TLEmbedShape> {
	static override type = 'embed' as const
	static override props = embedShapeProps
	static override migrations = embedShapeMigrations

	override options: EmbedShapeOptions = {
		embedDefinitions: DEFAULT_EMBED_DEFINITIONS,
		getDefaultDisplayValues(): EmbedShapeUtilDisplayValues {
			return {
				showShadow: true,
			}
		},
		getCustomDisplayValues(): Partial<EmbedShapeUtilDisplayValues> {
			return {}
		},
	}

	override canEditWhileLocked(shape: TLEmbedShape) {
		const result = this.getEmbedDefinition(shape.props.url)
		if (!result) return true
		return result.definition.canEditWhileLocked ?? true
	}

	private static legacyEmbedDefinitions: readonly EmbedDefinition[] | null = null

	/** @deprecated - Use `EmbedShapeUtil.configure({ embedDefinitions: [...] })` instead. */
	static setEmbedDefinitions(embedDefinitions: readonly EmbedDefinition[]) {
		EmbedShapeUtil.legacyEmbedDefinitions = embedDefinitions
	}

	private getEmbedDefs(): readonly TLEmbedDefinition[] {
		return EmbedShapeUtil.legacyEmbedDefinitions ?? this.options.embedDefinitions
	}

	getEmbedDefinitions(): readonly TLEmbedDefinition[] {
		return this.getEmbedDefs()
	}

	getEmbedDefinition(url: string): TLEmbedResult {
		return getEmbedInfo(this.getEmbedDefs(), url)
	}

	override getText(shape: TLEmbedShape) {
		return shape.props.url
	}

	override getAriaDescriptor(shape: TLEmbedShape) {
		const embedInfo = this.getEmbedDefinition(shape.props.url)
		return embedInfo?.definition.title
	}

	override hideSelectionBoundsFg(shape: TLEmbedShape) {
		return !this.canResize(shape)
	}
	override canEdit(shape: TLEmbedShape) {
		return true
	}
	override canResize(shape: TLEmbedShape) {
		return this.getEmbedDefinition(shape.props.url)?.definition?.doesResize ?? true
	}
	override canEditInReadonly(shape: TLEmbedShape) {
		return true
	}

	override getDefaultProps(): TLEmbedShape['props'] {
		return {
			w: 300,
			h: 300,
			url: '',
		}
	}

	override getGeometry(shape: TLEmbedShape) {
		return super.getGeometry(shape)
	}

	override isAspectRatioLocked(shape: TLEmbedShape) {
		const embedInfo = this.getEmbedDefinition(shape.props.url)
		return embedInfo?.definition.isAspectRatioLocked ?? false
	}

	override onResize(shape: TLEmbedShape, info: TLResizeInfo<TLEmbedShape>) {
		const isAspectRatioLocked = this.isAspectRatioLocked(shape)
		const embedInfo = this.getEmbedDefinition(shape.props.url)
		let minWidth = embedInfo?.definition.minWidth ?? 200
		let minHeight = embedInfo?.definition.minHeight ?? 200
		if (isAspectRatioLocked) {
			// Enforce aspect ratio
			// Neither the width or height can be less than 200
			const aspectRatio = shape.props.w / shape.props.h
			if (aspectRatio > 1) {
				// Landscape
				minWidth *= aspectRatio
			} else {
				// Portrait
				minHeight /= aspectRatio
			}
		}

		return resizeBox(shape, info, { minWidth, minHeight })
	}

	override component(_shape: TLEmbedShape) {
		// Svelte port: rendering (the <iframe> with sandbox permissions / src from
		// `getEmbedDefinition(url).embedUrl`, the github_gist srcDoc iframe, the blank
		// SVG-export embed, and the bookmark-style fallback for non-embeddable URLs) is
		// handled by the Svelte renderer, not by a React component() method. The Svelte
		// renderer calls `getEmbedDefinition(url)` (or the exported `getEmbedInfo`) to
		// derive `embedUrl`, permissions, and definition metadata, and uses
		// `getRotatedBoxShadow` for the shadow.
		return null
	}

	override getIndicatorPath(shape: TLEmbedShape): Path2D {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}

	override getInterpolatedProps(
		startShape: TLEmbedShape,
		endShape: TLEmbedShape,
		t: number
	): TLEmbedShapeProps {
		return {
			...(t > 0.5 ? endShape.props : startShape.props),
			w: lerp(startShape.props.w, endShape.props.w, t),
			h: lerp(startShape.props.h, endShape.props.h, t),
		}
	}
}
