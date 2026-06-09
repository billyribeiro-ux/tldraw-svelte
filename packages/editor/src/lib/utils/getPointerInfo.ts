import type { Editor } from '../editor/Editor'
import { isAccelKey } from './keyboard'

// NOTE (Svelte port): the original accepted `React.PointerEvent | PointerEvent`.
// The Svelte canvas dispatches NATIVE DOM events, so we narrow to the native
// `PointerEvent`, which satisfies both `markEventAsHandled` and `isAccelKey`
// and removes the React dependency.

/** @public */
export function getPointerInfo(editor: Editor, e: PointerEvent) {
	editor.markEventAsHandled(e)

	return {
		point: {
			x: e.clientX,
			y: e.clientY,
			z: e.pressure,
		},
		shiftKey: e.shiftKey,
		altKey: e.altKey,
		ctrlKey: e.metaKey || e.ctrlKey,
		metaKey: e.metaKey,
		accelKey: isAccelKey(e),
		pointerId: e.pointerId,
		button: e.button,
		isPen: e.pointerType === 'pen',
	}
}
