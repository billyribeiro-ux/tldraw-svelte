import type { Editor, TLHandle, TLNoteShape, TLPointerEventInfo} from '@tldraw/editor';
import { StateNode, Vec } from '@tldraw/editor'
// guarded: arrow not yet converted — these live in shapes/arrow/*. All call sites are
// already gated behind editor.isShapeOfType(shape, 'arrow'), which is never true for geo,
// so these stand-ins are unreachable at runtime for converted shapes.
const updateArrowTargetState = (_opts: any): void => {}
const getArrowBindings = (_editor: Editor, _shape: any): any => ({})
// guarded: note not yet converted — these live in shapes/note/noteHelpers. All call sites
// are gated behind editor.isShapeOfType(shape, 'note'), never true for geo.
const getNoteAdjacentPositions = (_editor: Editor, _opts: any): Record<string, Vec | undefined> =>
	({})
const getNoteShapeForAdjacentPosition = (_editor: Editor, _opts: any): TLNoteShape | undefined =>
	undefined
// guarded: note not yet converted — NoteShapeUtil type replaced with `any`.
type NoteShapeUtil = any
// guarded: note not yet converted — NoteShapeUtil's display values normally carry these dims.
type NoteDisplayValues = { noteWidth: number; noteHeight: number }
import { getDisplayValues } from '../../../shapes/shared/getDisplayValues'
import { startEditingShapeWithRichText } from '../selectHelpers'

export class PointingHandle extends StateNode {
	static override id = 'pointing_handle'

	didCtrlOnEnter = false

	info = {} as TLPointerEventInfo & { target: 'handle' }

	override onEnter(info: TLPointerEventInfo & { target: 'handle' }) {
		this.info = info

		this.didCtrlOnEnter = info.accelKey

		const { shape } = info
		if (this.editor.isShapeOfType(shape, 'arrow')) {
			const initialBindings = getArrowBindings(this.editor, shape)
			const currentBinding = initialBindings[info.handle.id as 'start' | 'end']
			const oppositeBinding = initialBindings[info.handle.id === 'start' ? 'end' : 'start']
			const arrowTransform = this.editor.getShapePageTransform(shape.id)!

			if (currentBinding) {
				updateArrowTargetState({
					editor: this.editor,
					pointInPageSpace: arrowTransform.applyToPoint(info.handle),
					arrow: shape,
					isPrecise: currentBinding.props.isPrecise,
					currentBinding: currentBinding,
					oppositeBinding: oppositeBinding,
				})
			}
		}

		this.editor.setCursor({ type: 'grabbing', rotation: 0 })
	}

	override onExit() {
		this.editor.setHintingShapes([])
		this.editor.setCursor({ type: 'default', rotation: 0 })
	}

	override onPointerUp() {
		const { shape, handle } = this.info

		if (this.editor.isShapeOfType(shape, 'note')) {
			const { editor } = this
			const nextNote = getNoteForAdjacentPosition(editor, shape, handle, false)
			if (nextNote) {
				startEditingShapeWithRichText(editor, nextNote, { selectAll: true })
				return
			}
		}

		this.parent.transition('idle', this.info)
	}

	override onPointerMove(info: TLPointerEventInfo) {
		const { editor } = this
		if (editor.inputs.getIsDragging()) {
			if (this.didCtrlOnEnter) {
				this.parent.transition('brushing', info)
			} else {
				this.startDraggingHandle()
			}
		}
	}

	override onLongPress() {
		this.startDraggingHandle()
	}

	private startDraggingHandle() {
		const { editor } = this
		if (editor.getIsReadonly()) return
		const { shape, handle } = this.info

		if (editor.isShapeOfType(shape, 'note')) {
			const noteUtil = editor.getShapeUtil(shape) as NoteShapeUtil
			const dv = getDisplayValues(noteUtil, shape) as NoteDisplayValues

			const nextNote = getNoteForAdjacentPosition(editor, shape, handle, true)
			if (nextNote) {
				// Center the shape on the current pointer
				const centeredOnPointer = editor
					.getPointInParentSpace(nextNote, editor.inputs.getOriginPagePoint())
					.sub(
						Vec.Rot(
							new Vec(dv.noteWidth / 2, dv.noteHeight / 2).mul(shape.props.scale),
							nextNote.rotation
						)
					)
				editor.updateShape({ ...nextNote, x: centeredOnPointer.x, y: centeredOnPointer.y })

				// Then select and begin translating the shape
				editor
					.setHoveredShape(nextNote.id) // important!
					.select(nextNote.id)
					.setCurrentTool('select.translating', {
						...this.info,
						target: 'shape',
						shape: editor.getShape(nextNote),
						onInteractionEnd: 'note',
						isCreating: true,
						onCreate: () => {
							// When we're done, start editing it
							startEditingShapeWithRichText(editor, nextNote, { selectAll: true })
						},
					})
				return
			}
		}

		this.parent.transition('dragging_handle', this.info)
	}

	override onCancel() {
		this.cancel()
	}

	override onComplete() {
		this.cancel()
	}

	override onInterrupt() {
		this.cancel()
	}

	private cancel() {
		this.parent.transition('idle')
	}
}

function getNoteForAdjacentPosition(
	editor: Editor,
	shape: TLNoteShape,
	handle: TLHandle,
	forceNew: boolean
) {
	const noteUtil = editor.getShapeUtil(shape) as NoteShapeUtil
	const dv = getDisplayValues(noteUtil, shape) as NoteDisplayValues

	const pageTransform = editor.getShapePageTransform(shape.id)!
	const pagePoint = pageTransform.point()
	const pageRotation = pageTransform.rotation()
	const positions = getNoteAdjacentPositions(editor, {
		pagePoint,
		pageRotation,
		growY: shape.props.growY * shape.props.scale,
		extraHeight: 0,
		scale: shape.props.scale,
		noteWidth: dv.noteWidth,
		noteHeight: dv.noteHeight,
	})
	const position = positions[handle.index]
	if (position) {
		return getNoteShapeForAdjacentPosition(editor, {
			shape,
			center: position,
			pageRotation,
			noteWidth: dv.noteWidth,
			noteHeight: dv.noteHeight,
			forceNew,
		})
	}
	return undefined
}
