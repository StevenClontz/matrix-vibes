<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import { matrixFromInts, type Matrix } from '$lib/matrix';

	let matrix: Matrix = $state(
		matrixFromInts([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9]
		])
	);
</script>

<main class="flex min-h-screen flex-col items-center gap-6 bg-slate-50 p-10">
	<h1 class="text-2xl font-bold text-slate-800">Row and Column Operations Calculator</h1>
	<MatrixView bind:matrix />
</main>
