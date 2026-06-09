import { fetch } from '@tldraw/utils'
import { version } from '../../version'

/**
 * Converts a data URL to a file.
 * @param url - The data URL to convert.
 * @param filename - The name of the file.
 * @param mimeType - The MIME type of the file.
 * @returns A promise that resolves to a file.
 * @public */
export async function dataUrlToFile(url: string, filename: string, mimeType: string) {
	const res = await fetch(url)
	const buf = await res.arrayBuffer()
	return new File([buf], filename, { type: mimeType })
}

/**
 * Reads an environment variable, returning undefined if `process` is not
 * available (e.g. in a browser bundle where it was not replaced at build time).
 *
 * This mirrors the pattern used in `@tldraw/sync`'s `useSyncDemo`: bundlers
 * perform static string replacement on `process.env.X`, so the access is
 * wrapped in a try/catch to stay safe at runtime.
 * @internal
 */
function getEnv(cb: () => string | undefined): string | undefined {
	try {
		return cb()
	} catch {
		return undefined
	}
}

/**
 * Base URL for tldraw's default UI assets (icons, fonts, translations,
 * embed-icons, watermark).
 *
 * For self-hosting, this is overridable via the `TLDRAW_ASSET_CDN_URL`
 * environment variable so the editor never silently phones home to tldraw's
 * CDN. When set, `getDefaultCdnBaseUrl()` resolves assets against that base
 * (and skips appending the SDK version, since a self-hosted mirror is not
 * versioned the way tldraw's CDN is). When unset, it falls back to tldraw's
 * public CDN to preserve out-of-the-box behavior; the recommended self-hosting
 * path remains passing `assetUrls` from `@tldraw/assets/selfHosted` to the
 * `<Tldraw />` component (see the example app and templates).
 * @internal
 */
const CDN_BASE_URL = getEnv(() => process.env.TLDRAW_ASSET_CDN_URL) || 'https://cdn.tldraw.com'

/**
 * Whether the CDN base URL was explicitly overridden for self-hosting. When
 * overridden we use it verbatim; otherwise we append the SDK version to match
 * tldraw's versioned CDN layout.
 * @internal
 */
const IS_CDN_OVERRIDDEN = !!getEnv(() => process.env.TLDRAW_ASSET_CDN_URL)

/**
 * Gets the default CDN base URL.
 * @returns The default CDN base URL.
 * @public */
export function getDefaultCdnBaseUrl() {
	if (IS_CDN_OVERRIDDEN) {
		return CDN_BASE_URL.replace(/\/$/, '')
	}
	return `${CDN_BASE_URL}/${version}`
}
