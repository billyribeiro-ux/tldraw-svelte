import type { TLAssetId } from '@tldraw/tlschema'

// NOTE (Svelte port): the original SvgExportContext.tsx exported React
// providers/hooks (SvgExportContextProvider, useSvgExportContext,
// useDelaySvgExport) used only by the React SVG-export renderer. Those are
// re-implemented in the Svelte export layer (Phase 3). Here we keep only the
// framework-agnostic TYPES, which the core (ShapeUtil) depends on. The element
// return type is `unknown` rather than React's `ReactElement`.

/** @public */
export interface SvgExportDef {
	key: string
	getElement(): Promise<unknown | null> | unknown | null
}

/** @public */
export interface SvgExportContext {
	/**
	 * Add contents to the `<defs>` section of the export SVG. Each export def should have a unique
	 * key. If multiple defs come with the same key, only one will be added.
	 */
	addExportDef(def: SvgExportDef): void

	/**
	 * Cause the SVG export to be delayed until the returned promise is resolved. This is useful if
	 * e.g. your shape loads data dynamically, and you need to prevent the export from happening
	 * until after the data is loaded.
	 */
	waitUntil(promise: Promise<void>): void

	/**
	 * Resolve an asset URL in the context of this export. Supply the asset ID and the width in
	 * shape-pixels it'll be displayed at, and this will resolve the asset according to the export
	 * options.
	 */
	resolveAssetUrl(assetId: TLAssetId, width: number): Promise<string | null>

	/** Whether the export should be in dark mode. */
	readonly isDarkMode: boolean

	/** The color mode to use for this export. */
	readonly colorMode: 'light' | 'dark'

	/** The scale of the export - how much CSS pixels will be scaled up/down by. */
	readonly scale: number

	/**
	 * Use this value to optionally downscale images in the export. If we're exporting directly to
	 * an SVG, this will usually be null. For raster formats this is raster pixels per CSS pixel.
	 */
	readonly pixelRatio: number | null
}
