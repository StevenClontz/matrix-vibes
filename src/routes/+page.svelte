<script lang="ts">
	import {
		createMatrix,
		identityMatrix,
		cloneMatrix,
		swapRows,
		scaleRow,
		addScaledRow,
		swapCols,
		scaleCol,
		addScaledCol,
		formatNum,
		describeSwapRows,
		describeScaleRow,
		describeAddScaledRow,
		describeSwapCols,
		describeScaleCol,
		describeAddScaledCol,
		type Matrix
	} from '$lib/matrix';

	// --- Matrix state ---
	let rows = $state(3);
	let cols = $state(3);
	let matrix = $state<Matrix>(identityMatrix(3));
	let history = $state<{ matrix: Matrix; op: string }[]>([]);
	let highlightRow = $state<number | null>(null);
	let highlightCol = $state<number | null>(null);

	// --- Size controls ---
	function resize(newRows: number, newCols: number) {
		const next = createMatrix(newRows, newCols);
		for (let i = 0; i < Math.min(newRows, matrix.length); i++) {
			for (let j = 0; j < Math.min(newCols, matrix[0].length); j++) {
				next[i][j] = matrix[i][j];
			}
		}
		rows = newRows;
		cols = newCols;
		matrix = next;
	}

	function setCell(r: number, c: number, raw: string) {
		const v = parseFloat(raw);
		if (isNaN(v)) return;
		const next = cloneMatrix(matrix);
		next[r][c] = v;
		matrix = next;
	}

	function pushHistory(op: string, next: Matrix) {
		history = [...history, { matrix: cloneMatrix(matrix), op }];
		matrix = next;
	}

	function undo() {
		if (history.length === 0) return;
		const prev = history[history.length - 1];
		matrix = prev.matrix;
		history = history.slice(0, -1);
	}

	function reset() {
		history = [];
		matrix = identityMatrix(Math.min(rows, cols));
		rows = matrix.length;
		cols = matrix[0].length;
	}

	// --- Row operation state ---
	let rowOp = $state<'swap' | 'scale' | 'add'>('swap');
	let rowA = $state(0);
	let rowB = $state(1);
	let rowScalar = $state('2');

	function applyRowOp() {
		const sc = parseFloat(rowScalar);
		if (rowOp === 'swap') {
			if (rowA === rowB) return;
			pushHistory(describeSwapRows(rowA, rowB), swapRows(matrix, rowA, rowB));
		} else if (rowOp === 'scale') {
			if (isNaN(sc) || sc === 0) return;
			pushHistory(describeScaleRow(rowA, sc), scaleRow(matrix, rowA, sc));
		} else {
			if (isNaN(sc) || rowA === rowB) return;
			pushHistory(
				describeAddScaledRow(rowA, rowB, sc),
				addScaledRow(matrix, rowA, rowB, sc)
			);
		}
	}

	// --- Column operation state ---
	let colOp = $state<'swap' | 'scale' | 'add'>('swap');
	let colA = $state(0);
	let colB = $state(1);
	let colScalar = $state('2');

	function applyColOp() {
		const sc = parseFloat(colScalar);
		if (colOp === 'swap') {
			if (colA === colB) return;
			pushHistory(describeSwapCols(colA, colB), swapCols(matrix, colA, colB));
		} else if (colOp === 'scale') {
			if (isNaN(sc) || sc === 0) return;
			pushHistory(describeScaleCol(colA, sc), scaleCol(matrix, colA, sc));
		} else {
			if (isNaN(sc) || colA === colB) return;
			pushHistory(
				describeAddScaledCol(colA, colB, sc),
				addScaledCol(matrix, colA, colB, sc)
			);
		}
	}

	// --- Row/col index options ---
	let rowOptions = $derived(Array.from({ length: rows }, (_, i) => i));
	let colOptions = $derived(Array.from({ length: cols }, (_, j) => j));
</script>

<main>
	<h1>Matrix Vibes</h1>

	<!-- Size controls -->
	<section class="controls size-controls">
		<label>
			Rows
			<input
				type="number"
				min="1"
				max="8"
				value={rows}
				oninput={(e) => resize(Math.max(1, Math.min(8, parseInt(e.currentTarget.value) || rows)), cols)}
			/>
		</label>
		<label>
			Cols
			<input
				type="number"
				min="1"
				max="8"
				value={cols}
				oninput={(e) => resize(rows, Math.max(1, Math.min(8, parseInt(e.currentTarget.value) || cols)))}
			/>
		</label>
		<button onclick={reset}>Reset to Identity</button>
		<button onclick={undo} disabled={history.length === 0}>Undo</button>
	</section>

	<!-- Matrix display -->
	<section class="matrix-wrapper" style="height: {2.75*rows}rem;">
		<div class="bracket left"></div>
		<table class="matrix">
			<tbody>
				{#each matrix as row, r}
					<tr class={highlightRow === r ? 'highlight-row' : ''}>
						{#each row as val, c}
							<td class={highlightCol === c ? 'highlight-col' : ''}>
								<input
									type="text"
									value={formatNum(val)}
									onchange={(e) => setCell(r, c, e.currentTarget.value)}
									onblur={(e) => setCell(r, c, e.currentTarget.value)}
								/>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="bracket right"></div>
	</section>

	<div class="ops-grid">
		<!-- Row operations -->
		<section class="controls op-controls">
			<h2>Row Operations</h2>

			<div class="op-tabs">
				<button class={rowOp === 'swap' ? 'active' : ''} onclick={() => (rowOp = 'swap')}>Swap</button>
				<button class={rowOp === 'scale' ? 'active' : ''} onclick={() => (rowOp = 'scale')}>Scale</button>
				<button class={rowOp === 'add' ? 'active' : ''} onclick={() => (rowOp = 'add')}>Add Multiple</button>
			</div>

			<div class="op-fields">
				{#if rowOp === 'swap'}
					<label>
						R<sub>1</sub>
						<select bind:value={rowA} onmouseover={() => (highlightRow = rowA)} onfocus={() => (highlightRow = rowA)} onmouseleave={() => (highlightRow = null)} onblur={() => (highlightRow = null)}>
							{#each rowOptions as i}<option value={i}>Row {i + 1}</option>{/each}
						</select>
					</label>
					<span class="op-sym">↔</span>
					<label>
						R<sub>2</sub>
						<select bind:value={rowB} onmouseover={() => (highlightRow = rowB)} onfocus={() => (highlightRow = rowB)} onmouseleave={() => (highlightRow = null)} onblur={() => (highlightRow = null)}>
							{#each rowOptions as i}<option value={i}>Row {i + 1}</option>{/each}
						</select>
					</label>
					<div class="preview">{describeSwapRows(rowA, rowB)}</div>
				{:else if rowOp === 'scale'}
					<label>
						Row
						<select bind:value={rowA} onmouseover={() => (highlightRow = rowA)} onfocus={() => (highlightRow = rowA)} onmouseleave={() => (highlightRow = null)} onblur={() => (highlightRow = null)}>
							{#each rowOptions as i}<option value={i}>Row {i + 1}</option>{/each}
						</select>
					</label>
					<span class="op-sym">×</span>
					<label>
						Scalar
						<input type="text" bind:value={rowScalar} />
					</label>
					<div class="preview">{describeScaleRow(rowA, parseFloat(rowScalar) || 0)}</div>
				{:else}
					<label>
						Target
						<select bind:value={rowA} onmouseover={() => (highlightRow = rowA)} onfocus={() => (highlightRow = rowA)} onmouseleave={() => (highlightRow = null)} onblur={() => (highlightRow = null)}>
							{#each rowOptions as i}<option value={i}>Row {i + 1}</option>{/each}
						</select>
					</label>
					<span class="op-sym">+</span>
					<label>
						Scalar
						<input type="text" bind:value={rowScalar} />
					</label>
					<span class="op-sym">×</span>
					<label>
						Source
						<select bind:value={rowB} onmouseover={() => (highlightRow = rowB)} onfocus={() => (highlightRow = rowB)} onmouseleave={() => (highlightRow = null)} onblur={() => (highlightRow = null)}>
							{#each rowOptions as i}<option value={i}>Row {i + 1}</option>{/each}
						</select>
					</label>
					<div class="preview">{describeAddScaledRow(rowA, rowB, parseFloat(rowScalar) || 0)}</div>
				{/if}
			</div>

			<button class="apply-btn" onclick={applyRowOp}>Apply Row Op</button>
		</section>

		<!-- Column operations -->
		<section class="controls op-controls">
			<h2>Column Operations</h2>

			<div class="op-tabs">
				<button class={colOp === 'swap' ? 'active' : ''} onclick={() => (colOp = 'swap')}>Swap</button>
				<button class={colOp === 'scale' ? 'active' : ''} onclick={() => (colOp = 'scale')}>Scale</button>
				<button class={colOp === 'add' ? 'active' : ''} onclick={() => (colOp = 'add')}>Add Multiple</button>
			</div>

			<div class="op-fields">
				{#if colOp === 'swap'}
					<label>
						C<sub>1</sub>
						<select bind:value={colA} onmouseover={() => (highlightCol = colA)} onfocus={() => (highlightCol = colA)} onmouseleave={() => (highlightCol = null)} onblur={() => (highlightCol = null)}>
							{#each colOptions as j}<option value={j}>Col {j + 1}</option>{/each}
						</select>
					</label>
					<span class="op-sym">↔</span>
					<label>
						C<sub>2</sub>
						<select bind:value={colB} onmouseover={() => (highlightCol = colB)} onfocus={() => (highlightCol = colB)} onmouseleave={() => (highlightCol = null)} onblur={() => (highlightCol = null)}>
							{#each colOptions as j}<option value={j}>Col {j + 1}</option>{/each}
						</select>
					</label>
					<div class="preview">{describeSwapCols(colA, colB)}</div>
				{:else if colOp === 'scale'}
					<label>
						Col
						<select bind:value={colA} onmouseover={() => (highlightCol = colA)} onfocus={() => (highlightCol = colA)} onmouseleave={() => (highlightCol = null)} onblur={() => (highlightCol = null)}>
							{#each colOptions as j}<option value={j}>Col {j + 1}</option>{/each}
						</select>
					</label>
					<span class="op-sym">×</span>
					<label>
						Scalar
						<input type="text" bind:value={colScalar} />
					</label>
					<div class="preview">{describeScaleCol(colA, parseFloat(colScalar) || 0)}</div>
				{:else}
					<label>
						Target
						<select bind:value={colA} onmouseover={() => (highlightCol = colA)} onfocus={() => (highlightCol = colA)} onmouseleave={() => (highlightCol = null)} onblur={() => (highlightCol = null)}>
							{#each colOptions as j}<option value={j}>Col {j + 1}</option>{/each}
						</select>
					</label>
					<span class="op-sym">+</span>
					<label>
						Scalar
						<input type="text" bind:value={colScalar} />
					</label>
					<span class="op-sym">×</span>
					<label>
						Source
						<select bind:value={colB} onmouseover={() => (highlightCol = colB)} onfocus={() => (highlightCol = colB)} onmouseleave={() => (highlightCol = null)} onblur={() => (highlightCol = null)}>
							{#each colOptions as j}<option value={j}>Col {j + 1}</option>{/each}
						</select>
					</label>
					<div class="preview">{describeAddScaledCol(colA, colB, parseFloat(colScalar) || 0)}</div>
				{/if}
			</div>

			<button class="apply-btn" onclick={applyColOp}>Apply Col Op</button>
		</section>
	</div>

	<!-- History log -->
	{#if history.length > 0}
		<section class="history">
			<h2>Operation History</h2>
			<ol>
				{#each history as step}
					<li>{step.op}</li>
				{/each}
			</ol>
		</section>
	{/if}
</main>

<style>
	:global(body) {
		font-family: system-ui, sans-serif;
		background: #0f172a;
		color: #e2e8f0;
		margin: 0;
		padding: 1rem;
	}

	main {
		max-width: 900px;
		margin: 0 auto;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #7dd3fc;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
	}

	.controls {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1rem;
	}

	.size-controls {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #94a3b8;
	}

	input[type='number'],
	input[type='text'] {
		background: #0f172a;
		border: 1px solid #475569;
		color: #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.9rem;
		width: 5rem;
		height: 1.3rem;
	}

	select {
		background: #0f172a;
		border: 1px solid #475569;
		color: #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.9rem;
	}

	button {
		background: #1e40af;
		color: #bfdbfe;
		border: 1px solid #3b82f6;
		border-radius: 0.375rem;
		padding: 0.35rem 0.85rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	button:hover:not(:disabled) {
		background: #2563eb;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Matrix display */
	.matrix-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		margin: 1.5rem 0;
	}

	.bracket {
		width: 12px;
		height: calc(100% + 8px);
		border: 3px solid #7dd3fc;
		flex-shrink: 0;
	}

	.bracket.left {
		border-right: none;
		border-radius: 4px 0 0 4px;
	}

	.bracket.right {
		border-left: none;
		border-radius: 0 4px 4px 0;
	}

	table.matrix {
		border-collapse: separate;
		border-spacing: 4px;
	}

	table.matrix tr.highlight-row td {
		background: #1e3a5f;
	}

	table.matrix td {
		background: #1e293b;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}

	table.matrix td.highlight-col {
		background: #1e3a5f;
	}

	table.matrix td input {
		width: 4rem;
		text-align: center;
		background: transparent;
		border: none;
		color: #f1f5f9;
		font-size: 1.1rem;
		font-family: 'Courier New', monospace;
		padding: 0.5rem 0.25rem;
		outline: none;
	}

	table.matrix td input:focus {
		outline: 2px solid #3b82f6;
		border-radius: 0.25rem;
	}

	/* Ops grid */
	.ops-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 600px) {
		.ops-grid {
			grid-template-columns: 1fr;
		}
	}

	.op-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.op-tabs button {
		background: #0f172a;
		border-color: #334155;
		color: #94a3b8;
	}

	.op-tabs button.active {
		background: #1e40af;
		border-color: #3b82f6;
		color: #bfdbfe;
	}

	.op-fields {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		min-height: 3.5rem;
	}

	.op-sym {
		font-size: 1.25rem;
		color: #7dd3fc;
		font-weight: bold;
	}

	.preview {
		width: 100%;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		color: #7dd3fc;
		background: #0f172a;
		border-radius: 0.375rem;
		padding: 0.35rem 0.6rem;
		margin-top: 0.25rem;
	}

	.apply-btn {
		background: #166534;
		border-color: #22c55e;
		color: #bbf7d0;
		width: 100%;
		padding: 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.apply-btn:hover {
		background: #15803d;
	}

	/* History */
	.history {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin-top: 1rem;
	}

	.history ol {
		margin: 0;
		padding-left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.history li {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		color: #94a3b8;
	}

	.history li:last-child {
		color: #e2e8f0;
	}
</style>
