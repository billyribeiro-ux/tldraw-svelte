import { createSubscriber } from 'svelte/reactivity';
import type { Editor } from '@tldraw/editor';
import type { TLAssetId, TLShapeId } from '@tldraw/tlschema';

/**
 * FROM-SCRATCH reactive asset resolver — the Svelte equivalent of tldraw's
 * React `useImageOrVideoAsset` hook (no React). Exposes `.asset` (the synchronous
 * asset record) and `.url` (the resolved/optimized URL or a temporary preview),
 * both reactive: they update when the asset record changes, the camera zoom
 * changes (re-resolves at the new screen scale, debounced), or a preview lands.
 *
 * Usage in a renderer:
 *   const a = new AssetResolver(editor, () => shape.id, () => shape.props.assetId, () => shape.props.w);
 *   // then read a.url / a.asset in markup (reactive)
 */
export class AssetResolver {
	#editor: Editor;
	#getShapeId: () => TLShapeId;
	#getAssetId: () => TLAssetId | null;
	#getWidth: () => number;
	#subscribe: () => void;

	#url: string | null = $state(null);
	#isPlaceholder = $state(false);

	#lastAssetId: TLAssetId | null = null;
	#lastResolvedUrl: string | null = null;
	#debounce: ReturnType<typeof setTimeout> | undefined;

	constructor(
		editor: Editor,
		getShapeId: () => TLShapeId,
		getAssetId: () => TLAssetId | null,
		getWidth: () => number
	) {
		this.#editor = editor;
		this.#getShapeId = getShapeId;
		this.#getAssetId = getAssetId;
		this.#getWidth = getWidth;

		// Re-run resolution whenever the tracked signals (asset record, zoom,
		// culled set) change. createSubscriber wires this to Svelte reactivity so
		// `.url`/`.asset` re-read in markup pick up the updates.
		this.#subscribe = createSubscriber((update) => {
			return editor.store.listen(() => update(), { scope: 'all' });
		});
	}

	/** The synchronous asset record for the shape's assetId (reactive). */
	get asset() {
		this.#subscribe();
		const id = this.#getAssetId();
		return id ? (this.#editor.getAsset(id) ?? null) : null;
	}

	/** Whether the current url is a temporary preview rather than the final asset. */
	get isPlaceholder() {
		this.#subscribe();
		this.#resolve();
		return this.#isPlaceholder;
	}

	/** The resolved URL (or temporary preview), reactive. Null while unresolved. */
	get url(): string | null {
		this.#subscribe();
		this.#resolve();
		return this.#url;
	}

	#resolve() {
		const editor = this.#editor;
		const shapeId = this.#getShapeId();
		const assetId = this.#getAssetId();

		if (!assetId) {
			this.#setUrl(null, false);
			return;
		}
		// Skip resolution while the shape is culled (off-screen).
		if (editor.getCulledShapes().has(shapeId)) return;

		const asset = editor.getAsset(assetId);
		if (!asset) {
			this.#setUrl(null, false);
			return;
		}

		// No final src yet: serve a temporary preview if one exists.
		const src = (asset.props as { src?: string | null }).src;
		if (!src) {
			const preview = editor.getTemporaryAssetPreview(asset.id);
			if (preview) this.#setUrl(preview, true);
			return;
		}

		const assetWidth = (asset.props as { w?: number }).w ?? this.#getWidth();
		const screenScale = editor.getEfficientZoomLevel() * (this.#getWidth() / Math.max(assetWidth, 1));

		// Resolve immediately on first/assetId-change, debounce on zoom changes.
		const run = () => {
			editor
				.resolveAssetUrl(assetId, { screenScale })
				.then((url) => {
					if (url !== this.#lastResolvedUrl) {
						this.#lastResolvedUrl = url;
						this.#setUrl(url, false);
					}
				})
				.catch((err) => console.error('[asset] resolve failed', err));
		};

		if (assetId !== this.#lastAssetId) {
			this.#lastAssetId = assetId;
			run();
		} else {
			clearTimeout(this.#debounce);
			this.#debounce = setTimeout(run, 500);
		}
	}

	#setUrl(url: string | null, isPlaceholder: boolean) {
		if (this.#url !== url) this.#url = url;
		if (this.#isPlaceholder !== isPlaceholder) this.#isPlaceholder = isPlaceholder;
	}
}
