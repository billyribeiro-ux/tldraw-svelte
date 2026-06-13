<script lang="ts">
	// Top-left brand logo. A rounded badge with a clean geometric pencil/draw mark +
	// the wordmark. Pure SVG, theme-token coloured. Does NOT link out anywhere.
</script>

<div class="tlui-logo" aria-label="Dev Draw" role="img">
	<span class="tlui-logo__mark" aria-hidden="true">
		<svg viewBox="0 0 32 32" width="20" height="20" role="img">
			<defs>
				<linearGradient id="tlui-logo-grad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="#5b7cff" />
					<stop offset="1" stop-color="#4465e9" />
				</linearGradient>
			</defs>
			<!-- Rounded square badge -->
			<rect x="0" y="0" width="32" height="32" rx="9" fill="url(#tlui-logo-grad)" />
			<!-- Pencil / draw nib stroke -->
			<path
				d="M10 22.5 L19.5 13 a2.6 2.6 0 0 1 3.7 3.7 L13.7 26 L9 27 Z"
				fill="#fff"
				opacity="0.96"
			/>
			<!-- Nib tip accent -->
			<path d="M9 27 L13.7 26 L11.2 23.5 Z" fill="#1d1d1d" opacity="0.35" />
			<!-- Top spark, gives it life -->
			<circle cx="22" cy="10" r="1.6" fill="#fff" opacity="0.9" />
		</svg>
	</span>
	<span class="tlui-logo__word">Dev Draw</span>
</div>

<style>
	.tlui-logo {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		height: 40px;
		padding: 0 10px 0 6px;
		color: var(--tl-color-text, #1d1d1d);
		font: 700 16px/1 var(--tl-font-sans, system-ui, sans-serif);
		letter-spacing: -0.02em;
		border-radius: var(--tl-radius-3, 9px);
		user-select: none;
	}
	.tlui-logo__mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		filter: drop-shadow(0 1px 2px rgba(68, 101, 233, 0.35));
	}
	.tlui-logo__word {
		background: linear-gradient(180deg, #2b2b2b, #111);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	/* In dark mode the wordmark reads light. */
	:global(.tl-theme__dark) .tlui-logo__word {
		background: linear-gradient(180deg, #fff, #d8dde6);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
</style>
