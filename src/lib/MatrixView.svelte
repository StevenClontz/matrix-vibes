<script lang="ts">
	import { tick, type Snippet } from 'svelte';
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
		describeAddScaledCol,
		parseRational,
		cellKey,
		matrixToLatex,
		matricesEqual
	} from './matrix';

	let {
		matrix = $bindable(),
		markedCells = $bindable(new Set<string>()),
		steps = $bindable(0),
		disableRowOps = false,
		disableColOps = false,
		hideControls = false
	}: {
		matrix: Matrix;
		markedCells?: Set<string>;
		steps?: number;
		disableRowOps?: boolean;
		disableColOps?: boolean;
		hideControls?: boolean;
	} = $props();

	function opsDisabled(kind: 'row' | 'col'): boolean {
		return kind === 'row' ? disableRowOps : disableColOps;
	}

	let selectedRow = $state<number | null>(null);
	let selectedCol = $state<number | null>(null);

	let dropAction = $state<{ kind: 'row' | 'col'; source: number; target: number } | null>(null);
	let dropMode = $state<'swap' | 'combine'>('combine');

	let scaleFactor = $state<Fraction>(new Fraction(1));
	let scaleFactorText = $state('1');
	let scaleFactorValid = $derived(parseRational(scaleFactorText) !== null);
	let scaleFactorIsZero = $derived(scaleFactorValid && scaleFactor.equals(0));
	let scaleFactorSlider = $derived.by(() => {
		if (!scaleFactorValid) return 0;
		const n = Math.round(scaleFactor.valueOf());
		return Math.max(-10, Math.min(10, n));
	});

	let hoveredRow = $state<number | null>(null);
	let hoveredCol = $state<number | null>(null);

	let controlPanelEl: HTMLDivElement | undefined;
	let controlPanelBottomEl: HTMLDivElement | undefined;
	let controlPanelVisible = $derived(
		selectedRow !== null || selectedCol !== null || dropAction !== null
	);

	$effect(() => {
		if (controlPanelVisible) {
			tick().then(() => {
				controlPanelBottomEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});
		}
	});

	type HistoryEntry = { matrix: Matrix; opLatex: string | null };

	let history = $state<HistoryEntry[]>([{ matrix, opLatex: null }]);

	$effect(() => {
		if (matrix !== history[history.length - 1].matrix) {
			history = [{ matrix, opLatex: null }];
		}
	});

	let historyItemsHtml = $derived(
		history.map((entry, idx) =>
			katex.renderToString(
				matrixToLatex(entry.matrix, idx === history.length - 1 ? markedCells : undefined),
				{ throwOnError: false }
			)
		)
	);
	let historyConnectorsHtml = $derived(
		history.slice(1).map((entry) =>
			katex.renderToString(
				entry.opLatex
					? `\\begin{array}{c}\\scriptsize ${entry.opLatex}\\\\[3pt]\\sim\\end{array}`
					: '\\sim',
				{ throwOnError: false }
			)
		)
	);

	let historyContainer: HTMLDivElement | undefined;
	let historyContentRow: HTMLDivElement | undefined;
	let historyPaddingLeft = $state(0);
	let historyPaddingRight = $state(0);

	$effect(() => {
		void historyItemsHtml;
		const container = historyContainer;
		const contentRow = historyContentRow;
		if (!container || !contentRow) return;
		const containerWidth = container.clientWidth;
		const naturalWidth = contentRow.offsetWidth;
		const items = contentRow.querySelectorAll<HTMLElement>('.history-item');
		const lastItem = items[items.length - 1];
		const lastItemWidth = lastItem?.offsetWidth ?? 0;
		const fitsWithoutScrolling = naturalWidth <= containerWidth;

		if (fitsWithoutScrolling) {
			// Not enough content to need scrolling — shift it right just far enough
			// to center the latest matrix, without pushing older ones off-screen.
			historyPaddingLeft = Math.max(0, containerWidth / 2 - naturalWidth + lastItemWidth / 2);
			historyPaddingRight = 0;
		} else {
			const firstItem = items[0];
			historyPaddingLeft = firstItem ? Math.max(0, (containerWidth - firstItem.offsetWidth) / 2) : 0;
			historyPaddingRight = Math.max(0, (containerWidth - lastItemWidth) / 2);
		}

		tick().then(() => {
			container.scrollTo({
				left: container.scrollWidth,
				behavior: fitsWithoutScrolling ? 'auto' : 'smooth'
			});
		});
	});

	function toggleMark(i: number, j: number) {
		const key = cellKey(i, j);
		const next = new Set(markedCells);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		markedCells = next;
	}

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
				enabled: !opsDisabled(current.kind),
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
				enabled: !opsDisabled(current.kind),
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
					scaleFactor = new Fraction(0);
					scaleFactorText = '0';
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
		if (disableRowOps) return;
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
		if (disableColOps) return;
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
		if (!scaleFactorValid || scaleFactorIsZero) return;
		const opLatex =
			selectedRow !== null
				? describeScaleRow(selectedRow, scaleFactor)
				: describeScaleCol(selectedCol!, scaleFactor);
		const result =
			selectedRow !== null
				? scaleRow(matrix, selectedRow, scaleFactor)
				: scaleCol(matrix, selectedCol!, scaleFactor);
		if (!matricesEqual(result, matrix)) {
			matrix = result;
			history = [...history, { matrix, opLatex }];
			steps += 1;
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
		const opLatex =
			dropMode === 'swap'
				? kind === 'row'
					? describeSwapRows(source, target)
					: describeSwapCols(source, target)
				: kind === 'row'
					? describeAddScaledRow(target, source, scaleFactor)
					: describeAddScaledCol(target, source, scaleFactor);
		const result =
			kind === 'row'
				? dropMode === 'swap'
					? swapRows(matrix, source, target)
					: addScaledRow(matrix, target, source, scaleFactor)
				: dropMode === 'swap'
					? swapCols(matrix, source, target)
					: addScaledCol(matrix, target, source, scaleFactor);
		if (!matricesEqual(result, matrix)) {
			matrix = result;
			history = [...history, { matrix, opLatex }];
			steps += 1;
		}
		dropAction = null;
		dropMode = 'combine';
		scaleFactor = new Fraction(0);
		scaleFactorText = '0';
	}

	function cancelDropAction() {
		dropAction = null;
		dropMode = 'combine';
		scaleFactor = new Fraction(0);
		scaleFactorText = '0';
	}

	function undo() {
		if (history.length < 2) return;
		history = history.slice(0, -1);
		matrix = history[history.length - 1].matrix;
		steps = Math.max(0, steps - 1);
		selectedRow = null;
		selectedCol = null;
		dropAction = null;
	}

	function computeDropPreview(
		i: number,
		j: number
	): { from: Fraction; to: Fraction; showArrow: boolean } | null {
		if (!dropAction) return null;
		const { kind, source, target } = dropAction;
		if (kind === 'row') {
			if (i === target) {
				const from = matrix[target][j];
				const to =
					dropMode === 'swap' ? matrix[source][j] : from.add(scaleFactor.mul(matrix[source][j]));
				return { from, to, showArrow: true };
			}
			if (i === source) {
				const from = matrix[source][j];
				const to = dropMode === 'swap' ? matrix[target][j] : from;
				return { from, to, showArrow: dropMode === 'swap' };
			}
			return null;
		}
		if (j === target) {
			const from = matrix[i][target];
			const to =
				dropMode === 'swap' ? matrix[i][source] : from.add(scaleFactor.mul(matrix[i][source]));
			return { from, to, showArrow: true };
		}
		if (j === source) {
			const from = matrix[i][source];
			const to = dropMode === 'swap' ? matrix[i][target] : from;
			return { from, to, showArrow: dropMode === 'swap' };
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

<svelte:window
	onkeydown={(e) => {
		if (e.key !== 'Escape') return;
		if (selectedRow !== null || selectedCol !== null) cancelScale();
		else if (dropAction) cancelDropAction();
	}}
/>

<div class="w-full overflow-x-auto" bind:this={historyContainer}>
	<div
		class="w-max"
		style="padding-left: {historyPaddingLeft}px; padding-right: {historyPaddingRight}px;"
	>
		<div class="flex items-center gap-3 py-4" bind:this={historyContentRow}>
			{#each historyItemsHtml as itemHtml, idx (idx)}
				{#if idx > 0}
					<span class="text-slate-400">{@html historyConnectorsHtml[idx - 1]}</span>
				{/if}
				<span class="history-item {idx < historyItemsHtml.length - 1 ? 'text-slate-400' : ''}">
					{@html itemHtml}
				</span>
			{/each}
		</div>
	</div>
</div>

{#if !hideControls}
<div class="flex w-full justify-center px-1 pb-2">
	<button
		onclick={undo}
		disabled={history.length < 2}
		class="cursor-pointer border border-slate-300 rounded-md px-3 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:border-none"
	>
		Undo
	</button>
</div>

<div class="w-full overflow-auto rounded-lg border border-slate-300 bg-white p-4 shadow-sm select-none">
	<table class="border-collapse mx-auto">
		<thead>
			<tr>
				<th class="w-10"></th>
				{#each matrix[0] ?? [] as _, j (j)}
					<th
						class="touch-none select-none rounded-md p-2 text-center align-middle transition-colors {disableColOps
							? 'cursor-not-allowed text-slate-100'
							: selectedCol === j
								? 'text-violet-600'
								: 'text-slate-200 hover:text-slate-400'}"
						data-col-handle={j}
						use:dragHandle={{ kind: 'col', index: j }}
						tabindex={disableColOps ? -1 : 0}
						aria-disabled={disableColOps}
						aria-label={`Column ${j + 1}`}
						title={`Column ${j + 1}`}
						onkeydown={(e) => onHeaderKeydown(e, () => selectCol(j))}
						onmouseenter={() => { if (!disableColOps) hoveredCol = j; }}
						onmouseleave={() => (hoveredCol = null)}
						onfocus={() => { if (!disableColOps) hoveredCol = j; }}
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
						class="touch-none select-none rounded-md p-2 text-center align-middle transition-colors {disableRowOps
							? 'cursor-not-allowed text-slate-100'
							: selectedRow === i
								? 'text-violet-600'
								: 'text-slate-200 hover:text-slate-400'}"
						data-row-handle={i}
						use:dragHandle={{ kind: 'row', index: i }}
						tabindex={disableRowOps ? -1 : 0}
						aria-disabled={disableRowOps}
						aria-label={`Row ${i + 1}`}
						title={`Row ${i + 1}`}
						onkeydown={(e) => onHeaderKeydown(e, () => selectRow(i))}
						onmouseenter={() => { if (!disableRowOps) hoveredRow = i; }}
						onmouseleave={() => (hoveredRow = null)}
						onfocus={() => { if (!disableRowOps) hoveredRow = i; }}
						onblur={() => (hoveredRow = null)}
					>
						<span class="flex h-4 items-center justify-center">
							{@render handleIcon()}
						</span>
					</th>
					{#each row as value, j (j)}
						{@const isHovered = !isAnyDragActive && (hoveredRow === i || hoveredCol === j)}
						{@const isDragging = draggedRow === i || draggedCol === j}
						{@const isDragTarget =
							(draggedRow !== null && dragTargetRow === i && draggedRow !== i) ||
							(draggedCol !== null && dragTargetCol === j && draggedCol !== j)}
						{@const dragPreview = isDragTarget ? { from: value, to: value, showArrow: true } : null}
						{@const scalePreview =
							selectedRow === i || selectedCol === j
								? { from: value, to: value.mul(scaleFactor), showArrow: true }
								: null}
						{@const preview = isAnyDragActive ? dragPreview : (scalePreview ?? computeDropPreview(i, j))}
						{@const marked = markedCells.has(cellKey(i, j))}
						<td class="min-w-20 px-2 py-1">
							<div
								role="button"
								tabindex="0"
								aria-pressed={marked}
								aria-label={`Row ${i + 1}, column ${j + 1}`}
								onclick={() => toggleMark(i, j)}
								onkeydown={(e) => onHeaderKeydown(e, () => toggleMark(i, j))}
								onmouseenter={() => { hoveredRow = i; hoveredCol = j; }}
								onmouseleave={() => { hoveredRow = null; hoveredCol = null; }}
								onfocus={() => { hoveredRow = i; hoveredCol = j; }}
								onblur={() => { hoveredRow = null; hoveredCol = null; }}
								class="flex min-w-20 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-center font-mathnum text-slate-700 transition-colors {marked
									? 'border-violet-500'
									: 'border-transparent'} {isDragging
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
									{#if preview.showArrow}
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
		{@render controlPanel(
			descriptionHtml,
			applyScale,
			cancelScale,
			scaleControlsStrict,
			!scaleFactorValid || scaleFactorIsZero
		)}
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
<div bind:this={controlPanelBottomEl}></div>
{/if}

{#snippet controlPanel(
	descriptionHtml: string,
	onSubmit: () => void,
	onCancel: () => void,
	controls: Snippet,
	submitDisabled: boolean = false
)}
	<div
		bind:this={controlPanelEl}
		class="mt-3 flex flex-col border-t border-slate-200 pt-3 text-sm text-slate-600"
	>
		<div class="text-slate-700">
			{@render controls()}
		</div>
		<div class="text-slate-700 my-2 mx-auto">
			<span>{@html descriptionHtml}</span>
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

{#snippet scaleControls(allowZero: boolean = true)}
	{@const isInvalid = !scaleFactorValid || (!allowZero && scaleFactorIsZero)}
	<div class="flex items-center justify-center gap-3 my-2">
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
		aria-invalid={isInvalid}
		class="min-w-10 [field-sizing:content] text-center rounded-md border px-2 py-1 font-mathnum focus:outline-none {isInvalid
			? 'border-red-400 text-red-600 focus:border-red-500'
			: 'border-slate-300 text-slate-700 focus:border-violet-400'}"
	/></label>
	</div>
	<div class="flex items-center justify-center gap-3 my-2">
		<input
			type="range"
			min="-10"
			max="10"
			step="1"
			value={scaleFactorSlider}
			oninput={(e) => {
				const n = Number(e.currentTarget.value);
				scaleFactor = new Fraction(n);
				scaleFactorText = String(n);
			}}
			aria-label="Scaling factor slider"
			class="w-32 accent-violet-600"
		/>
	</div>
{/snippet}

{#snippet scaleControlsStrict()}
	{@render scaleControls(false)}
{/snippet}

{#snippet dropControls()}
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
	<div class="mx-auto">
	{#if dropMode === 'combine'}
		{@render scaleControls()}
	{/if}
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
