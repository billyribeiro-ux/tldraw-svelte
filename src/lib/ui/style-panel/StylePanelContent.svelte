<script lang="ts">
	import {
		DefaultColorStyle,
		DefaultFillStyle,
		DefaultDashStyle,
		DefaultSizeStyle,
		DefaultFontStyle,
		DefaultTextAlignStyle,
		DefaultHorizontalAlignStyle,
		DefaultVerticalAlignStyle,
		GeoShapeGeoStyle,
		ArrowShapeKindStyle,
		ArrowShapeArrowheadStartStyle,
		ArrowShapeArrowheadEndStyle,
		LineShapeSplineStyle
	} from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import OpacityPicker from './OpacityPicker.svelte';
	import StylePropPicker from './StylePropPicker.svelte';
	import StyleDropdownPicker from './StyleDropdownPicker.svelte';
	import StyleDoubleDropdownPicker from './StyleDoubleDropdownPicker.svelte';

	// The style-panel body — the 4 sectioned groups of pickers, shared by the desktop
	// StylePanel and the MobileStylePanel popover. Shows exactly the pickers whose
	// StyleProp is present in the selection (tldraw's DefaultStylePanelContent). The
	// composition mirrors DefaultStylePanelContent.tsx section-for-section:
	//   1. color + opacity
	//   2. fill (inline none/semi/solid + an "extra" dropdown), dash, size
	//   3. font, text-align, label-align (+ vertical-align), geo lives in section 4
	//   4. geo, arrow-kind, arrowheads (double dropdown), spline
	let { model }: { model: StylePanelModel } = $props();

	const styles = $derived(model.styles.current);
	const has = $derived({
		color: !!styles.get(DefaultColorStyle),
		fill: !!styles.get(DefaultFillStyle),
		dash: !!styles.get(DefaultDashStyle),
		size: !!styles.get(DefaultSizeStyle),
		font: !!styles.get(DefaultFontStyle),
		textAlign: !!styles.get(DefaultTextAlignStyle),
		halign: !!styles.get(DefaultHorizontalAlignStyle),
		valign: !!styles.get(DefaultVerticalAlignStyle),
		geo: !!styles.get(GeoShapeGeoStyle),
		arrowKind: !!styles.get(ArrowShapeKindStyle),
		arrowheadStart: !!styles.get(ArrowShapeArrowheadStartStyle),
		arrowheadEnd: !!styles.get(ArrowShapeArrowheadEndStyle),
		spline: !!styles.get(LineShapeSplineStyle)
	});

	// Option tables. Icon names are tldraw's real style-icon mask fragments (verified
	// against tldraw's styles.tsx STYLES table). Dash order matches tldraw exactly:
	// draw, dashed, dotted, solid.
	//
	// FILL splits into the inline trio (none/semi/solid) shown as button-picker items,
	// and an "extra" dropdown built from the ACTUAL DefaultFillStyle enum minus those
	// three — so it tracks whatever the engine declares (pattern/fill/lined-fill today).
	const FILL_INLINE = new Set<string>(['none', 'semi', 'solid']);
	const FILL_LABELS: Record<string, string> = {
		none: 'None',
		semi: 'Semi',
		solid: 'Solid',
		pattern: 'Pattern',
		fill: 'Fill',
		'lined-fill': 'Lined fill'
	};
	// Iterate the ACTUAL enum so order + membership track whatever the engine declares.
	const fillOptions = DefaultFillStyle.values
		.filter((v) => FILL_INLINE.has(v))
		.map((v) => ({ value: v, label: FILL_LABELS[v] ?? v, icon: `fill-${v}` }));
	const fillExtraOptions = DefaultFillStyle.values
		.filter((v) => !FILL_INLINE.has(v))
		.map((v) => ({ value: v, label: FILL_LABELS[v] ?? v.replace(/-/g, ' '), icon: `fill-${v}` }));

	const dashOptions = [
		{ value: 'draw' as const, label: 'Draw', icon: 'dash-draw' },
		{ value: 'dashed' as const, label: 'Dashed', icon: 'dash-dashed' },
		{ value: 'dotted' as const, label: 'Dotted', icon: 'dash-dotted' },
		{ value: 'solid' as const, label: 'Solid', icon: 'dash-solid' }
	];
	const sizeOptions = [
		{ value: 's' as const, label: 'Small', icon: 'size-small' },
		{ value: 'm' as const, label: 'Medium', icon: 'size-medium' },
		{ value: 'l' as const, label: 'Large', icon: 'size-large' },
		{ value: 'xl' as const, label: 'Extra large', icon: 'size-extra-large' }
	];
	const fontOptions = [
		{ value: 'draw' as const, label: 'Draw', icon: 'font-draw' },
		{ value: 'sans' as const, label: 'Sans', icon: 'font-sans' },
		{ value: 'serif' as const, label: 'Serif', icon: 'font-serif' },
		{ value: 'mono' as const, label: 'Mono', icon: 'font-mono' }
	];
	// Text-align (DefaultTextAlignStyle) — tldraw's STYLES.textAlign icons.
	const textAlignOptions = [
		{ value: 'start' as const, label: 'Left', icon: 'text-align-left' },
		{ value: 'middle' as const, label: 'Center', icon: 'text-align-center' },
		{ value: 'end' as const, label: 'Right', icon: 'text-align-right' }
	];
	// Label-align (DefaultHorizontalAlignStyle) — kept at uiType="align" for e2e parity.
	const halignOptions = [
		{ value: 'start' as const, label: 'Left', icon: 'horizontal-align-start' },
		{ value: 'middle' as const, label: 'Center', icon: 'horizontal-align-middle' },
		{ value: 'end' as const, label: 'Right', icon: 'horizontal-align-end' }
	];
	const valignOptions = [
		{ value: 'start' as const, label: 'Top', icon: 'vertical-align-start' },
		{ value: 'middle' as const, label: 'Middle', icon: 'vertical-align-middle' },
		{ value: 'end' as const, label: 'Bottom', icon: 'vertical-align-end' }
	];
	const geoOptions = GeoShapeGeoStyle.values.map((v) => ({
		value: v,
		label: v.replace(/-/g, ' '),
		icon: `geo-${v}`
	}));
	// Arrow kind (ArrowShapeKindStyle) — tldraw's STYLES.arrowKind icons.
	const arrowKindOptions = [
		{ value: 'arc' as const, label: 'Curved', icon: 'arrow-arc' },
		{ value: 'elbow' as const, label: 'Elbow', icon: 'arrow-elbow' }
	];
	// Arrowhead icons per tldraw's styles.tsx (note 'inverted' → arrowhead-triangle-
	// inverted; 'pipe' has no dedicated icon so it reuses the bar glyph).
	const ARROWHEAD_ICON: Record<string, string> = {
		none: 'arrowhead-none',
		arrow: 'arrowhead-arrow',
		triangle: 'arrowhead-triangle',
		square: 'arrowhead-square',
		dot: 'arrowhead-dot',
		diamond: 'arrowhead-diamond',
		inverted: 'arrowhead-triangle-inverted',
		bar: 'arrowhead-bar',
		pipe: 'arrowhead-bar'
	};
	const arrowheadStartOptions = ArrowShapeArrowheadStartStyle.values.map((v) => ({
		value: v,
		label: v,
		icon: ARROWHEAD_ICON[v] ?? 'arrowhead-arrow'
	}));
	const arrowheadEndOptions = ArrowShapeArrowheadEndStyle.values.map((v) => ({
		value: v,
		label: v,
		icon: ARROWHEAD_ICON[v] ?? 'arrowhead-arrow'
	}));
	const splineOptions = [
		{ value: 'line' as const, label: 'Line', icon: 'spline-line' },
		{ value: 'cubic' as const, label: 'Curved', icon: 'spline-cubic' }
	];
</script>

<div class="tlui-style-panel__section">
	{#if has.color}
		<ColorPicker {model} />
	{/if}
	<OpacityPicker {model} />
</div>

{#if has.fill || has.dash || has.size}
	<div class="tlui-style-panel__section">
		{#if has.fill}
			<!-- tldraw's StylePanelFillPicker: the inline none/semi/solid buttons and the
			     "extra" fill dropdown share one toolbar row. Inline items keep testids
			     style.fill.none/.semi/.solid; the extra dropdown is style.fill-extra. -->
			<div class="tlui-style-panel__fill-row">
				<StylePropPicker
					{model}
					prop={DefaultFillStyle}
					title="Fill"
					uiType="fill"
					options={fillOptions}
				/>
				{#if fillExtraOptions.length > 0}
					<StyleDropdownPicker
						{model}
						prop={DefaultFillStyle}
						title="Fill"
						uiType="fill"
						testIdType="fill-extra"
						inline
						sideOffset={116}
						options={fillExtraOptions}
					/>
				{/if}
			</div>
		{/if}
		{#if has.dash}
			<StylePropPicker
				{model}
				prop={DefaultDashStyle}
				title="Dash"
				uiType="dash"
				options={dashOptions}
			/>
		{/if}
		{#if has.size}
			<StylePropPicker
				{model}
				prop={DefaultSizeStyle}
				title="Size"
				uiType="size"
				options={sizeOptions}
			/>
		{/if}
	</div>
{/if}

{#if has.font || has.textAlign || has.halign || has.valign}
	<div class="tlui-style-panel__section">
		{#if has.font}
			<StylePropPicker
				{model}
				prop={DefaultFontStyle}
				title="Font"
				uiType="font"
				options={fontOptions}
			/>
		{/if}
		{#if has.textAlign}
			<!-- Text alignment (DefaultTextAlignStyle). New uiType="textAlign" so its
			     testids never collide with the label-align picker at uiType="align". -->
			<StylePropPicker
				{model}
				prop={DefaultTextAlignStyle}
				title="Align"
				uiType="textAlign"
				options={textAlignOptions}
			/>
		{/if}
		{#if has.halign}
			<StylePropPicker
				{model}
				prop={DefaultHorizontalAlignStyle}
				title="Align"
				uiType="align"
				options={halignOptions}
			/>
		{/if}
		{#if has.valign}
			<StylePropPicker
				{model}
				prop={DefaultVerticalAlignStyle}
				title="Vertical align"
				uiType="verticalAlign"
				options={valignOptions}
			/>
		{/if}
	</div>
{/if}

{#if has.geo || has.arrowKind || has.spline || (has.arrowheadStart && has.arrowheadEnd)}
	<div class="tlui-style-panel__section">
		<!-- Large enums use dropdowns (tldraw's StylePanelDropdownPicker) — a single
		     button showing the current value, not a row of every option. -->
		{#if has.geo}
			<StyleDropdownPicker
				{model}
				prop={GeoShapeGeoStyle}
				title="Shape"
				uiType="geo"
				options={geoOptions}
			/>
		{/if}
		{#if has.arrowKind}
			<StyleDropdownPicker
				{model}
				prop={ArrowShapeKindStyle}
				title="Arrow"
				uiType="arrow-kind"
				options={arrowKindOptions}
			/>
		{/if}
		{#if has.arrowheadStart && has.arrowheadEnd}
			<!-- One labelled row with both arrowheads side by side (tldraw's
			     StylePanelDoubleDropdownPicker). Halves keep style.arrowheadStart /
			     style.arrowheadEnd testids. -->
			<StyleDoubleDropdownPicker
				{model}
				label="Arrowheads"
				uiTypeA="arrowheadStart"
				styleA={ArrowShapeArrowheadStartStyle}
				itemsA={arrowheadStartOptions}
				labelA="Arrowhead start"
				uiTypeB="arrowheadEnd"
				styleB={ArrowShapeArrowheadEndStyle}
				itemsB={arrowheadEndOptions}
				labelB="Arrowhead end"
			/>
		{/if}
		{#if has.spline}
			<StyleDropdownPicker
				{model}
				prop={LineShapeSplineStyle}
				title="Spline"
				uiType="spline"
				options={splineOptions}
			/>
		{/if}
	</div>
{/if}

<style>
	/* Ported from tldraw ui.css: .tlui-style-panel__section is a bare flex column —
	   NO padding/gap (children own their spacing: button rows are 40px, the color
	   grid pads 2px, the slider pads horizontally). Border-bottom on non-last
	   sections; a section ending in the opacity slider gets margin-bottom:7px for
	   visual balance (tldraw's :has(.tlui-slider__container:last-child) rule). */
	.tlui-style-panel__section {
		display: flex;
		flex-direction: column;
	}
	.tlui-style-panel__section:not(:last-child) {
		border-bottom: 1px solid var(--tl-color-divider, #e8e8e8);
	}
	.tlui-style-panel__section:has(:global(.tlui-slider__container:last-child)):not(:last-child) {
		margin-bottom: 7px;
	}
	/* tldraw's StylePanelFillPicker toolbar: the inline button-picker row and the extra
	   dropdown trigger sit in one horizontal row. The inline picker's own -2px collapse
	   keeps the trio at 3×40−padding; the extra 40px trigger trails it. */
	.tlui-style-panel__fill-row {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	.tlui-style-panel__fill-row :global(.tlui-style-row) {
		flex: 0 0 auto;
	}
	.tlui-style-panel__fill-row :global(.tlui-style-panel__dropdown-picker) {
		flex: 0 0 auto;
	}
</style>
