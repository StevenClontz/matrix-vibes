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
	// hoveredRow/hoveredCol (mouse-only) because native drag doesn't fire mouseenter/mouseleave.
	let dragTargetRow = $state<number | null>(null);
	let dragTargetCol = $state<number | null>(null);

	let ghostValues = $state<number[] | null>(null);
	let ghostOrientation = $state<'row' | 'col' | null>(null);
	let ghostX = $state(0);
	let ghostY = $state(0);

	let isOverDragTarget = $derived(
		(ghostOrientation === 'row' && dragTargetRow !== null && dragTargetRow !== draggedRow) ||
			(ghostOrientation === 'col' && dragTargetCol !== null && dragTargetCol !== draggedCol)
	);

	let transparentDragImage: HTMLImageElement | undefined;
	function getTransparentDragImage() {
		if (!transparentDragImage) {
			transparentDragImage = new Image();
			transparentDragImage.src =
				'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ycAAAAAAQABAAACAUwAOw==';
		}
		return transparentDragImage;
	}

	function trackGhostPosition(e: DragEvent) {
		// Browsers fire a final dragover with clientX/clientY at 0,0 right before dragend; ignore it.
		if (e.clientX === 0 && e.clientY === 0) return;
		ghostX = e.clientX;
		ghostY = e.clientY;
	}

	function startGhostTracking() {
		window.addEventListener('dragover', trackGhostPosition);
	}

	function stopGhostTracking() {
		window.removeEventListener('dragover', trackGhostPosition);
	}

	function selectRow(i: number) {
		selectedRow = selectedRow === i ? null : i;
		alert(`Selected row R${i + 1}`);
	}

	function selectCol(j: number) {
		selectedCol = selectedCol === j ? null : j;
		alert(`Selected column C${j + 1}`);
	}

	function onRowDragStart(i: number, e: DragEvent) {
		draggedRow = i;
		ghostValues = matrix[i];
		ghostOrientation = 'row';
		ghostX = e.clientX;
		ghostY = e.clientY;
		e.dataTransfer?.setData('text/plain', String(i));
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setDragImage(getTransparentDragImage(), 0, 0);
		}
		startGhostTracking();
	}

	function onRowDrop(i: number, e: DragEvent) {
		e.preventDefault();
		if (draggedRow !== null && draggedRow !== i) {
			alert(`Dropped row R${draggedRow + 1} onto row R${i + 1}`);
		}
		draggedRow = null;
	}

	function onColDragStart(j: number, e: DragEvent) {
		draggedCol = j;
		ghostValues = matrix.map((row) => row[j]);
		ghostOrientation = 'col';
		ghostX = e.clientX;
		ghostY = e.clientY;
		e.dataTransfer?.setData('text/plain', String(j));
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setDragImage(getTransparentDragImage(), 0, 0);
		}
		startGhostTracking();
	}

	function onColDrop(j: number, e: DragEvent) {
		e.preventDefault();
		if (draggedCol !== null && draggedCol !== j) {
			alert(`Dropped column C${draggedCol + 1} onto column C${j + 1}`);
		}
		draggedCol = null;
	}

	function onRowHandleDragOver(i: number, e: DragEvent) {
		e.preventDefault();
		if (draggedRow !== null) dragTargetRow = i;
	}

	function onColHandleDragOver(j: number, e: DragEvent) {
		e.preventDefault();
		if (draggedCol !== null) dragTargetCol = j;
	}

	function onCellDragOver(i: number, j: number, e: DragEvent) {
		e.preventDefault();
		if (draggedRow !== null) dragTargetRow = i;
		if (draggedCol !== null) dragTargetCol = j;
	}

	function onCellDrop(i: number, j: number, e: DragEvent) {
		if (draggedRow !== null) {
			onRowDrop(i, e);
		} else if (draggedCol !== null) {
			onColDrop(j, e);
		}
	}

	function onTableDragLeave(e: DragEvent) {
		const related = e.relatedTarget as Node | null;
		const table = e.currentTarget as HTMLElement;
		if (!related || !table.contains(related)) {
			dragTargetRow = null;
			dragTargetCol = null;
		}
	}

	function onDragEnd() {
		draggedRow = null;
		draggedCol = null;
		dragTargetRow = null;
		dragTargetCol = null;
		ghostValues = null;
		ghostOrientation = null;
		stopGhostTracking();
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
	<table class="border-collapse" ondragleave={onTableDragLeave}>
		<thead>
			<tr>
				<th class="w-10"></th>
				{#each matrix[0] ?? [] as _, j (j)}
					<th
						class="cursor-grab select-none rounded-md p-2 text-center align-middle transition-colors active:cursor-grabbing {selectedCol ===
						j
							? 'text-violet-600'
							: 'text-slate-400 hover:text-slate-600'}"
						draggable="true"
						tabindex="0"
						aria-label={`Column ${j + 1}`}
						title={`Column ${j + 1}`}
						onclick={() => selectCol(j)}
						onkeydown={(e) => onHeaderKeydown(e, () => selectCol(j))}
						onmouseenter={() => (hoveredCol = j)}
						onmouseleave={() => (hoveredCol = null)}
						onfocus={() => (hoveredCol = j)}
						onblur={() => (hoveredCol = null)}
						ondragstart={(e) => onColDragStart(j, e)}
						ondragend={onDragEnd}
						ondragover={(e) => onColHandleDragOver(j, e)}
						ondrop={(e) => onColDrop(j, e)}
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
						class="cursor-grab select-none rounded-md p-2 text-center align-middle transition-colors active:cursor-grabbing {selectedRow ===
						i
							? 'text-violet-600'
							: 'text-slate-400 hover:text-slate-600'}"
						draggable="true"
						tabindex="0"
						aria-label={`Row ${i + 1}`}
						title={`Row ${i + 1}`}
						onclick={() => selectRow(i)}
						onkeydown={(e) => onHeaderKeydown(e, () => selectRow(i))}
						onmouseenter={() => (hoveredRow = i)}
						onmouseleave={() => (hoveredRow = null)}
						onfocus={() => (hoveredRow = i)}
						onblur={() => (hoveredRow = null)}
						ondragstart={(e) => onRowDragStart(i, e)}
						ondragend={onDragEnd}
						ondragover={(e) => onRowHandleDragOver(i, e)}
						ondrop={(e) => onRowDrop(i, e)}
					>
						<span class="flex h-4 items-center justify-center">
							{@render handleIcon()}
						</span>
					</th>
					{#each row as value, j (j)}
						{@const isSelected = selectedRow === i || selectedCol === j}
						{@const isHovered = hoveredRow === i || hoveredCol === j}
						{@const isDragging = draggedRow === i || draggedCol === j}
						{@const previewValue =
							draggedRow !== null && dragTargetRow === i && draggedRow !== i
								? matrix[draggedRow][j]
								: draggedCol !== null && dragTargetCol === j && draggedCol !== j
									? matrix[i][draggedCol]
									: null}
						<td
							class="min-w-12 px-2 py-1"
							ondragover={(e) => onCellDragOver(i, j, e)}
							ondrop={(e) => onCellDrop(i, j, e)}
						>
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
									<span class="decoration-slate-300"
										>{formatNum(value)}</span
									>
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
