import { registerShapeComponent } from './registry';
import GeoShape from './geo/GeoShape.svelte';
import DrawShape from './draw/DrawShape.svelte';
import LineShape from './line/LineShape.svelte';
import ArrowShape from './arrow/ArrowShape.svelte';
import FrameShape from './frame/FrameShape.svelte';
import HighlightShape from './highlight/HighlightShape.svelte';
import TextShape from './text/TextShape.svelte';
import NoteShape from './note/NoteShape.svelte';
import ImageShape from './image/ImageShape.svelte';
import VideoShape from './video/VideoShape.svelte';
import BookmarkShape from './bookmark/BookmarkShape.svelte';
import EmbedShape from './embed/EmbedShape.svelte';

// Registers the Svelte renderer for each converted real tldraw shape, keyed by
// its real `type`. Imported once for its side effects when the editor mounts.
// Renderers are added here as each real shape is converted (Phase 1–2).
registerShapeComponent('geo', GeoShape as never);
registerShapeComponent('draw', DrawShape as never);
registerShapeComponent('line', LineShape as never);
registerShapeComponent('arrow', ArrowShape as never);
registerShapeComponent('frame', FrameShape as never);
registerShapeComponent('highlight', HighlightShape as never);
registerShapeComponent('text', TextShape as never);
registerShapeComponent('note', NoteShape as never);
registerShapeComponent('image', ImageShape as never);
registerShapeComponent('video', VideoShape as never);
registerShapeComponent('bookmark', BookmarkShape as never);
registerShapeComponent('embed', EmbedShape as never);
