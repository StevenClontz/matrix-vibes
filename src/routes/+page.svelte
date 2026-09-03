<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import NewMatrixModal from '$lib/NewMatrixModal.svelte';
	import { matrixFromInts, type Matrix } from '$lib/matrix';

	let matrix: Matrix = $state(
		matrixFromInts([
			[1, 2, 3, 4],
			[5, 6, 7, 8],
			[9, 10, 11, 12]
		])
	);

	let showNewMatrixModal = $state(false);
</script>

<svelte:head>
	<title>Matrix.Clontz.org Row/Column Operation Calculator</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center gap-6 bg-slate-50 p-10">
	<div class="flex items-center gap-8 border-b border-slate-200 px-6 pb-2">
		<a href="/rrefle" class="text-slate-500 hover:text-slate-700 hover:underline">RREF-le!</a>
		<a href="/rref" class="text-slate-500 hover:text-slate-700 hover:underline">RREF Skill Test</a>
	</div>
	<h1 class="text-2xl font-bold text-slate-800">Row/Column Operation Calculator</h1>
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
