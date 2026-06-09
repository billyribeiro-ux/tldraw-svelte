import {
	BaseBoxShapeUtil,
	type SvgExportContext,
	type TLAsset,
	type TLShapePartial,
	type TLVideoAsset,
	type TLVideoShape,
	type VecModel,
	createShapeId,
	videoShapeMigrations,
	videoShapeProps,
} from '@tldraw/editor'
import type { ShapeOptionsWithDisplayValues } from '../shared/getDisplayValues'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VideoShapeUtilDisplayValues {}

/** @public */
export interface VideoShapeOptions extends ShapeOptionsWithDisplayValues<
	TLVideoShape,
	VideoShapeUtilDisplayValues
> {
	/**
	 * Should videos play automatically?
	 */
	autoplay: boolean
}

/** @public */
export class VideoShapeUtil extends BaseBoxShapeUtil<TLVideoShape> {
	static override type = 'video' as const
	static override props = videoShapeProps
	static override migrations = videoShapeMigrations
	static override handledAssetTypes = ['video'] as const

	override options: VideoShapeOptions = {
		autoplay: true,
		getDefaultDisplayValues(): VideoShapeUtilDisplayValues {
			return {}
		},
		getCustomDisplayValues(): Partial<VideoShapeUtilDisplayValues> {
			return {}
		},
	}

	override canEdit(shape: TLVideoShape) {
		return true
	}
	override isAspectRatioLocked(shape: TLVideoShape) {
		return true
	}

	override getDefaultProps(): TLVideoShape['props'] {
		return {
			w: 100,
			h: 100,
			assetId: null,
			autoplay: this.options.autoplay,
			url: '',
			altText: '',
			// Not used, but once upon a time were used to sync video state between users
			time: 0,
			playing: true,
		}
	}

	override createShapeForAsset(asset: TLAsset, position: VecModel): TLShapePartial | null {
		const videoAsset = asset as TLVideoAsset
		return {
			id: createShapeId(),
			type: 'video',
			x: position.x,
			y: position.y,
			opacity: 1,
			props: {
				assetId: videoAsset.id,
				w: videoAsset.props.w,
				h: videoAsset.props.h,
			},
		}
	}

	override getAriaDescriptor(shape: TLVideoShape) {
		return shape.props.altText
	}

	component(_shape: TLVideoShape) {
		// Svelte port: rendering (the <video> element + <source>, spinner, broken-asset
		// placeholder, fullscreen/edit focus handling, and hyperlink button) is handled
		// by the Svelte renderer, not by a React component() method. The Svelte renderer
		// resolves the asset URL via a reactive reimplementation of `useImageOrVideoAsset`.
		return null
	}

	override getIndicatorPath(shape: TLVideoShape): Path2D {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}

	override toSvg(_shape: TLVideoShape, _ctx: SvgExportContext): never {
		// Svelte port: the original resolved the asset URL, loaded the video, and
		// rendered its first frame as a React <image>. SVG export is handled by the
		// Svelte renderer instead.
		throw new Error('not ported (Phase G SVG export)')
	}
}
