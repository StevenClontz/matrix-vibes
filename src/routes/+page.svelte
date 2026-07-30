<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import type { Matrix } from '$lib/matrix';

	const matrix: Matrix = [
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9]
	];
</script>

<main class="flex min-h-screen flex-col items-center gap-6 bg-slate-50 p-10">
	<h1 class="text-2xl font-bold text-slate-800">Matrix Vibes</h1>
	<MatrixView {matrix} />
</main>
