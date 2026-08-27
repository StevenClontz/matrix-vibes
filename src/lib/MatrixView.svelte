<script lang="ts">
	import type { Snippet } from 'svelte';
	import katex from 'katex';
	import Fraction from 'fraction.js';
	import interact from 'interactjs';
	import type { Matrix } from './matrix';
	import {
		scaleRow,
		scaleCol,
		swapRows,
		swapCols,
		addScaledRow,
		addScaledCol,
		describeScaleRow,
		describeScaleCol,
		describeSwapRows,
		describeSwapCols,
		describeAddScaledRow,
		describeAddScaledCol
	} from './matrix';

	function parseRational(text: string): Fraction | null {
		try {
			return new Fraction(text.trim());
		} catch {
			return null;
		}
	}

	let { matrix = $bindable() }: { matrix: Matrix } = $props();

	let selectedRow = $state<number | null>(null);
	let selectedCol = $state<number | null>(null);

	let dropAction = $state<{ kind: 'row' | 'col'; source: number; target: number } | null>(null);
	let dropMode = $state<'swap' | 'combine'>('combine');

	let scaleFactor = $state<Fraction>(new Fraction(1));
	let scaleFactorText = $state('1');
	let scaleFactorValid = $derived(parseRational(scaleFactorText) !== null);

	let hoveredRow = $state<number | null>(null);
	let hoveredCol = $state<number | null>(null);

	let draggedRow = $state<number | null>(null);
	let draggedCol = $state<number | null>(null);

	// Row/column currently under the cursor during an active drag. Separate from
	// hoveredRow/hoveredCol (mouse-hover-only, used for the non-drag highlight feature).
	let dragTargetRow = $state<number | null>(null);
	let dragTargetCol = $state<number | null>(null);

	let ghostValues = $state<Fraction[] | null>(null);
	let ghostOrientation = $state<'row' | 'col' | null>(null);
	let ghostX = $state(0);
	let ghostY = $state(0);

	let isAnyDragActive = $derived(draggedRow !== null || draggedCol !== null);

	let isOverDragTarget = $derived(
		(ghostOrientation === 'row' && dragTargetRow !== null && dragTargetRow !== draggedRow) ||
			(ghostOrientation === 'col' && dragTargetCol !== null && dragTargetCol !== draggedCol)
	);

	function dragHandle(node: HTMLElement, params: { kind: 'row' | 'col'; index: number }) {
		let current = params;

		const interactable = interact(node)
			.draggable({
				listeners: {
					start() {
						if (current.kind === 'row') {
							draggedRow = current.index;
							ghostValues = matrix[current.index];
							ghostOrientation = 'row';
						} else {
							draggedCol = current.index;
							ghostValues = matrix.map((row) => row[current.index]);
							ghostOrientation = 'col';
						}
						document.body.style.cursor = 'grabbing';
					},
					move(event) {
						ghostX = event.clientX;
						ghostY = event.clientY;
					},
					end() {
						draggedRow = null;
						draggedCol = null;
						dragTargetRow = null;
						dragTargetCol = null;
						ghostValues = null;
						ghostOrientation = null;
						document.body.style.cursor = '';
					}
				}
			})
			.dropzone({
				accept: current.kind === 'row' ? '[data-row-handle]' : '[data-col-handle]',
				overlap: 'pointer',
				ondragenter() {
					if (current.kind === 'row') dragTargetRow = current.index;
					else dragTargetCol = current.index;
				},
				ondragleave() {
					if (current.kind === 'row' && dragTargetRow === current.index) dragTargetRow = null;
					if (current.kind === 'col' && dragTargetCol === current.index) dragTargetCol = null;
				},
				ondrop(event) {
					const attr = current.kind === 'row' ? 'rowHandle' : 'colHandle';
					const source = Number((event.relatedTarget as HTMLElement).dataset[attr]);
					const target = current.index;
					if (source === target) return;
					selectedRow = null;
					selectedCol = null;
					dropMode = 'combine';
					scaleFactor = new Fraction(1);
					scaleFactorText = '1';
					dropAction = { kind: current.kind, source, target };
				}
			})
			.on('tap', () => {
				if (current.kind === 'row') selectRow(current.index);
				else selectCol(current.index);
			});

		return {
			update(newParams: { kind: 'row' | 'col'; index: number }) {
				current = newParams;
			},
			destroy() {
				interactable.unset();
			}
		};
	}

	function selectRow(i: number) {
		if (selectedRow === i) {
			selectedRow = null;
		} else {
			selectedRow = i;
			selectedCol = null;
			scaleFactor = new Fraction(1);
			scaleFactorText = '1';
			dropAction = null;
		}
	}

	function selectCol(j: number) {
		if (selectedCol === j) {
			selectedCol = null;
		} else {
			selectedCol = j;
			selectedRow = null;
			scaleFactor = new Fraction(1);
			scaleFactorText = '1';
			dropAction = null;
		}
	}

	function applyScale() {
		if (!scaleFactorValid) return;
		if (selectedRow !== null) {
			matrix = scaleRow(matrix, selectedRow, scaleFactor);
		} else if (selectedCol !== null) {
			matrix = scaleCol(matrix, selectedCol, scaleFactor);
		}
		scaleFactor = new Fraction(1);
		scaleFactorText = '1';
		selectedRow = null;
		selectedCol = null;
	}

	function cancelScale() {
		scaleFactor = new Fraction(1);
		scaleFactorText = '1';
		selectedRow = null;
		selectedCol = null;
	}

	function applyDropAction() {
		if (!dropAction) return;
		if (dropMode === 'combine' && !scaleFactorValid) return;
		const { kind, source, target } = dropAction;
		if (kind === 'row') {
			matrix =
				dropMode === 'swap'
					? swapRows(matrix, source, target)
					: addScaledRow(matrix, target, source, scaleFactor);
		} else {
			matrix =
				dropMode === 'swap'
					? swapCols(matrix, source, target)
					: addScaledCol(matrix, target, source, scaleFactor);
		}
		dropAction = null;
		dropMode = 'combine';
		scaleFactor = new Fraction(1);
		scaleFactorText = '1';
	}

	function cancelDropAction() {
		dropAction = null;
		dropMode = 'combine';
		scaleFactor = new Fraction(1);
		scaleFactorText = '1';
	}

	function computeDropPreview(i: number, j: number): { from: Fraction; to: Fraction } | null {
		if (!dropAction) return null;
		const { kind, source, target } = dropAction;
		if (kind === 'row') {
			if (i === target) {
				const from = matrix[target][j];
				const to =
					dropMode === 'swap' ? matrix[source][j] : from.add(scaleFactor.mul(matrix[source][j]));
				return { from, to };
			}
			if (i === source) {
				const from = matrix[source][j];
				const to = dropMode === 'swap' ? matrix[target][j] : from;
				return { from, to };
			}
			return null;
		}
		if (j === target) {
			const from = matrix[i][target];
			const to =
				dropMode === 'swap' ? matrix[i][source] : from.add(scaleFactor.mul(matrix[i][source]));
			return { from, to };
		}
		if (j === source) {
			const from = matrix[i][source];
			const to = dropMode === 'swap' ? matrix[i][target] : from;
			return { from, to };
		}
		return null;
	}

	function onHeaderKeydown(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			action();
		}
	}
</script>

{#snippet handleIcon()}
	<svg
		viewBox="0 0 16 16"
		class="h-4 w-4"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<line x1="3" y1="4.5" x2="13" y2="4.5" />
		<line x1="3" y1="8" x2="13" y2="8" />
		<line x1="3" y1="11.5" x2="13" y2="11.5" />
	</svg>
{/snippet}

<div class="inline-block overflow-auto rounded-lg border border-slate-300 bg-white p-4 shadow-sm select-none">
	<table class="border-collapse">
		<thead>
			<tr>
				<th class="w-10"></th>
				{#each matrix[0] ?? [] as _, j (j)}
					<th
						class="{isAnyDragActive
							? 'cursor-grabbing'
							: 'cursor-grab'} touch-none select-none rounded-md p-2 text-center align-middle transition-colors {selectedCol ===
						j
							? 'text-violet-600'
							: 'text-slate-200 hover:text-slate-400'}"
						data-col-handle={j}
						use:dragHandle={{ kind: 'col', index: j }}
						tabindex="0"
						aria-label={`Column ${j + 1}`}
						title={`Column ${j + 1}`}
						onkeydown={(e) => onHeaderKeydown(e, () => selectCol(j))}
						onmouseenter={() => (hoveredCol = j)}
						onmouseleave={() => (hoveredCol = null)}
						onfocus={() => (hoveredCol = j)}
						onblur={() => (hoveredCol = null)}
					>
						<span class="flex h-4 items-center justify-center">
							{@render handleIcon()}
						</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each matrix as row, i (i)}
				<tr>
					<th
						class="{isAnyDragActive
							? 'cursor-grabbing'
							: 'cursor-grab'} touch-none select-none rounded-md p-2 text-center align-middle transition-colors {selectedRow ===
						i
							? 'text-violet-600'
							: 'text-slate-200 hover:text-slate-400'}"
						data-row-handle={i}
						use:dragHandle={{ kind: 'row', index: i }}
						tabindex="0"
						aria-label={`Row ${i + 1}`}
						title={`Row ${i + 1}`}
						onkeydown={(e) => onHeaderKeydown(e, () => selectRow(i))}
						onmouseenter={() => (hoveredRow = i)}
						onmouseleave={() => (hoveredRow = null)}
						onfocus={() => (hoveredRow = i)}
						onblur={() => (hoveredRow = null)}
					>
						<span class="flex h-4 items-center justify-center">
							{@render handleIcon()}
						</span>
					</th>
					{#each row as value, j (j)}
						{@const isHovered = !isAnyDragActive && (hoveredRow === i || hoveredCol === j)}
						{@const isDragging = draggedRow === i || draggedCol === j}
						{@const dragPreview =
							draggedRow !== null && dragTargetRow === i && draggedRow !== i
								? { from: value, to: value.add(matrix[draggedRow][j]) }
								: draggedCol !== null && dragTargetCol === j && draggedCol !== j
									? { from: value, to: value.add(matrix[i][draggedCol]) }
									: null}
						{@const scalePreview =
							selectedRow === i || selectedCol === j
								? { from: value, to: value.mul(scaleFactor) }
								: null}
						{@const preview = isAnyDragActive ? dragPreview : (scalePreview ?? computeDropPreview(i, j))}
						<td class="min-w-12 px-2 py-1">
							<div
								class="flex min-w-10 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-center font-mathnum text-slate-700 transition-colors {isDragging
									? 'bg-violet-50'
									: preview
										? !preview.to.equals(preview.from)
											? 'bg-violet-50'
											: 'bg-slate-100'
										: isHovered
											? 'bg-violet-50'
											: ''}"
							>
								{#if preview}
									<span class="text-slate-400">{preview.from.toFraction()}</span>
									{#if !preview.to.equals(preview.from)}
										<span class="text-slate-400">→</span>
										<span class="font-semibold text-violet-600">{preview.to.toFraction()}</span>
									{/if}
								{:else}
									{value.toFraction()}
								{/if}
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	{#if selectedRow !== null || selectedCol !== null}
		{@const latex =
			selectedRow !== null
				? describeScaleRow(selectedRow, scaleFactor)
				: describeScaleCol(selectedCol!, scaleFactor)}
		{@const descriptionHtml = katex.renderToString(latex, { throwOnError: false })}
		{@render controlPanel(descriptionHtml, applyScale, cancelScale, scaleControls, !scaleFactorValid)}
	{/if}

	{#if dropAction}
		{@const { kind, source, target } = dropAction}
		{@const latex =
			dropMode === 'swap'
				? kind === 'row'
					? describeSwapRows(source, target)
					: describeSwapCols(source, target)
				: kind === 'row'
					? describeAddScaledRow(target, source, scaleFactor)
					: describeAddScaledCol(target, source, scaleFactor)}
		{@const descriptionHtml = katex.renderToString(latex, { throwOnError: false })}
		{@render controlPanel(
			descriptionHtml,
			applyDropAction,
			cancelDropAction,
			dropControls,
			dropMode === 'combine' && !scaleFactorValid
		)}
	{/if}
</div>

{#snippet controlPanel(
	descriptionHtml: string,
	onSubmit: () => void,
	onCancel: () => void,
	controls: Snippet,
	submitDisabled: boolean = false
)}
	<div class="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 text-sm text-slate-600">
		<div class="text-slate-700 flex flex-wrap justify-center items-center gap-3">
			<span>{@html descriptionHtml}</span>
		</div>
		<div class="text-slate-700 flex items-center justify-center">
			{@render controls()}
		</div>
		<div class="flex flex-wrap items-center justify-center gap-3">
			<button
				onclick={onSubmit}
				disabled={submitDisabled}
				class="rounded-md bg-violet-600 px-3 py-1 font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Submit
			</button>
			<button
				onclick={onCancel}
				class="rounded-md px-3 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100"
			>
				Cancel
			</button>
		</div>
	</div>
{/snippet}

{#snippet scaleControls()}
	<label>Scaling factor:
	<input
		type="text"
		inputmode="text"
		value={scaleFactorText}
		oninput={(e) => {
			scaleFactorText = e.currentTarget.value;
			const parsed = parseRational(scaleFactorText);
			if (parsed !== null) scaleFactor = parsed;
		}}
		aria-invalid={!scaleFactorValid}
		class="w-20 rounded-md border px-2 py-1 font-mathnum focus:outline-none {scaleFactorValid
			? 'border-slate-300 text-slate-700 focus:border-violet-400'
			: 'border-red-400 text-red-600 focus:border-red-500'}"
	/></label>
{/snippet}

{#snippet dropControls()}
	<div class="flex gap-3 items-center justify-center my-2">
	{#if dropMode === 'combine'}
		{@render scaleControls()}
	{/if}
	</div>
	<div class="flex gap-3 items-center justify-center my-2">
	<label class="flex items-center gap-1.5">
		<input type="radio" name="dropMode" value="combine" bind:group={dropMode} />
		Combine
	</label>
	<label class="flex items-center gap-1.5">
		<input type="radio" name="dropMode" value="swap" bind:group={dropMode} />
		Swap
	</label>
	</div>
{/snippet}

{#if ghostValues && !isOverDragTarget}
	<div
		class="pointer-events-none fixed z-50 flex {ghostOrientation === 'row'
			? 'flex-row'
			: 'flex-col'} items-center gap-1 rounded-lg border border-violet-200 bg-white/90 p-2 opacity-60 shadow-lg"
		style="left: {ghostX}px; top: {ghostY}px; transform: {ghostOrientation === 'row'
			? 'translate(12px, -50%)'
			: 'translate(-50%, 12px)'};"
	>
		{#each ghostValues as v}
			<span class="rounded-md px-3 py-1.5 font-mathnum text-violet-700">{v.toFraction()}</span>
		{/each}
	</div>
{/if}
