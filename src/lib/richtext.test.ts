import { describe, it, expect } from 'vitest';
import {
	isEmptyRichText,
	renderPlaintextFromRichText,
	renderHtmlFromRichTextForMeasurement
} from '@tldraw/tldraw/src/lib/utils/text/richText';
import { toRichText } from '@tldraw/tlschema';

const editor = {} as never;

describe('from-scratch richText (no tiptap)', () => {
	it('isEmptyRichText', () => {
		expect(isEmptyRichText(toRichText(''))).toBe(true);
		expect(isEmptyRichText(toRichText('hi'))).toBe(false);
	});
	it('renderPlaintextFromRichText round-trips lines', () => {
		expect(renderPlaintextFromRichText(editor, toRichText('a\nb\nc'))).toBe('a\nb\nc');
		expect(renderPlaintextFromRichText(editor, toRichText('hello world'))).toBe('hello world');
	});
	it('renderHtmlForMeasurement wraps + escapes', () => {
		const html = renderHtmlFromRichTextForMeasurement(editor, toRichText('a<b>'));
		expect(html).toContain('tl-rich-text');
		expect(html).toContain('&lt;b&gt;');
	});
});
