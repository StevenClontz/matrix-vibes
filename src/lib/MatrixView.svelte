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

	let rowGhostEl: HTMLDivElement | undefined;
	let colGhostEl: HTMLDivElement | undefined;

	const ghostCellClass = 'rounded-md bg-indigo-50 px-3 py-1.5 font-mono text-sm text-indigo-700';

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
		e.dataTransfer?.setData('text/plain', String(i));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';

		if (e.dataTransfer && rowGhostEl) {
			rowGhostEl.innerHTML = matrix[i]
				.map((v) => `<span class="${ghostCellClass}">${formatNum(v)}</span>`)
				.join('');
			e.dataTransfer.setDragImage(rowGhostEl, rowGhostEl.offsetWidth / 2, rowGhostEl.offsetHeight / 2);
		}
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
		e.dataTransfer?.setData('text/plain', String(j));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';

		if (e.dataTransfer && colGhostEl) {
			colGhostEl.innerHTML = matrix
				.map((row) => `<span class="${ghostCellClass}">${formatNum(row[j])}</span>`)
				.join('');
			e.dataTransfer.setDragImage(colGhostEl, colGhostEl.offsetWidth / 2, colGhostEl.offsetHeight / 2);
		}
	}

	function onColDrop(j: number, e: DragEvent) {
		e.preventDefault();
		if (draggedCol !== null && draggedCol !== j) {
			alert(`Dropped column C${draggedCol + 1} onto column C${j + 1}`);
		}
		draggedCol = null;
	}

	function onCellDrop(i: number, j: number, e: DragEvent) {
		if (draggedRow !== null) {
			onRowDrop(i, e);
		} else if (draggedCol !== null) {
			onColDrop(j, e);
		}
	}

	function onDragEnd() {
		draggedRow = null;
		draggedCol = null;
		if (rowGhostEl) rowGhostEl.innerHTML = '';
		if (colGhostEl) colGhostEl.innerHTML = '';
	}

	function allowDrop(e: DragEvent) {
		e.preventDefault();
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

<div class="inline-block overflow-auto rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
	<table class="border-separate border-spacing-1">
		<thead>
			<tr>
				<th class="w-10"></th>
				{#each matrix[0] ?? [] as _, j (j)}
					<th
						class="cursor-grab select-none rounded-md p-2 text-center align-middle transition-colors active:cursor-grabbing {selectedCol ===
						j
							? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
							: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}"
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
						ondragover={allowDrop}
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
							? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
							: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}"
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
						ondragover={allowDrop}
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
						<td
							class="min-w-12 rounded-md px-3 py-1.5 text-center font-mono text-sm text-slate-700 transition-colors {isDragging
								? 'opacity-40'
								: isSelected
									? 'bg-indigo-100'
									: isHovered
										? 'bg-indigo-50'
										: ''}"
							ondragover={allowDrop}
							ondrop={(e) => onCellDrop(i, j, e)}
						>
							{formatNum(value)}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<div
	bind:this={rowGhostEl}
	class="pointer-events-none fixed -top-[9999px] -left-[9999px] flex flex-row items-center gap-1 rounded-lg border border-indigo-200 bg-white/90 p-2 opacity-60 shadow-lg"
></div>
<div
	bind:this={colGhostEl}
	class="pointer-events-none fixed -top-[9999px] -left-[9999px] flex flex-col items-center gap-1 rounded-lg border border-indigo-200 bg-white/90 p-2 opacity-60 shadow-lg"
></div>
