<script lang="ts">
	import type { TLPageId } from '@tldraw/editor';
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from '../primitives/Button.svelte';
	import Popover from '../primitives/Popover.svelte';
	import Icon from '../Icon.svelte';

	// From-scratch PageMenu (port of tldraw's PageMenu): lists the real pages, lets
	// you switch/create/rename/duplicate/delete them via the editor's page API. The
	// current page name labels the trigger. Renaming is inline (no window.prompt).
	const editor = getEditor();

	const pages = fromComputed('pages', () => editor.getPages());
	const currentPageId = fromComputed('current page id', () => editor.getCurrentPageId());
	const currentPage = $derived(
		pages.current.find((p) => p.id === currentPageId.current) ?? pages.current[0]
	);

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

		{#each pages.current as page (page.id)}
			<div
				class="tlui-page-menu__row"
				class:tlui-page-menu__row--active={page.id === currentPageId.current}
				data-testid="page-menu.item"
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
						class="tlui-page-menu__name"
						type="button"
						onclick={() => editor.setCurrentPage(page.id)}
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
	.tlui-page-menu__row {
		display: flex;
		align-items: center;
		gap: 2px;
		border-radius: 6px;
		padding-right: 2px;
	}
	.tlui-page-menu__row--active {
		background: var(--tl-color-hover, #f0f0f0);
	}
	.tlui-page-menu__name {
		flex: 1 1 auto;
		min-height: 32px;
		padding: 0 8px;
		border: none;
		background: transparent;
		color: var(--tl-color-text, #1d1d1d);
		font: 500 13px/1 var(--tl-font-sans);
		text-align: left;
		cursor: pointer;
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
</style>
