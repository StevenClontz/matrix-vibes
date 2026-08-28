<script lang="ts">
	import { parseRational, type Matrix } from './matrix';

	const MIN_DIM = 2;
	const MAX_DIM = 10;

	let {
		current,
		onclose,
		oncreate
	}: {
		current: Matrix;
		onclose: () => void;
		oncreate: (matrix: Matrix) => void;
	} = $props();

	function clampDim(n: number): number {
		if (!Number.isFinite(n)) return MIN_DIM;
		return Math.min(MAX_DIM, Math.max(MIN_DIM, Math.round(n)));
	}

	let rows = $state(clampDim(current.length));
	let cols = $state(clampDim(current[0]?.length ?? MIN_DIM));

	let rowsText = $state(String(rows));
	let colsText = $state(String(cols));

	let cellsText = $state<string[][]>(
		Array.from({ length: rows }, (_, i) =>
			Array.from({ length: cols }, (_, j) => current[i]?.[j]?.toFraction() ?? '0')
		)
	);

	let cellValidity = $derived(cellsText.map((row) => row.map((t) => parseRational(t) !== null)));
	let allValid = $derived(cellValidity.every((row) => row.every((v) => v)));

	function resizeGrid(newRows: number, newCols: number) {
		cellsText = Array.from({ length: newRows }, (_, i) =>
			Array.from({ length: newCols }, (_, j) => cellsText[i]?.[j] ?? '0')
		);
		rows = newRows;
		cols = newCols;
	}

	function commitRows(text: string) {
		const clamped = clampDim(Number(text));
		rowsText = String(clamped);
		if (clamped !== rows) resizeGrid(clamped, cols);
	}

	function commitCols(text: string) {
		const clamped = clampDim(Number(text));
		colsText = String(clamped);
		if (clamped !== cols) resizeGrid(rows, clamped);
	}

	function handleCreate() {
		if (!allValid) return;
		const newMatrix: Matrix = cellsText.map((row) => row.map((t) => parseRational(t)!));
		oncreate(newMatrix);
	}

	let firstInputEl = $state<HTMLInputElement>();
	$effect(() => {
		firstInputEl?.focus();
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
/>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
	role="presentation"
	onmousedown={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<div
		class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white p-6 shadow-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="new-matrix-title"
	>
		<h2 id="new-matrix-title" class="text-lg font-bold text-slate-800">New Matrix</h2>

		<div class="mt-4 flex items-center justify-center gap-4 text-sm text-slate-600">
			<label class="flex items-center gap-2">
				Rows
				<input
					bind:this={firstInputEl}
					type="number"
					min={MIN_DIM}
					max={MAX_DIM}
					value={rowsText}
					oninput={(e) => (rowsText = e.currentTarget.value)}
					onblur={(e) => commitRows(e.currentTarget.value)}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							commitRows(e.currentTarget.value);
							e.currentTarget.blur();
						}
					}}
					class="w-16 rounded-md border border-slate-300 px-2 py-1 font-mathnum focus:border-violet-400 focus:outline-none"
				/>
			</label>
			<label class="flex items-center gap-2">
				Columns
				<input
					type="number"
					min={MIN_DIM}
					max={MAX_DIM}
					value={colsText}
					oninput={(e) => (colsText = e.currentTarget.value)}
					onblur={(e) => commitCols(e.currentTarget.value)}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							commitCols(e.currentTarget.value);
							e.currentTarget.blur();
						}
					}}
					class="w-16 rounded-md border border-slate-300 px-2 py-1 font-mathnum focus:border-violet-400 focus:outline-none"
				/>
			</label>
		</div>

		<div class="mt-4 flex justify-center overflow-auto">
			<div class="inline-grid gap-1" style={`grid-template-columns: repeat(${cols}, auto);`}>
				{#each cellsText as row, i (i)}
					{#each row as cellText, j (j)}
						<input
							type="text"
							inputmode="text"
							aria-label={`Row ${i + 1}, column ${j + 1}`}
							value={cellText}
							oninput={(e) => {
								cellsText[i][j] = e.currentTarget.value;
							}}
							aria-invalid={!cellValidity[i][j]}
							class="min-w-10 [field-sizing:content] rounded-md border px-2 py-1 text-center font-mathnum focus:outline-none {cellValidity[
								i
							][j]
								? 'border-slate-300 text-slate-700 focus:border-violet-400'
								: 'border-red-400 text-red-600 focus:border-red-500'}"
						/>
					{/each}
				{/each}
			</div>
		</div>

		<div class="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-4">
			<button
				onclick={handleCreate}
				disabled={!allValid}
				class="rounded-md bg-violet-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Create
			</button>
			<button
				onclick={onclose}
				class="rounded-md px-4 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-100"
			>
				Cancel
			</button>
		</div>
	</div>
</div>
