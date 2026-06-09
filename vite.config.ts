import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// The vendored @tldraw/* workspace packages ship raw .ts source (main:
	// ./src/index.ts). Vite externalizes node_modules for SSR/Node by default,
	// which would hand raw .ts to Node and throw "Invalid or unexpected token".
	// Inline them so Vite transforms the TS through esbuild instead.
	ssr: {
		noExternal: [/^@tldraw\//]
	},
	// Vite 8 transforms with oxc by default. The vendored @tldraw/* engine uses
	// legacy TS method decorators (@computed, @withDiff); without legacy decorator
	// lowering the transform leaves decorator syntax that the import-rewrite turns
	// into invalid `@import.member` expressions, throwing "Invalid or unexpected
	// token" at module eval. Enable legacy decorators in the transformer.
	oxc: {
		decorator: { legacy: true }
	},
	test: {
		expect: { requireAssertions: true },
		server: {
			deps: {
				inline: [/^@tldraw\//]
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
