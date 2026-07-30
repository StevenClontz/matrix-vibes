<script lang="ts">
	import type { Matrix } from './matrix';
	import { formatNum } from './matrix';

	let { matrix }: { matrix: Matrix } = $props();

	let selectedRow = $state<number | null>(null);
	let selectedCol = $state<number | null>(null);

	let draggedRow = $state<number | null>(null);
	let draggedCol = $state<number | null>(null);

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
	}

	function onColDrop(j: number, e: DragEvent) {
		e.preventDefault();
		if (draggedCol !== null && draggedCol !== j) {
			alert(`Dropped column C${draggedCol + 1} onto column C${j + 1}`);
		}
		draggedCol = null;
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

<div class="inline-block overflow-auto rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
	<table class="border-separate border-spacing-1">
		<thead>
			<tr>
				<th class="w-10"></th>
				{#each matrix[0] ?? [] as _, j (j)}
					<th
						class="cursor-grab select-none rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors active:cursor-grabbing {selectedCol ===
						j
							? 'border-indigo-500 bg-indigo-100 text-indigo-700'
							: 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						draggable="true"
						tabindex="0"
						onclick={() => selectCol(j)}
						onkeydown={(e) => onHeaderKeydown(e, () => selectCol(j))}
						ondragstart={(e) => onColDragStart(j, e)}
						ondragover={allowDrop}
						ondrop={(e) => onColDrop(j, e)}
					>
						C{j + 1}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each matrix as row, i (i)}
				<tr>
					<th
						class="cursor-grab select-none rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors active:cursor-grabbing {selectedRow ===
						i
							? 'border-indigo-500 bg-indigo-100 text-indigo-700'
							: 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						draggable="true"
						tabindex="0"
						onclick={() => selectRow(i)}
						onkeydown={(e) => onHeaderKeydown(e, () => selectRow(i))}
						ondragstart={(e) => onRowDragStart(i, e)}
						ondragover={allowDrop}
						ondrop={(e) => onRowDrop(i, e)}
					>
						R{i + 1}
					</th>
					{#each row as value, j (j)}
						<td
							class="min-w-12 rounded-md border px-3 py-1.5 text-center font-mono text-sm transition-colors {selectedRow ===
								i || selectedCol === j
								? 'border-indigo-200 bg-indigo-50'
								: 'border-slate-200 bg-slate-50'}"
						>
							{formatNum(value)}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
