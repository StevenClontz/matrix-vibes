<script lang="ts">
	import type { Matrix } from './matrix';
	import { formatNum } from './matrix';

	let { matrix }: { matrix: Matrix } = $props();

	let selectedRow = $state<number | null>(null);
	let selectedCol = $state<number | null>(null);

	let hoveredRow = $state<number | null>(null);
	let hoveredCol = $state<number | null>(null);

	let draggedRow = $state<number | null>(null);
	let draggedCol = $state<number | null>(null);

	// Row/column currently under the cursor during an active drag. Separate from
	// hoveredRow/hoveredCol (mouse-hover-only, used for the non-drag highlight feature).
	let dragTargetRow = $state<number | null>(null);
	let dragTargetCol = $state<number | null>(null);

	let ghostValues = $state<number[] | null>(null);
	let ghostOrientation = $state<'row' | 'col' | null>(null);
	let ghostX = $state(0);
	let ghostY = $state(0);

	let isAnyDragActive = $derived(draggedRow !== null || draggedCol !== null);

	let isOverDragTarget = $derived(
		(ghostOrientation === 'row' && dragTargetRow !== null && dragTargetRow !== draggedRow) ||
			(ghostOrientation === 'col' && dragTargetCol !== null && dragTargetCol !== draggedCol)
	);

	// Plain pointer-based drag (mousedown/mousemove/mouseup) instead of the native HTML5
	// draggable/dragstart API: native drag hands cursor rendering to the browser/OS, which is
	// unreliable across environments (e.g. shows a "no-drop" cursor outside our control). Doing
	// our own tracking means the cursor is just CSS, fully within our control the whole time.
	const DRAG_THRESHOLD = 4;
	let pendingDrag: { kind: 'row' | 'col'; index: number; startX: number; startY: number } | null =
		null;

	function updateDragTarget(x: number, y: number) {
		const el = document.elementFromPoint(x, y);
		if (draggedRow !== null) {
			const rowEl = el?.closest<HTMLElement>('[data-row]') ?? null;
			dragTargetRow = rowEl ? Number(rowEl.dataset.row) : null;
		}
		if (draggedCol !== null) {
			const colEl = el?.closest<HTMLElement>('[data-col]') ?? null;
			dragTargetCol = colEl ? Number(colEl.dataset.col) : null;
		}
	}

	function onPointerMove(e: MouseEvent) {
		if (!pendingDrag) return;

		if (draggedRow === null && draggedCol === null) {
			const dx = e.clientX - pendingDrag.startX;
			const dy = e.clientY - pendingDrag.startY;
			if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

			if (pendingDrag.kind === 'row') {
				draggedRow = pendingDrag.index;
				ghostValues = matrix[pendingDrag.index];
				ghostOrientation = 'row';
			} else {
				draggedCol = pendingDrag.index;
				ghostValues = matrix.map((row) => row[pendingDrag!.index]);
				ghostOrientation = 'col';
			}
			document.body.style.cursor = 'grabbing';
		}

		ghostX = e.clientX;
		ghostY = e.clientY;
		updateDragTarget(e.clientX, e.clientY);
	}

	function onPointerUp() {
		window.removeEventListener('mousemove', onPointerMove);
		window.removeEventListener('mouseup', onPointerUp);

		if (draggedRow !== null) {
			if (dragTargetRow !== null && dragTargetRow !== draggedRow) {
				alert(`Dropped row R${draggedRow + 1} onto row R${dragTargetRow + 1}`);
			}
		} else if (draggedCol !== null) {
			if (dragTargetCol !== null && dragTargetCol !== draggedCol) {
				alert(`Dropped column C${draggedCol + 1} onto column C${dragTargetCol + 1}`);
			}
		} else if (pendingDrag) {
			// Mouse never moved past the threshold: treat it as a click, not a drag.
			if (pendingDrag.kind === 'row') selectRow(pendingDrag.index);
			else selectCol(pendingDrag.index);
		}

		pendingDrag = null;
		draggedRow = null;
		draggedCol = null;
		dragTargetRow = null;
		dragTargetCol = null;
		ghostValues = null;
		ghostOrientation = null;
		document.body.style.cursor = '';
	}

	function onHandlePointerDown(kind: 'row' | 'col', index: number, e: MouseEvent) {
		if (e.button !== 0) return;
		e.preventDefault(); // avoid native text-selection drag while we track the mouse ourselves
		pendingDrag = { kind, index, startX: e.clientX, startY: e.clientY };
		window.addEventListener('mousemove', onPointerMove);
		window.addEventListener('mouseup', onPointerUp);
	}

	function selectRow(i: number) {
		selectedRow = selectedRow === i ? null : i;
		alert(`Selected row R${i + 1}`);
	}

	function selectCol(j: number) {
		selectedCol = selectedCol === j ? null : j;
		alert(`Selected column C${j + 1}`);
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
							: 'cursor-grab'} select-none rounded-md p-2 text-center align-middle transition-colors {selectedCol ===
						j
							? 'text-violet-600'
							: 'text-slate-200 hover:text-slate-400'}"
						data-col={j}
						tabindex="0"
						aria-label={`Column ${j + 1}`}
						title={`Column ${j + 1}`}
						onkeydown={(e) => onHeaderKeydown(e, () => selectCol(j))}
						onmouseenter={() => (hoveredCol = j)}
						onmouseleave={() => (hoveredCol = null)}
						onfocus={() => (hoveredCol = j)}
						onblur={() => (hoveredCol = null)}
						onmousedown={(e) => onHandlePointerDown('col', j, e)}
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
				<tr data-row={i}>
					<th
						class="{isAnyDragActive
							? 'cursor-grabbing'
							: 'cursor-grab'} select-none rounded-md p-2 text-center align-middle transition-colors {selectedRow ===
						i
							? 'text-violet-600'
							: 'text-slate-200 hover:text-slate-400'}"
						tabindex="0"
						aria-label={`Row ${i + 1}`}
						title={`Row ${i + 1}`}
						onkeydown={(e) => onHeaderKeydown(e, () => selectRow(i))}
						onmouseenter={() => (hoveredRow = i)}
						onmouseleave={() => (hoveredRow = null)}
						onfocus={() => (hoveredRow = i)}
						onblur={() => (hoveredRow = null)}
						onmousedown={(e) => onHandlePointerDown('row', i, e)}
					>
						<span class="flex h-4 items-center justify-center">
							{@render handleIcon()}
						</span>
					</th>
					{#each row as value, j (j)}
						{@const isSelected = selectedRow === i || selectedCol === j}
						{@const isHovered = !isAnyDragActive && (hoveredRow === i || hoveredCol === j)}
						{@const isDragging = draggedRow === i || draggedCol === j}
						{@const previewValue =
							draggedRow !== null && dragTargetRow === i && draggedRow !== i
								? matrix[draggedRow][j]
								: draggedCol !== null && dragTargetCol === j && draggedCol !== j
									? matrix[i][draggedCol]
									: null}
						<td class="min-w-12 px-2 py-1" data-col={j}>
							<div
								class="flex min-w-10 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-center font-mathnum text-slate-700 transition-colors {isDragging
									? ''
									: previewValue !== null
										? 'bg-violet-50'
										: isSelected
											? 'bg-violet-100'
											: isHovered
												? 'bg-violet-50'
												: ''}"
							>
								{#if previewValue !== null}
									<span class="decoration-slate-300">{formatNum(value)}</span>
									<span class="font-semibold text-violet-600">{formatNum(previewValue)}</span>
								{:else}
									{formatNum(value)}
								{/if}
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if ghostValues && !isOverDragTarget}
	<div
		class="pointer-events-none fixed z-50 flex {ghostOrientation === 'row'
			? 'flex-row'
			: 'flex-col'} items-center gap-1 rounded-lg border border-violet-200 bg-white/90 p-2 opacity-60 shadow-lg"
		style="left: {ghostX}px; top: {ghostY}px; transform: translate(-50%, -50%);"
	>
		{#each ghostValues as v}
			<span class="rounded-md px-3 py-1.5 font-mathnum text-violet-700">{formatNum(v)}</span>
		{/each}
	</div>
{/if}
