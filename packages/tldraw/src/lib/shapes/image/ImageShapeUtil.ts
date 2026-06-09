// oxlint-disable typescript/no-empty-object-type
import {
	BaseBoxShapeUtil,
	Ellipse2d,
	Geometry2d,
	Rectangle2d,
	type SvgExportContext,
	type TLAsset,
	type TLImageAsset,
	type TLImageShape,
	type TLImageShapeProps,
	type TLResizeInfo,
	type TLShapePartial,
	Vec,
	type VecModel,
	createShapeId,
	imageShapeMigrations,
	imageShapeProps,
	lerp,
	resizeBox,
	structuredClone,
} from '@tldraw/editor'
import { getUncroppedSize } from '../shared/crop'
import type { ShapeOptionsWithDisplayValues } from '../shared/getDisplayValues'
import { TRANSPARENT_IMAGE_MIMETYPES, getAlphaData } from './ImageAlphaCache'
import { ImageEllipse2d, ImageRectangle2d } from './ImageAlphaGeometry'

/** @public */
export interface ImageShapeUtilDisplayValues {}

/** @public */
export interface ImageShapeOptions extends ShapeOptionsWithDisplayValues<
	TLImageShape,
	ImageShapeUtilDisplayValues
> {}

/** @public */
export class ImageShapeUtil extends BaseBoxShapeUtil<TLImageShape> {
	static override type = 'image' as const
	static override props = imageShapeProps
	static override migrations = imageShapeMigrations
	static override handledAssetTypes = ['image'] as const

	override options: ImageShapeOptions = {
		getDefaultDisplayValues(): ImageShapeUtilDisplayValues {
			return {}
		},
		getCustomDisplayValues(): Partial<ImageShapeUtilDisplayValues> {
			return {}
		},
	}

	override isAspectRatioLocked(shape: TLImageShape) {
		return true
	}
	override canCrop(shape: TLImageShape) {
		return true
	}
	override isExportBoundsContainer(): boolean {
		return true
	}

	override getDefaultProps(): TLImageShape['props'] {
		return {
			w: 100,
			h: 100,
			assetId: null,
			playing: true,
			url: '',
			crop: null,
			flipX: false,
			flipY: false,
			altText: '',
		}
	}

	override createShapeForAsset(asset: TLAsset, position: VecModel): TLShapePartial | null {
		const imageAsset = asset as TLImageAsset
		return {
			id: createShapeId(),
			type: 'image',
			x: position.x,
			y: position.y,
			opacity: 1,
			props: {
				assetId: imageAsset.id,
				w: imageAsset.props.w,
				h: imageAsset.props.h,
			},
		}
	}

	override getGeometry(shape: TLImageShape): Geometry2d {
		const asset = shape.props.assetId ? this.editor.getAsset(shape.props.assetId) : null
		const mimeType = asset && 'mimeType' in asset.props ? asset.props.mimeType : null
		const supportsTransparency = mimeType != null && TRANSPARENT_IMAGE_MIMETYPES.includes(mimeType)
		const assetSrc = asset && 'src' in asset.props ? asset.props.src : null

		if (shape.props.crop?.isCircle) {
			if (supportsTransparency && assetSrc) {
				const src = assetSrc
				return new ImageEllipse2d({
					width: shape.props.w,
					height: shape.props.h,
					isFilled: true,
					alphaDataGetter: () => getAlphaData(src),
					crop: shape.props.crop,
					flipX: shape.props.flipX,
					flipY: shape.props.flipY,
				})
			}
			return new Ellipse2d({
				width: shape.props.w,
				height: shape.props.h,
				isFilled: true,
			})
		}

		if (supportsTransparency && assetSrc) {
			const src = assetSrc
			return new ImageRectangle2d({
				width: shape.props.w,
				height: shape.props.h,
				isFilled: true,
				alphaDataGetter: () => getAlphaData(src),
				crop: shape.props.crop,
				flipX: shape.props.flipX,
				flipY: shape.props.flipY,
			})
		}

		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override getAriaDescriptor(shape: TLImageShape) {
		return shape.props.altText
	}

	override onResize(shape: TLImageShape, info: TLResizeInfo<TLImageShape>) {
		let resized: TLImageShape = resizeBox(shape, info)
		const { flipX, flipY } = info.initialShape.props
		const { scaleX, scaleY, mode } = info

		resized = {
			...resized,
			props: {
				...resized.props,
				flipX: scaleX < 0 !== flipX,
				flipY: scaleY < 0 !== flipY,
			},
		}
		if (!shape.props.crop) return resized

		const flipCropHorizontally =
			// We used the flip horizontally feature
			(mode === 'scale_shape' && scaleX === -1) ||
			// We resized the shape past it's bounds, so it flipped
			(mode === 'resize_bounds' && flipX !== resized.props.flipX)
		const flipCropVertically =
			// We used the flip vertically feature
			(mode === 'scale_shape' && scaleY === -1) ||
			// We resized the shape past it's bounds, so it flipped
			(mode === 'resize_bounds' && flipY !== resized.props.flipY)

		const { topLeft, bottomRight } = shape.props.crop
		resized.props.crop = {
			topLeft: {
				x: flipCropHorizontally ? 1 - bottomRight.x : topLeft.x,
				y: flipCropVertically ? 1 - bottomRight.y : topLeft.y,
			},
			bottomRight: {
				x: flipCropHorizontally ? 1 - topLeft.x : bottomRight.x,
				y: flipCropVertically ? 1 - topLeft.y : bottomRight.y,
			},
			isCircle: shape.props.crop.isCircle,
		}
		return resized
	}

	component(_shape: TLImageShape) {
		// Svelte port: rendering (the <img> element(s), crop container, broken-asset
		// placeholder, and hyperlink button) is handled by the Svelte renderer, not by
		// a React component() method. The Svelte renderer resolves the asset URL via a
		// reactive reimplementation of `useImageOrVideoAsset` and uses `getUncroppedSize`
		// exported from this module.
		return null
	}

	override getIndicatorPath(shape: TLImageShape): Path2D | undefined {
		if (this.editor.getCroppingShapeId() === shape.id) return undefined

		const path = new Path2D()
		if (shape.props.crop?.isCircle) {
			const cx = shape.props.w / 2
			const cy = shape.props.h / 2
			path.ellipse(cx, cy, cx, cy, 0, 0, Math.PI * 2)
		} else {
			path.rect(0, 0, shape.props.w, shape.props.h)
		}
		return path
	}

	override toSvg(_shape: TLImageShape, _ctx: SvgExportContext): never {
		// Svelte port: the original resolved the asset URL, converted it to a data URI
		// (and extracted the first frame for animated images), then returned React
		// JSX (<image>/clipPath). SVG export is handled by the Svelte renderer instead.
		throw new Error('not ported (Phase G SVG export)')
	}

	override onDoubleClickEdge(shape: TLImageShape) {
		const props = shape.props
		if (!props) return

		if (this.editor.getCroppingShapeId() !== shape.id) {
			return
		}

		const crop = structuredClone(props.crop) || {
			topLeft: { x: 0, y: 0 },
			bottomRight: { x: 1, y: 1 },
		}

		// The true asset dimensions
		const { w, h } = getUncroppedSize(shape.props, crop)

		const pointDelta = new Vec(crop.topLeft.x * w, crop.topLeft.y * h).rot(shape.rotation)

		const partial: TLShapePartial<TLImageShape> = {
			id: shape.id,
			type: shape.type,
			x: shape.x - pointDelta.x,
			y: shape.y - pointDelta.y,
			props: {
				crop: {
					topLeft: { x: 0, y: 0 },
					bottomRight: { x: 1, y: 1 },
				},
				w,
				h,
			},
		}

		this.editor.updateShapes([partial])
	}
	override getInterpolatedProps(
		startShape: TLImageShape,
		endShape: TLImageShape,
		t: number
	): TLImageShapeProps {
		function interpolateCrop(
			startShape: TLImageShape,
			endShape: TLImageShape
		): TLImageShapeProps['crop'] {
			if (startShape.props.crop === null && endShape.props.crop === null) return null

			const startTL = startShape.props.crop?.topLeft || { x: 0, y: 0 }
			const startBR = startShape.props.crop?.bottomRight || { x: 1, y: 1 }
			const endTL = endShape.props.crop?.topLeft || { x: 0, y: 0 }
			const endBR = endShape.props.crop?.bottomRight || { x: 1, y: 1 }

			return {
				topLeft: { x: lerp(startTL.x, endTL.x, t), y: lerp(startTL.y, endTL.y, t) },
				bottomRight: { x: lerp(startBR.x, endBR.x, t), y: lerp(startBR.y, endBR.y, t) },
			}
		}

		return {
			...(t > 0.5 ? endShape.props : startShape.props),
			w: lerp(startShape.props.w, endShape.props.w, t),
			h: lerp(startShape.props.h, endShape.props.h, t),
			crop: interpolateCrop(startShape, endShape),
		}
	}
}
