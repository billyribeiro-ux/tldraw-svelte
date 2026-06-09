import type { SerializedSchema } from '@tldraw/store'
import type { TLAsset, TLBinding, TLShape, TLShapeId, TLUser } from '@tldraw/tlschema'

/** @public */
export interface TLContent {
	shapes: TLShape[]
	bindings: TLBinding[] | undefined
	rootShapeIds: TLShapeId[]
	assets: TLAsset[]
	schema: SerializedSchema
	users?: TLUser[]
}
