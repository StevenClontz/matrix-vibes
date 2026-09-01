<script lang="ts">
	import katex from 'katex';
	import { matrixToLatex, type Matrix } from './matrix';

	let {
		studentName,
		instructorName,
		beforeMatrix,
		afterMatrix,
		markedCells,
		attempts,
		steps,
		submittedAt,
		onclose
	}: {
		studentName: string;
		instructorName: string;
		beforeMatrix: Matrix;
		afterMatrix: Matrix;
		markedCells: Set<string>;
		attempts: number;
		steps: number;
		submittedAt: Date;
		onclose: () => void;
	} = $props();

	let beforeHtml = $derived(
		katex.renderToString(matrixToLatex(beforeMatrix), { throwOnError: false }) + "\\sim\\cdots"
	);
	let afterHtml = $derived(
		katex.renderToString("\\sim" + matrixToLatex(afterMatrix, markedCells), { throwOnError: false })
	);
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
/>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
	role="presentation"
	onmousedown={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<div
		class="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-auto rounded-lg bg-white p-6 shadow-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="rref-result-title"
	>
		<h2 id="rref-result-title" class="text-lg font-bold text-emerald-700">RREF Found!</h2>
		<p class="text-sm text-slate-600">Name: {studentName} · Instructor: {instructorName}</p>
		<p class="text-sm text-slate-600">Attempts: {attempts}</p>
		<p class="text-sm text-slate-600">Steps: {steps}</p>
		<p class="text-sm text-slate-600">Completed on: {submittedAt.toLocaleString()}</p>
		<div class="flex flex-col items-center gap-2">
			<div>{@html beforeHtml}</div>
		</div>
		<div class="flex flex-col items-center gap-2">
			<div>{@html afterHtml}</div>
		</div>
		<div class="flex justify-center border-t border-slate-200 pt-4">
			<button
				onclick={onclose}
				class="rounded-md bg-violet-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-violet-700"
			>
				Close
			</button>
		</div>
	</div>
</div>
