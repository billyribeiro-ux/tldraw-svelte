// From-scratch rich-text helpers (no tiptap) used by RichTextLabel.svelte.
export {
	isEmptyRichText,
	renderHtmlFromRichText,
	renderPlaintextFromRichText,
	richTextFromHtml,
	richTextFromPlainText,
	defaultAddFontsFromNode
} from './lib/utils/text/richText';
export { GeoShapeUtil } from './lib/shapes/geo/GeoShapeUtil';
export { GeoShapeTool } from './lib/shapes/geo/GeoShapeTool';
export {
	getGeoShapePath,
	getGeoTypeDefinition,
	defaultGeoTypeDefinitions
} from './lib/shapes/geo/getGeoShapePath';
export { DrawShapeUtil } from './lib/shapes/draw/DrawShapeUtil';
export { DrawShapeTool } from './lib/shapes/draw/DrawShapeTool';
export { LineShapeUtil, getPathForLineShape } from './lib/shapes/line/LineShapeUtil';
export { LineShapeTool } from './lib/shapes/line/LineShapeTool';
// Freehand render helpers the Svelte `DrawShape.svelte` renderer needs:
export { getStrokePoints } from './lib/shapes/shared/freehand/getStrokePoints';
export { getSvgPathFromStrokePoints } from './lib/shapes/shared/freehand/svg';
export { svgInk } from './lib/shapes/shared/freehand/svgInk';
export {
	getFreehandOptions,
	getDot,
	getPointsFromDrawSegments,
	getDrawShapeStrokeDashArray
} from './lib/shapes/draw/getPath';
export { PathBuilder, PathBuilderGeometry2d } from './lib/shapes/shared/PathBuilder';
export { getDisplayValues } from './lib/shapes/shared/getDisplayValues';
// Arrow shape + binding (vendored from the React monorepo, React-stripped).
export { ArrowShapeUtil } from './lib/shapes/arrow/ArrowShapeUtil';
export { ArrowShapeTool } from './lib/shapes/arrow/ArrowShapeTool';
export { ArrowBindingUtil } from './lib/bindings/arrow/ArrowBindingUtil';
// Arrow render helpers the Svelte `ArrowShape.svelte` renderer needs:
export { getArrowInfo } from './lib/shapes/arrow/getArrowInfo';
export { getArrowBodyPath, getArrowBodyPathBuilder } from './lib/shapes/arrow/ArrowPath';
export { getArrowheadPathForType } from './lib/shapes/arrow/arrowheads';
export { getArrowLabelPosition } from './lib/shapes/arrow/arrowLabel';
// Frame shape + tool (vendored from the React monorepo, React-stripped).
export { FrameShapeUtil } from './lib/shapes/frame/FrameShapeUtil';
export { FrameShapeTool } from './lib/shapes/frame/FrameShapeTool';
// Frame render helpers the Svelte `FrameShape.svelte` renderer needs:
export {
	getFrameHeadingSide,
	getFrameHeadingTranslation,
	defaultEmptyAs
} from './lib/shapes/frame/frameHelpers';
// Highlight shape (shares the draw tool's states).
export {
	HighlightShapeUtil,
	getHighlightStrokePoints,
	getShapeDot
} from './lib/shapes/highlight/HighlightShapeUtil';
export { HighlightShapeTool } from './lib/shapes/highlight/HighlightShapeTool';
// Text shape + tool (vendored from the React monorepo, React-stripped).
// `getMinDimensions` is a method on TextShapeUtil — no separate export needed.
export { TextShapeUtil } from './lib/shapes/text/TextShapeUtil';
export type { TextShapeOptions, TextShapeUtilDisplayValues } from './lib/shapes/text/TextShapeUtil';
export { TextShapeTool } from './lib/shapes/text/TextShapeTool';
// Note shape + tool (vendored from the React monorepo, React-stripped).
export { NoteShapeUtil, getNoteHeight, getNoteShadow } from './lib/shapes/note/NoteShapeUtil';
export type { NoteShapeOptions, NoteShapeUtilDisplayValues } from './lib/shapes/note/NoteShapeUtil';
export { NoteShapeTool } from './lib/shapes/note/NoteShapeTool';
// Image / video / bookmark / embed shapes (vendored from the React monorepo,
// React-stripped). These shapes have no tool — they are created via paste/drop.
export { ImageShapeUtil } from './lib/shapes/image/ImageShapeUtil';
export type {
	ImageShapeOptions,
	ImageShapeUtilDisplayValues
} from './lib/shapes/image/ImageShapeUtil';
// Image render helpers the Svelte `ImageShape.svelte` renderer needs:
export { getUncroppedSize } from './lib/shapes/shared/crop';
export { ImageEllipse2d, ImageRectangle2d } from './lib/shapes/image/ImageAlphaGeometry';
export {
	TRANSPARENT_IMAGE_MIMETYPES,
	getAlphaData,
	preloadAlphaData,
	isPointTransparent,
	isImagePointTransparent
} from './lib/shapes/image/ImageAlphaCache';
export type { AlphaData, ImageAlphaGeometryConfig } from './lib/shapes/image/ImageAlphaCache';
export { VideoShapeUtil } from './lib/shapes/video/VideoShapeUtil';
export type {
	VideoShapeOptions,
	VideoShapeUtilDisplayValues
} from './lib/shapes/video/VideoShapeUtil';
export { BookmarkShapeUtil } from './lib/shapes/bookmark/BookmarkShapeUtil';
export type {
	BookmarkShapeOptions,
	BookmarkShapeUtilDisplayValues
} from './lib/shapes/bookmark/BookmarkShapeUtil';
// Bookmark helpers the Svelte `BookmarkShape.svelte` renderer needs:
export {
	BOOKMARK_WIDTH,
	BOOKMARK_HEIGHT,
	BOOKMARK_JUST_URL_HEIGHT,
	getBookmarkHeight,
	setBookmarkHeight,
	getHumanReadableAddress,
	updateBookmarkAssetOnUrlChange,
	createBookmarkFromUrl
} from './lib/shapes/bookmark/bookmarks';
export { LINK_ICON } from './lib/shapes/shared/icons-editor';
export { convertCommonTitleHTMLEntities } from './lib/utils/text/text';
export { getRotatedBoxShadow } from './lib/shapes/shared/rotated-box-shadow';
export { EmbedShapeUtil } from './lib/shapes/embed/EmbedShapeUtil';
export type {
	EmbedShapeOptions,
	EmbedShapeUtilDisplayValues
} from './lib/shapes/embed/EmbedShapeUtil';
// Embed render helpers the Svelte `EmbedShape.svelte` renderer needs:
export { getEmbedInfo, matchUrl, matchEmbedUrl } from './lib/utils/embeds/embeds';
export type { TLEmbedResult } from './lib/utils/embeds/embeds';
export {
	DEFAULT_EMBED_DEFINITIONS,
	embedShapePermissionDefaults,
	unknownEmbedShapePermissionOverrides
} from './lib/defaultEmbedDefinitions';
export type {
	EmbedDefinition,
	TLEmbedDefinition,
	TLEmbedShapePermissions
} from './lib/defaultEmbedDefinitions';
export { SelectTool } from './lib/tools/SelectTool/SelectTool';
export { HandTool } from './lib/tools/HandTool/HandTool';
export { EraserTool } from './lib/tools/EraserTool/EraserTool';
export { LaserTool } from './lib/tools/LaserTool/LaserTool';
