import { StateNode, type TLStateNodeConstructor } from '@tldraw/editor';
import { Idle } from './childStates/Idle';
import { Lasering } from './childStates/Lasering';

/**
 * The real tldraw LaserTool, vendored as-is (it is framework-free — it drives
 * `editor.scribbles`). The scribbles it produces are rendered by the from-scratch
 * Scribble overlay in the Svelte canvas.
 *
 * @public
 */
export class LaserTool extends StateNode {
	static override id = 'laser';
	static override initial = 'idle';
	static override children(): TLStateNodeConstructor[] {
		return [Idle, Lasering];
	}
	static override isLockable = false;

	private sessionId: string | null = null;

	override onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 });
	}

	override onExit() {
		this.sessionId = null;
	}

	override onCancel() {
		if (this.sessionId && this.editor.scribbles.isSessionActive(this.sessionId)) {
			this.editor.scribbles.clearSession(this.sessionId);
			this.sessionId = null;
			this.transition('idle');
		} else {
			this.editor.setCurrentTool('select');
		}
	}

	getSessionId(): string {
		if (this.sessionId && this.editor.scribbles.isSessionActive(this.sessionId)) {
			return this.sessionId;
		}

		this.sessionId = this.editor.scribbles.startSession({
			selfConsume: false,
			idleTimeoutMs: this.editor.options.laserDelayMs,
			fadeMode: 'grouped',
			fadeEasing: 'ease-in'
		});

		return this.sessionId;
	}
}
