import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		// Vendored tldraw engine (the React-stripped @tldraw/* packages copied into
		// `packages/` so the app builds against the genuine engine). This is upstream
		// third-party source — it is NOT linted to THIS app's style config (it uses
		// tldraw's own eslint plugin + permits `any` in its monorepo). Its correctness
		// is covered by `svelte-check` (type-checks the whole tree, 0/0) and `pnpm
		// build`. Linting it here would be meaningless noise and churn re-syncs with
		// upstream. App code under src/ and e2e/ is still fully linted.
		// `tldraw-main/` is the upstream tldraw React monorepo, vendored as a
		// read-only conversion reference (configs stripped, never built/run).
		// Never lint it.
		ignores: ['packages/**', 'tldraw-main/**']
	},
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
