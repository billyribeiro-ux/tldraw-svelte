<script lang="ts">
	import { getEditor, getActions, getTools } from '$lib/ui/context';

	// From-scratch keyboard-shortcuts binder — the port of tldraw's
	// `useKeyboardShortcuts`. Binds every action's and tool's `kbd` to fire its
	// `onSelect('kbd')`. Shortcuts are ignored while typing in inputs/
	// contenteditable or while a shape is being edited.
	const editor = getEditor();
	const actions = getActions();
	const tools = getTools();

	// Parse a tldraw kbd string into one or more { mods, key } combos. A single
	// kbd can list several comma-separated variants (e.g. "z,!z" or "d,b,x"), and
	// ANY of them should fire — the old parser only bound the first. Each variant
	// supports the shorthand ($=accel, !=shift, ?=alt) and "cmd+x,ctrl+x" longhand.
	// Mirrors upstream parseKbd/getKeys from useKeyboardShortcuts.ts.
	type Combo = { accel: boolean; shift: boolean; alt: boolean; key: string };

	// Named-key aliases (lowercased event.key values).
	const KEY_ALIASES: Record<string, string> = {
		'⌫': 'backspace',
		del: 'delete',
		esc: 'escape',
		enter: 'enter',
		space: ' ',
		left: 'arrowleft',
		right: 'arrowright',
		up: 'arrowup',
		down: 'arrowdown'
	};

	// When shift is held, event.key reports the shifted glyph (e.g. '?' for shift+/,
	// '<' for shift+,). Map those back to the base key so a `shift+/`-style shortcut
	// definition still matches. Without this, alt/shift shortcuts whose base key is a
	// shifted symbol would never fire.
	const SHIFT_KEY_TO_BASE: Record<string, string> = {
		'<': ',',
		'>': '.',
		'?': '/',
		':': ';',
		'"': "'",
		'{': '[',
		'}': ']',
		'|': '\\',
		_: '-',
		'+': '=',
		'~': '`',
		'!': '1',
		'@': '2',
		'#': '3',
		$: '4',
		'%': '5',
		'^': '6',
		'&': '7',
		'*': '8',
		'(': '9',
		')': '0'
	};

	// Split a kbd string on commas, treating an empty entry produced by "x,," as a
	// literal trailing comma on the previous entry (so "shift+,,shift+alt+," yields
	// the two real variants "shift+," and "shift+alt+,"). Port of hotkeys-js getKeys.
	function getKeys(key: string): string[] {
		key = key.replace(/\s/g, '');
		const keys = key.split(',');
		let index = keys.lastIndexOf('');
		for (; index >= 0; ) {
			keys[index - 1] += ',';
			keys.splice(index, 1);
			index = keys.lastIndexOf('');
		}
		return keys;
	}

	function parseVariant(variant: string): Combo | null {
		let accel = false,
			shift = false,
			alt = false;
		let rest = variant;
		// longhand modifiers (replaceAll so cmd+shift+x captures every modifier)
		rest = rest
			.replace(/cmd\+|ctrl\+/gi, () => ((accel = true), ''))
			.replace(/shift\+/gi, () => ((shift = true), ''))
			.replace(/alt\+/gi, () => ((alt = true), ''));
		// shorthand prefixes ($/!/?); whatever remains is the literal key (may be ',')
		let key = '';
		for (const ch of rest) {
			if (ch === '$') accel = true;
			else if (ch === '!') shift = true;
			else if (ch === '?') alt = true;
			else key += ch;
		}
		if (!key) return null;
		key = key.toLowerCase();
		if (KEY_ALIASES[key]) key = KEY_ALIASES[key];
		return { accel, shift, alt, key };
	}

	function parseKbd(kbd: string): Combo[] {
		const out: Combo[] = [];
		for (const variant of getKeys(kbd)) {
			const combo = parseVariant(variant);
			if (combo) out.push(combo);
		}
		return out;
	}

	function matches(combo: Combo, e: KeyboardEvent): boolean {
		const accel = e.metaKey || e.ctrlKey;
		if (combo.accel !== accel) return false;
		if (combo.shift !== e.shiftKey) return false;
		if (combo.alt !== e.altKey) return false;
		let k = e.key.toLowerCase();
		// Special multi-key alias: backspace OR delete both fire ⌫.
		if (combo.key === 'backspace' || combo.key === 'delete') {
			return k === 'backspace' || k === 'delete';
		}
		// Reverse the shift-glyph so e.g. shift+/ (reported as '?') matches base '/'.
		if (e.shiftKey && SHIFT_KEY_TO_BASE[k]) k = SHIFT_KEY_TO_BASE[k];
		return k === combo.key;
	}

	// Precompute combos for all actions + tools. Each entry can hold several combos
	// (comma variants); the handler fires if ANY of them matches.
	const bindings = $derived.by(() => {
		const out: Array<{ combos: Combo[]; run: () => void }> = [];
		for (const a of Object.values(actions)) {
			if (a.kbd) out.push({ combos: parseKbd(a.kbd), run: () => a.onSelect('kbd') });
		}
		for (const t of Object.values(tools)) {
			if (t.kbd) out.push({ combos: parseKbd(t.kbd), run: () => t.onSelect('kbd') });
		}
		return out;
	});

	function onkeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
			return;
		}
		if (editor.getEditingShapeId()) return; // don't fire while editing a shape

		for (const { combos, run } of bindings) {
			if (combos.some((combo) => matches(combo, e))) {
				e.preventDefault();
				run();
				return;
			}
		}
	}
</script>

<svelte:window {onkeydown} />
