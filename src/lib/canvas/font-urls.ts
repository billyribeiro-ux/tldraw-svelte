/**
 * Maps tldraw's logical font keys (the `src.url` values in DefaultFontFaces) to the
 * REAL self-hosted font files copied from `@tldraw/assets` into `static/tldraw-fonts/`.
 * Passed to the Editor as `fontAssetUrls` so the FontManager loads the genuine
 * Shantell Sans (draw) / IBM Plex Sans / Serif / Mono faces for shape text — exactly
 * the fonts tldraw ships. The UI text uses the matching @font-face rules in
 * TldrawEditor.svelte.
 */
const F = '/tldraw-fonts';

export const fontAssetUrls: Record<string, string> = {
	tldraw_draw: `${F}/Shantell_Sans-Informal_Regular.woff2`,
	tldraw_draw_bold: `${F}/Shantell_Sans-Informal_Bold.woff2`,
	tldraw_draw_italic: `${F}/Shantell_Sans-Informal_Regular_Italic.woff2`,
	tldraw_draw_italic_bold: `${F}/Shantell_Sans-Informal_Bold_Italic.woff2`,

	tldraw_sans: `${F}/IBMPlexSans-Medium.woff2`,
	tldraw_sans_bold: `${F}/IBMPlexSans-Bold.woff2`,
	tldraw_sans_italic: `${F}/IBMPlexSans-MediumItalic.woff2`,
	tldraw_sans_italic_bold: `${F}/IBMPlexSans-BoldItalic.woff2`,

	tldraw_serif: `${F}/IBMPlexSerif-Medium.woff2`,
	tldraw_serif_bold: `${F}/IBMPlexSerif-Bold.woff2`,
	tldraw_serif_italic: `${F}/IBMPlexSerif-MediumItalic.woff2`,
	tldraw_serif_italic_bold: `${F}/IBMPlexSerif-BoldItalic.woff2`,

	tldraw_mono: `${F}/IBMPlexMono-Medium.woff2`,
	tldraw_mono_bold: `${F}/IBMPlexMono-Bold.woff2`,
	tldraw_mono_italic: `${F}/IBMPlexMono-MediumItalic.woff2`,
	tldraw_mono_italic_bold: `${F}/IBMPlexMono-BoldItalic.woff2`
};
