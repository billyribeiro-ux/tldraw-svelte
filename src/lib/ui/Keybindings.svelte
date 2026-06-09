<script lang="ts">
	import { getEditor, getActions, getTools } from '$lib/ui/context';

	// From-scratch keyboard-shortcuts binder — the port of tldraw's
	// `useKeyboardShortcuts`. Binds every action's and tool's `kbd` to fire its
	// `onSelect('kbd')`. Shortcuts are ignored while typing in inputs/
	// contenteditable or while a shape is being edited.
	const editor = getEditor();
	const actions = getActions();
	const tools = getTools();

	// Parse a tldraw kbd string into { mods, key }. Supports shorthand
	// ($=accel, !=shift, ?=alt) and the "cmd+x,ctrl+x" longhand (first variant).
	type Combo = { accel: boolean; shift: boolean; alt: boolean; key: string };
	function parseKbd(kbd: string): Combo {
		const first = kbd.split(',')[0].trim();
		let accel = false,
			shift = false,
			alt = false;
		let rest = first;
		// longhand
		rest = rest
			.replace(/cmd\+|ctrl\+/i, () => ((accel = true), ''))
			.replace(/shift\+/i, () => ((shift = true), ''))
			.replace(/alt\+/i, () => ((alt = true), ''));
		// shorthand prefixes
		let key = '';
		for (const ch of rest) {
			if (ch === '$') accel = true;
			else if (ch === '!') shift = true;
			else if (ch === '?') alt = true;
			else key += ch;
		}
		return { accel, shift, alt, key: key.toLowerCase() };
	}

	function matches(combo: Combo, e: KeyboardEvent): boolean {
		const accel = e.metaKey || e.ctrlKey;
		if (combo.accel !== accel) return false;
		if (combo.shift !== e.shiftKey) return false;
		if (combo.alt !== e.altKey) return false;
		const k = e.key.toLowerCase();
		// Map special keys
		if (combo.key === '⌫') return k === 'backspace' || k === 'delete';
		return k === combo.key;
	}

	// Precompute combos for all actions + tools.
	const bindings = $derived.by(() => {
		const out: Array<{ combo: Combo; run: () => void }> = [];
		for (const a of Object.values(actions)) {
			if (a.kbd) out.push({ combo: parseKbd(a.kbd), run: () => a.onSelect('kbd') });
		}
		for (const t of Object.values(tools)) {
			if (t.kbd) out.push({ combo: parseKbd(t.kbd), run: () => t.onSelect('kbd') });
		}
		return out;
	});

	function onkeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (
			target &&
			(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
		) {
			return;
		}
		if (editor.getEditingShapeId()) return; // don't fire while editing a shape

		for (const { combo, run } of bindings) {
			if (matches(combo, e)) {
				e.preventDefault();
				run();
				return;
			}
		}
	}
</script>

<svelte:window {onkeydown} />
