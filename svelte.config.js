import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Deploys to Vercel. The app is fully client-side (browser IndexedDB
		// persistence, client SVG/PNG export) — no server routes, no backend.
		adapter: adapter()
	}
};

export default config;
