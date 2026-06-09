// Throwaway headless smoke test for the vendored @tldraw/state engine.
// Run with: pnpm exec tsx scripts/verify-engine.mjs
import { atom, computed, react, transact } from '@tldraw/state'

function assert(cond, msg) {
	if (!cond) {
		console.error('FAIL:', msg)
		process.exit(1)
	}
}

// 1. atom + computed
const count = atom('count', 1)
const doubled = computed('doubled', () => count.get() * 2)
assert(count.get() === 1, 'atom initial value')
assert(doubled.get() === 2, 'computed initial value')

// 2. mutate -> computed recomputes lazily
count.set(5)
assert(count.get() === 5, 'atom after set')
assert(doubled.get() === 10, 'computed after dependency change')

// 3. reactive effect fires on change
let reactedTo = null
const stop = react('observer', () => {
	reactedTo = doubled.get()
})
assert(reactedTo === 10, 'effect ran with current value')
count.set(7)
assert(reactedTo === 14, 'effect re-ran after mutation')

// 4. transact batches updates (one final effect run)
let runs = 0
const r2 = react('counter', () => {
	count.get()
	runs++
})
const runsAfterAttach = runs
transact(() => {
	count.set(100)
	count.set(200)
	count.set(300)
})
assert(count.get() === 300, 'transact applied final value')
assert(runs === runsAfterAttach + 1, `transact batched effects into one run (got ${runs - runsAfterAttach})`)

stop()
r2()
console.log('SUCCESS: @tldraw/state engine works headlessly (atom, computed, react, transact all verified)')
