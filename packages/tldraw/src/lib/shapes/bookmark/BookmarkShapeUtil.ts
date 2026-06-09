// oxlint-disable typescript/no-empty-object-type
import {
	BaseBoxShapeUtil,
	T,
	type TLBookmarkAsset,
	type TLBookmarkShape,
	type TLBookmarkShapeProps,
	bookmarkShapeMigrations,
	bookmarkShapeProps,
	lerp,
} from '@tldraw/editor'
import { convertCommonTitleHTMLEntities } from '../../utils/text/text'
import type { ShapeOptionsWithDisplayValues } from '../shared/getDisplayValues'
import {
	BOOKMARK_HEIGHT,
	BOOKMARK_WIDTH,
	setBookmarkHeight,
	updateBookmarkAssetOnUrlChange,
} from './bookmarks'

/** @public */
export type BookmarkShapeUtilDisplayValues = object

/** @public */
export interface BookmarkShapeOptions extends ShapeOptionsWithDisplayValues<
	TLBookmarkShape,
	BookmarkShapeUtilDisplayValues
> {}

/** @public */
export class BookmarkShapeUtil extends BaseBoxShapeUtil<TLBookmarkShape> {
	static override type = 'bookmark' as const
	static override props = bookmarkShapeProps
	static override migrations = bookmarkShapeMigrations

	override options: BookmarkShapeOptions = {
		getDefaultDisplayValues(): BookmarkShapeUtilDisplayValues {
			return {}
		},
		getCustomDisplayValues(): Partial<BookmarkShapeUtilDisplayValues> {
			return {}
		},
	}

	override canResize(shape: TLBookmarkShape) {
		return false
	}

	override hideSelectionBoundsFg(shape: TLBookmarkShape) {
		return true
	}

	override getText(shape: TLBookmarkShape) {
		return shape.props.url
	}

	override getAriaDescriptor(shape: TLBookmarkShape) {
		const asset = (
			shape.props.assetId ? this.editor.getAsset(shape.props.assetId) : null
		) as TLBookmarkAsset | null

		if (!asset?.props.title) return undefined

		return (
			convertCommonTitleHTMLEntities(asset.props.title) +
			(asset.props.description ? ', ' + asset.props.description : '')
		)
	}

	override getDefaultProps(): TLBookmarkShape['props'] {
		return {
			url: '',
			w: BOOKMARK_WIDTH,
			h: BOOKMARK_HEIGHT,
			assetId: null,
		}
	}

	override component(_shape: TLBookmarkShape) {
		// Svelte port: rendering (the preview card — image container with favicon/
		// title/description + hyperlink button, using the bookmark asset record) is
		// handled by the Svelte renderer, not by a React component() method. The Svelte
		// renderer reads the asset via `editor.getAsset(shape.props.assetId)` and uses
		// `getHumanReadableAddress`, `getRotatedBoxShadow`, and `convertCommonTitleHTMLEntities`.
		return null
	}

	override getIndicatorPath(shape: TLBookmarkShape): Path2D {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}

	override onBeforeCreate(next: TLBookmarkShape) {
		return setBookmarkHeight(this.editor, next)
	}

	override onBeforeUpdate(prev: TLBookmarkShape, shape: TLBookmarkShape) {
		if (prev.props.url !== shape.props.url) {
			if (!T.linkUrl.isValid(shape.props.url)) {
				return { ...shape, props: { ...shape.props, url: prev.props.url } }
			} else {
				updateBookmarkAssetOnUrlChange(this.editor, shape)
			}
		}

		if (prev.props.assetId !== shape.props.assetId) {
			return setBookmarkHeight(this.editor, shape)
		}

		return undefined
	}
	override getInterpolatedProps(
		startShape: TLBookmarkShape,
		endShape: TLBookmarkShape,
		t: number
	): TLBookmarkShapeProps {
		return {
			...(t > 0.5 ? endShape.props : startShape.props),
			w: lerp(startShape.props.w, endShape.props.w, t),
			h: lerp(startShape.props.h, endShape.props.h, t),
		}
	}
}
