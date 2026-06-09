// @tldraw/editor — Svelte port public surface.
//
// This re-exports the FRAMEWORK-FREE editor core: the Editor class, tools
// (StateNode), bindings, geometry primitives, managers, config, and supporting
// types. The React render layer (components/, hooks/, license/, TldrawEditor)
// is intentionally NOT exported — it is replaced by Svelte components in the
// app's $lib/canvas and $lib/state-svelte. Deep imports into ./lib/... remain
// available for anything not surfaced here.

import { registerTldrawLibraryVersion } from '@tldraw/utils';

// Re-export the framework-free engine packages (NOT @tldraw/state-react).

export * from '@tldraw/state';

export * from '@tldraw/store';

export * from '@tldraw/tlschema';

export * from '@tldraw/utils';

export * from '@tldraw/validate';

// --- Core editor ---
export { Editor, type TLEditorOptions } from './lib/editor/Editor';

// --- Shapes ---
export {
	ShapeUtil,
	type TLResizeInfo,
	type TLShapeUtilCanvasSvgDef,
	type TLShapeUtilConstructor,
	type TLShapeUtilCanBeLaidOutOpts,
	type TLShapeUtilCanBindOpts,
	type TLGeometryOpts
} from './lib/editor/shapes/ShapeUtil';
export { BaseBoxShapeUtil, type TLBaseBoxShape } from './lib/editor/shapes/BaseBoxShapeUtil';
export { BaseFrameLikeShapeUtil } from './lib/editor/shapes/BaseFrameLikeShapeUtil';
export { GroupShapeUtil } from './lib/editor/shapes/group/GroupShapeUtil';
export { resizeBox } from './lib/editor/shapes/shared/resizeBox';
export { resizeScaled } from './lib/editor/shapes/shared/resizeScaled';
export {
	getPerfectDashProps,
	type PerfectDashTerminal
} from './lib/editor/shapes/shared/getPerfectDashProps';

// --- Bindings ---
export {
	BindingUtil,
	type BindingOnChangeOptions,
	type BindingOnCreateOptions,
	type BindingOnShapeChangeOptions,
	type BindingOnShapeIsolateOptions
} from './lib/editor/bindings/BindingUtil';

// --- Tools (state machines) ---
export { StateNode, type TLStateNodeConstructor } from './lib/editor/tools/StateNode';
export { RootState } from './lib/editor/tools/RootState';
export { BaseBoxShapeTool } from './lib/editor/tools/BaseBoxShapeTool/BaseBoxShapeTool';
export { maybeSnapToGrid } from './lib/editor/tools/BaseBoxShapeTool/children/Pointing';

// --- Geometry primitives ---
export { Box, type BoxLike } from './lib/primitives/Box';
export { Mat, type MatLike, type MatModel } from './lib/primitives/Mat';
export { Vec, type VecLike } from './lib/primitives/Vec';
export {
	Geometry2d,
	Geometry2dFilters,
	type Geometry2dOptions
} from './lib/primitives/geometry/Geometry2d';
export { Arc2d } from './lib/primitives/geometry/Arc2d';
export { Group2d } from './lib/primitives/geometry/Group2d';
export { Rectangle2d } from './lib/primitives/geometry/Rectangle2d';
export { Ellipse2d } from './lib/primitives/geometry/Ellipse2d';
export { Circle2d } from './lib/primitives/geometry/Circle2d';
export { Polyline2d } from './lib/primitives/geometry/Polyline2d';
export { Polygon2d } from './lib/primitives/geometry/Polygon2d';
export { CubicBezier2d } from './lib/primitives/geometry/CubicBezier2d';
export { Edge2d } from './lib/primitives/geometry/Edge2d';
export { getVerticesCountForArcLength } from './lib/primitives/geometry/geometry-constants';

// --- Config ---
export {
	createTLStore,
	createTLSchemaFromUtils,
	type TLStoreOptions
} from './lib/config/createTLStore';
export { coreShapes, type TLAnyShapeUtilConstructor } from './lib/config/defaultShapes';
export { type TLAnyBindingUtilConstructor } from './lib/config/defaultBindings';
export { type TLCurrentUser, createTLCurrentUser } from './lib/config/createTLCurrentUser';

// --- Options & text ---
export { type TldrawOptions, defaultTldrawOptions } from './lib/options';
export {
	type TLTextOptions,
	type TLTiptapConfig,
	type TiptapEditor,
	type TiptapNode,
	type RichTextFontVisitor,
	type RichTextFontVisitorState
} from './lib/utils/richText';

// --- Misc utils used by the render layer ---
export { getPointerInfo } from './lib/utils/getPointerInfo';
export {
	toDomPrecision,
	clamp,
	approximately,
	areAnglesCompatible,
	centerOfCircleFromThreePoints,
	getPointOnCircle,
	getPolygonVertices,
	PI,
	PI2,
	HALF_PI
} from './lib/primitives/utils';
export { normalizeWheel } from './lib/utils/normalizeWheel';
export { isAccelKey } from './lib/utils/keyboard';
// `modulate`, `lerp` etc. live in @tldraw/utils (re-exported via `export *` above).

// --- Shape util support (geometry/theme/text helpers used by shape utils) ---
export { getColorValue } from './lib/editor/managers/ThemeManager/defaultThemes';
export {
	ReadonlySharedStyleMap,
	SharedStyleMap,
	type SharedStyle
} from './lib/utils/SharedStylesMap';
export { type HandleSnapGeometry } from './lib/editor/managers/SnapManager/HandleSnaps';
export { type TLMeasureTextOpts } from './lib/editor/managers/TextManager/TextManager';
export { getFontsFromRichText } from './lib/utils/richText';
export {
	type TLCropInfo,
	type TLHandleDragInfo,
	type TLEditStartInfo
} from './lib/editor/shapes/ShapeUtil';

export { type TLContent } from './lib/editor/types/clipboard-types';

// --- Tool support (events, selection geometry, snapshots) used by tools ---
export {
	type TLPointerEventInfo,
	type TLKeyboardEventInfo,
	type TLClickEventInfo,
	type TLCancelEventInfo,
	type TLCompleteEventInfo,
	type TLTickEventInfo,
	type TLEventInfo
} from './lib/editor/types/event-types';
export {
	type TLAdjacentDirection,
	type TLSelectionHandle
} from './lib/editor/types/selection-types';
export {
	type SelectionHandle,
	type SelectionCorner,
	type SelectionEdge,
	type RotateCorner
} from './lib/primitives/Box';
export { type BoundsSnapPoint } from './lib/editor/managers/SnapManager/BoundsSnaps';
export {
	type TLRotationSnapshot,
	getRotationSnapshot,
	applyRotationToSnapshotShapes
} from './lib/utils/rotation';
export { kickoutOccludedShapes } from './lib/utils/reparenting';
export {
	pointInPolygon,
	snapAngle,
	shortAngleDist,
	degreesToRadians,
	average,
	precise,
	SIN,
	toFixed,
	clockwiseAngleDist,
	counterClockwiseAngleDist,
	isSafeFloat,
	canonicalizeRotation
} from './lib/primitives/utils';
export {
	polygonsIntersect,
	intersectLineSegmentPolygon,
	intersectCircleCircle,
	intersectLineSegmentCircle
} from './lib/primitives/intersect';
export { debugFlags } from './lib/utils/debug-flags';
export { tlenv, tlenvReactive } from './lib/globals/environment';
export { activeElementShouldCaptureKeys } from './lib/utils/dom';
export { EASINGS } from './lib/primitives/easings';
export { type SvgExportContext, type SvgExportDef } from './lib/editor/types/SvgExportContext';

registerTldrawLibraryVersion(
	(globalThis as any).TLDRAW_LIBRARY_NAME ?? '@tldraw/editor',
	(globalThis as any).TLDRAW_LIBRARY_VERSION ?? '5.0.1',
	(globalThis as any).TLDRAW_LIBRARY_MODULES ?? 'esm'
);
