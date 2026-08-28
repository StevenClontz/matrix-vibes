<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import NewMatrixModal from '$lib/NewMatrixModal.svelte';
	import { matrixFromInts, type Matrix } from '$lib/matrix';

	let matrix: Matrix = $state(
		matrixFromInts([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9]
		])
	);

	let showNewMatrixModal = $state(false);
</script>

<main class="flex min-h-screen flex-col items-center gap-6 bg-slate-50 p-10">
	<h1 class="text-2xl font-bold text-slate-800">Row and Column Operations Calculator</h1>
	<button
		onclick={() => (showNewMatrixModal = true)}
		class="rounded-md bg-violet-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-violet-700"
	>
		New Matrix
	</button>
	<MatrixView bind:matrix />
</main>

{#if showNewMatrixModal}
	<NewMatrixModal
		current={matrix}
		onclose={() => (showNewMatrixModal = false)}
		oncreate={(newMatrix) => {
			matrix = newMatrix;
			showNewMatrixModal = false;
		}}
	/>
{/if}
