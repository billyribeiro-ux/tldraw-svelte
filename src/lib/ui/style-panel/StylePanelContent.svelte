<script lang="ts">
	import {
		DefaultColorStyle,
		DefaultFillStyle,
		DefaultDashStyle,
		DefaultSizeStyle,
		DefaultFontStyle,
		DefaultHorizontalAlignStyle,
		DefaultVerticalAlignStyle,
		GeoShapeGeoStyle,
		ArrowShapeArrowheadStartStyle,
		ArrowShapeArrowheadEndStyle,
		LineShapeSplineStyle
	} from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import OpacityPicker from './OpacityPicker.svelte';
	import StylePropPicker from './StylePropPicker.svelte';
	import StyleDropdownPicker from './StyleDropdownPicker.svelte';

	// The style-panel body — the 4 sectioned groups of pickers, shared by the desktop
	// StylePanel and the MobileStylePanel popover. Shows exactly the pickers whose
	// StyleProp is present in the selection (tldraw's DefaultStylePanelContent).
	let { model }: { model: StylePanelModel } = $props();

	const styles = $derived(model.styles.current);
	const has = $derived({
		color: !!styles.get(DefaultColorStyle),
		fill: !!styles.get(DefaultFillStyle),
		dash: !!styles.get(DefaultDashStyle),
		size: !!styles.get(DefaultSizeStyle),
		font: !!styles.get(DefaultFontStyle),
		halign: !!styles.get(DefaultHorizontalAlignStyle),
		valign: !!styles.get(DefaultVerticalAlignStyle),
		geo: !!styles.get(GeoShapeGeoStyle),
		arrowheadStart: !!styles.get(ArrowShapeArrowheadStartStyle),
		arrowheadEnd: !!styles.get(ArrowShapeArrowheadEndStyle),
		spline: !!styles.get(LineShapeSplineStyle)
	});

	// Option tables. Icon names are tldraw's real style-icon mask fragments (verified
	// against the live DOM): fill-*, dash-*, size-*, font-*, *-align-*. Fill's
	// 'pattern' is in tldraw a trailing dropdown; we keep it inline as a 4th button.
	// Dash order matches tldraw exactly: draw, dashed, dotted, solid.
	const fillOptions = [
		{ value: 'none' as const, label: 'None', icon: 'fill-none' },
		{ value: 'semi' as const, label: 'Semi', icon: 'fill-semi' },
		{ value: 'solid' as const, label: 'Solid', icon: 'fill-solid' },
		{ value: 'pattern' as const, label: 'Pattern', icon: 'fill-pattern' }
	];
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
	const arrowheadOptions = ArrowShapeArrowheadStartStyle.values.map((v) => ({
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
			<StylePropPicker
				{model}
				prop={DefaultFillStyle}
				title="Fill"
				uiType="fill"
				options={fillOptions}
			/>
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

{#if has.font || has.halign || has.valign}
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

{#if has.geo || has.spline || has.arrowheadStart || has.arrowheadEnd}
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
		{#if has.spline}
			<StyleDropdownPicker
				{model}
				prop={LineShapeSplineStyle}
				title="Spline"
				uiType="spline"
				options={splineOptions}
			/>
		{/if}
		{#if has.arrowheadStart}
			<StyleDropdownPicker
				{model}
				prop={ArrowShapeArrowheadStartStyle}
				title="Arrowhead start"
				uiType="arrowheadStart"
				options={arrowheadOptions}
			/>
		{/if}
		{#if has.arrowheadEnd}
			<StyleDropdownPicker
				{model}
				prop={ArrowShapeArrowheadEndStyle}
				title="Arrowhead end"
				uiType="arrowheadEnd"
				options={arrowheadOptions}
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
	.tlui-style-panel__section:has(.tlui-slider__container:last-child):not(:last-child) {
		margin-bottom: 7px;
	}
</style>
