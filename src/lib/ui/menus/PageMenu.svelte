<script lang="ts">
	import {
		getIndexAbove,
		getIndexBelow,
		getIndexBetween,
		type IndexKey,
		type TLPageId
	} from '@tldraw/editor';
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from '../primitives/Button.svelte';
	import Popover from '../primitives/Popover.svelte';
	import Icon from '../Icon.svelte';

	// From-scratch PageMenu (port of tldraw's PageMenu): lists the real pages, lets
	// you switch/create/rename/duplicate/delete them via the editor's page API. The
	// current page name labels the trigger. Renaming is inline (no window.prompt).
	//
	// Parity additions vs. upstream DefaultPageMenu:
	//   1. Pointer drag-to-reorder, via a per-row drag handle. The reorder math is
	//      ported faithfully from edit-pages-shared.ts (getIndexAbove/Below/Between +
	//      editor.updatePage), and rows are absolutely positioned + translated so the
	//      others shift around the dragged one exactly like upstream.
	//   2. A resize handle at the bottom of the scroll container that pins the list's
	//      height (drag down = taller, up = shorter), clamped + kept in local $state.
	const editor = getEditor();

	const pages = fromComputed('pages', () => editor.getPages());
	const currentPageId = fromComputed('current page id', () => editor.getCurrentPageId());
	const currentPage = $derived(
		pages.current.find((p) => p.id === currentPageId.current) ?? pages.current[0]
	);

	// --- Layout constants (ported from DefaultPageMenu.tsx) ----------------------
	const PAGE_MENU_ITEM_HEIGHT = 40;
	const LIST_BOTTOM_PADDING = 4;
	const MIN_PAGE_MENU_LIST_HEIGHT = PAGE_MENU_ITEM_HEIGHT + LIST_BOTTOM_PADDING;
	const MAX_PAGE_MENU_LIST_HEIGHT = 800;
	const PAGE_MENU_DRAG_THRESHOLD = 5;

	// Inline-rename state: which page row is being edited, and its draft name.
	let editingId = $state<TLPageId | null>(null);
	let draftName = $state('');

	function startRename(id: TLPageId, name: string) {
		editingId = id;
		draftName = name;
	}

	function commitRename() {
		if (editingId) {
			const name = draftName.trim();
			if (name) editor.renamePage(editingId, name);
		}
		editingId = null;
	}

	function newPage() {
		editor.markHistoryStoppingPoint();
		const n = editor.getPages().length + 1;
		editor.createPage({ name: `Page ${n}` });
	}

	function duplicate(id: TLPageId) {
		editor.markHistoryStoppingPoint();
		editor.duplicatePage(id);
	}

	function remove(id: TLPageId) {
		// The editor keeps at least one page; deletePage is a no-op on the last.
		if (editor.getPages().length <= 1) return;
		editor.markHistoryStoppingPoint();
		editor.deletePage(id);
	}

	// --- Reorder (ported from edit-pages-shared.ts: onMovePage) -------------------
	// Computes the new fractional IndexKey for moving the page at `from` to `to`,
	// then commits it via editor.updatePage after marking a history stopping point.
	function onMovePage(id: TLPageId, from: number, to: number) {
		if (from === to) return;

		let index: IndexKey;
		const list = editor.getPages();

		const below = from > to ? list[to - 1] : list[to];
		const above = from > to ? list[to] : list[to + 1];

		if (below && !above) {
			index = getIndexAbove(below.index);
		} else if (!below && above) {
			index = getIndexBelow(list[0].index);
		} else {
			index = getIndexBetween(below.index, above.index);
		}

		if (index !== list[from].index) {
			editor.markHistoryStoppingPoint('moving page');
			editor.updatePage({ id, index });
		}
	}

	// In-progress drag state. Null when idle. Rows derive their visual position
	// from startIndex/dragIndex (see rowY below), matching upstream.
	type DragState = {
		id: TLPageId;
		startIndex: number;
		dragIndex: number;
		offsetY: number;
	};
	let dragState = $state<DragState | null>(null);

	// Mutable, non-reactive scratch for the active pointer drag.
	let dragMut: {
		status: 'idle' | 'pointing' | 'dragging';
		id: TLPageId | null;
		startIndex: number;
		startY: number;
		// True after a real drag so the synthetic click that follows pointer-up
		// doesn't also navigate to the dragged page.
		justDragged: boolean;
	} = {
		status: 'idle',
		id: null,
		startIndex: 0,
		startY: 0,
		justDragged: false
	};

	function updateDragFromPointer(clientY: number) {
		if (dragMut.status !== 'dragging' || !dragMut.id) return;
		const count = pages.current.length;
		const rawOffsetY = clientY - dragMut.startY;
		// Clamp the dragged row's visible position to the first/last slot.
		const minDragY = 0;
		const maxDragY = (count - 1) * PAGE_MENU_ITEM_HEIGHT;
		const dragY = Math.max(
			minDragY,
			Math.min(maxDragY, dragMut.startIndex * PAGE_MENU_ITEM_HEIGHT + rawOffsetY)
		);
		const offsetY = dragY - dragMut.startIndex * PAGE_MENU_ITEM_HEIGHT;
		const dragIndex = Math.max(0, Math.min(Math.round(dragY / PAGE_MENU_ITEM_HEIGHT), count - 1));
		dragState = { id: dragMut.id, startIndex: dragMut.startIndex, dragIndex, offsetY };
	}

	function onDragPointerMove(e: PointerEvent) {
		const clientY = e.clientY;
		if (dragMut.status === 'pointing') {
			if (Math.abs(clientY - dragMut.startY) <= PAGE_MENU_DRAG_THRESHOLD) return;
			dragMut.status = 'dragging';
		}
		if (dragMut.status === 'dragging') {
			e.preventDefault();
			updateDragFromPointer(clientY);
		}
	}

	function endDrag() {
		document.removeEventListener('pointermove', onDragPointerMove);
		document.removeEventListener('pointerup', onDragPointerUp);
		document.removeEventListener('pointercancel', onDragPointerCancel);
	}

	function onDragPointerUp() {
		if (dragMut.status === 'dragging' && dragMut.id && dragState) {
			onMovePage(dragMut.id, dragState.startIndex, dragState.dragIndex);
			dragMut.justDragged = true;
		}
		dragMut.status = 'idle';
		dragMut.id = null;
		dragState = null;
		endDrag();
	}

	function onDragPointerCancel() {
		dragMut.status = 'idle';
		dragMut.id = null;
		dragState = null;
		endDrag();
	}

	function onHandlePointerDown(e: PointerEvent, id: TLPageId, index: number) {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		dragMut.status = 'pointing';
		dragMut.id = id;
		dragMut.startIndex = index;
		dragMut.startY = e.clientY;
		// Document-level listeners live only for the duration of the drag and are
		// removed on pointerup/cancel (see endDrag) — never leaked.
		document.addEventListener('pointermove', onDragPointerMove);
		document.addEventListener('pointerup', onDragPointerUp);
		document.addEventListener('pointercancel', onDragPointerCancel);
	}

	// The visual Y of each row: the dragged row tracks the cursor; the rest shift
	// to open a gap at the drag index (exactly upstream's transform math).
	function rowY(index: number): number {
		if (!dragState) return index * PAGE_MENU_ITEM_HEIGHT;
		const { id, startIndex, dragIndex, offsetY } = dragState;
		if (pages.current[index]?.id === id) {
			return startIndex * PAGE_MENU_ITEM_HEIGHT + offsetY;
		}
		if (dragIndex < startIndex && index >= dragIndex && index < startIndex) {
			return (index + 1) * PAGE_MENU_ITEM_HEIGHT;
		}
		if (dragIndex > startIndex && index > startIndex && index <= dragIndex) {
			return (index - 1) * PAGE_MENU_ITEM_HEIGHT;
		}
		return index * PAGE_MENU_ITEM_HEIGHT;
	}

	function onRowClick(id: TLPageId) {
		// Swallow the click synthesized after a drag's pointerup.
		if (dragMut.justDragged) {
			dragMut.justDragged = false;
			return;
		}
		editor.setCurrentPage(id);
	}

	// --- Resize handle (ported from DefaultPageMenu.tsx) -------------------------
	// null = auto-fit to the number of pages. A number means the user has pinned
	// the list to that height by dragging the resize handle.
	let userListHeight = $state<number | null>(null);
	let isResizing = $state(false);

	const autoFitListHeight = $derived(
		Math.max(
			MIN_PAGE_MENU_LIST_HEIGHT,
			pages.current.length * PAGE_MENU_ITEM_HEIGHT + LIST_BOTTOM_PADDING
		)
	);
	const renderedListHeight = $derived(
		Math.min(userListHeight ?? autoFitListHeight, MAX_PAGE_MENU_LIST_HEIGHT)
	);
	// The absolutely-positioned rows live inside a content box sized to all pages.
	const contentHeight = $derived(autoFitListHeight);

	let resizeStartY = 0;
	let resizeStartHeight = 0;

	function onResizePointerMove(e: PointerEvent) {
		const next = Math.max(
			MIN_PAGE_MENU_LIST_HEIGHT,
			Math.min(MAX_PAGE_MENU_LIST_HEIGHT, resizeStartHeight + (e.clientY - resizeStartY))
		);
		userListHeight = next;
	}

	function endResize() {
		isResizing = false;
		document.removeEventListener('pointermove', onResizePointerMove);
		document.removeEventListener('pointerup', onResizePointerUp);
		document.removeEventListener('pointercancel', onResizePointerUp);
	}

	function onResizePointerUp() {
		endResize();
	}

	function onResizePointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		e.preventDefault();
		resizeStartY = e.clientY;
		// Start from what the user currently sees, so the divider tracks the cursor.
		resizeStartHeight = renderedListHeight;
		isResizing = true;
		// Document-level listeners only for the duration of the resize drag.
		document.addEventListener('pointermove', onResizePointerMove);
		document.addEventListener('pointerup', onResizePointerUp);
		document.addEventListener('pointercancel', onResizePointerUp);
	}

	function onResizeDoubleClick() {
		// Reset to auto-fit.
		userListHeight = null;
	}
</script>

<Popover side="bottom" align="start">
	{#snippet trigger({ toggle, props })}
		<Button
			type="menu"
			title="Pages"
			ariaLabel="Page menu"
			onclick={toggle}
			{...props}
			data-testid="page-menu.button"
		>
			<span class="tlui-page-menu__current">{currentPage?.name ?? 'Page'}</span>
			<Icon icon="chevron-down" small label="" />
		</Button>
	{/snippet}

	<div class="tlui-page-menu" data-testid="page-menu.list">
		<div class="tlui-page-menu__header">
			<span class="tlui-page-menu__title">Pages</span>
			<Button
				type="icon"
				title="New page"
				ariaLabel="New page"
				onclick={newPage}
				data-testid="page-menu.create"
			>
				<Icon icon="plus" small label="New page" />
			</Button>
		</div>

		<div class="tlui-page-menu__list" style:height="{renderedListHeight}px">
			<div
				class="tlui-page-menu__list__content"
				data-dragging={dragState !== null}
				style:height="{contentHeight}px"
			>
				{#each pages.current as page, index (page.id)}
					{@const isDragging = dragState?.id === page.id}
					<div
						class="tlui-page-menu__row"
						class:tlui-page-menu__row--active={page.id === currentPageId.current}
						data-testid="page-menu.item"
						data-iscurrent={page.id === currentPageId.current}
						data-dragging={isDragging}
						style:transform="translateY({rowY(index)}px)"
						style:z-index={isDragging
							? pages.current.length + 2
							: page.id === currentPageId.current
								? pages.current.length + 1
								: index}
					>
						{#if editingId === page.id}
							<!-- eslint-disable-next-line svelte/no-autofocus -->
							<input
								class="tlui-page-menu__rename"
								bind:value={draftName}
								onblur={commitRename}
								onkeydown={(e) => {
									if (e.key === 'Enter') commitRename();
									else if (e.key === 'Escape') editingId = null;
								}}
								aria-label="Page name"
							/>
						{:else}
							<button
								class="tlui-page-menu__item__drag-handle"
								type="button"
								title="Reorder page"
								aria-label="Reorder page"
								onpointerdown={(e) => onHandlePointerDown(e, page.id, index)}
							>
								<Icon icon="drag-handle-dots" small label="Reorder" />
							</button>
							<button
								class="tlui-page-menu__name"
								type="button"
								onclick={() => onRowClick(page.id)}
								ondblclick={() => startRename(page.id, page.name)}
							>
								{page.name}
							</button>
							<button
								class="tlui-page-menu__action"
								type="button"
								title="Rename"
								aria-label="Rename page"
								onclick={() => startRename(page.id, page.name)}
							>
								<Icon icon="tool-text" small label="Rename" />
							</button>
							<button
								class="tlui-page-menu__action"
								type="button"
								title="Duplicate"
								aria-label="Duplicate page"
								onclick={() => duplicate(page.id)}
							>
								<Icon icon="duplicate" small label="Duplicate" />
							</button>
							<button
								class="tlui-page-menu__action"
								type="button"
								title="Delete"
								aria-label="Delete page"
								disabled={pages.current.length <= 1}
								onclick={() => remove(page.id)}
							>
								<Icon icon="trash" small label="Delete" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div
			class="tlui-page-menu__resize-handle"
			data-resizing={isResizing}
			role="separator"
			aria-orientation="horizontal"
			aria-label="Resize page list"
			onpointerdown={onResizePointerDown}
			ondblclick={onResizeDoubleClick}
		></div>
	</div>
</Popover>

<style>
	.tlui-page-menu__current {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tlui-page-menu {
		display: flex;
		flex-direction: column;
		min-width: 220px;
	}
	.tlui-page-menu__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2px 4px 4px 8px;
		border-bottom: 1px solid var(--tl-color-divider, #e8e8e8);
	}
	.tlui-page-menu__title {
		font: 600 12px/1 var(--tl-font-sans);
		color: var(--tl-color-text-secondary, #6b6b6b);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	/* Scroll container: a fixed-height, vertically scrollable viewport whose
	   height is driven by renderedListHeight (auto-fit or user-pinned). */
	.tlui-page-menu__list {
		flex: 0 0 auto;
		overflow-x: hidden;
		overflow-y: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.tlui-page-menu__list::-webkit-scrollbar {
		display: none;
	}
	/* The rows live here, absolutely positioned and translated by rowY() so they
	   can slide around the dragged row (matches upstream __list__content). */
	.tlui-page-menu__list__content {
		position: relative;
		overflow: hidden;
	}
	.tlui-page-menu__row {
		position: absolute;
		top: 0;
		inset-inline-start: 0;
		width: 100%;
		height: 40px;
		display: flex;
		align-items: center;
		gap: 2px;
		border-radius: 6px;
		padding-right: 2px;
		transition: transform 0.08s ease-out;
	}
	/* While a drag is in flight the dragged row should not animate (it must track
	   the cursor 1:1), matching upstream's data-dragging styles. */
	.tlui-page-menu__row[data-dragging='true'] {
		transition: none;
		background: var(--tl-color-panel, #fff);
		cursor: grabbing;
	}
	.tlui-page-menu__row--active {
		background: var(--tl-color-hover, #f0f0f0);
	}
	.tlui-page-menu__item__drag-handle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 28px;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--tl-color-text-3, #9b9b9b);
		cursor: grab;
		touch-action: none;
	}
	.tlui-page-menu__item__drag-handle:active {
		cursor: grabbing;
	}
	.tlui-page-menu__name {
		flex: 1 1 auto;
		min-width: 0;
		min-height: 32px;
		padding: 0 8px;
		border: none;
		background: transparent;
		color: var(--tl-color-text, #1d1d1d);
		font: 500 13px/1 var(--tl-font-sans);
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tlui-page-menu__rename {
		flex: 1 1 auto;
		min-height: 30px;
		margin: 1px 4px;
		padding: 0 6px;
		border: 1px solid var(--tl-color-selected, #4465e9);
		border-radius: 6px;
		font: 500 13px/1 var(--tl-font-sans);
		color: var(--tl-color-text, #1d1d1d);
		background: var(--tl-color-panel, #fff);
	}
	.tlui-page-menu__action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--tl-color-text, #1d1d1d);
		cursor: pointer;
	}
	.tlui-page-menu__action:hover:not(:disabled) {
		background: var(--tl-color-hover-strong, #e4e4e4);
	}
	.tlui-page-menu__action:disabled {
		opacity: 0.35;
		cursor: default;
	}
	/* Resize affordance at the bottom of the scroll container: a thin divider that
	   the user drags to pin the list height (ported from upstream __resize-handle). */
	.tlui-page-menu__resize-handle {
		flex: 0 0 auto;
		position: relative;
		height: 1px;
		margin-top: 2px;
		cursor: ns-resize;
		touch-action: none;
		background: var(--tl-color-divider, #e8e8e8);
		transition: background-color ease-in-out 150ms 80ms;
	}
	/* Enlarged hit area so the 1px divider is easy to grab. */
	.tlui-page-menu__resize-handle::after {
		content: '';
		position: absolute;
		inset: -4px 0;
		pointer-events: all;
	}
	/* Blue indicator while hovering / actively resizing. */
	.tlui-page-menu__resize-handle::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1.5px;
		background: transparent;
		pointer-events: none;
	}
	.tlui-page-menu__resize-handle:hover::before,
	.tlui-page-menu__resize-handle[data-resizing='true']::before {
		background: var(--tl-color-selected, #4465e9);
		transition: none;
	}
</style>
