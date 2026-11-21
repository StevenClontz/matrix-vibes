<script lang="ts">
	import Fraction from 'fraction.js';
	import katex from 'katex';
	import MatrixView from '$lib/MatrixView.svelte';
	import StudentInfoModal from '$lib/StudentInfoModal.svelte';
	import AlertModal from '$lib/AlertModal.svelte';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import {
		generateDetTestMatrix,
		parseRational,
		coefLatex,
		matrixToLatex,
		type Matrix,
		type HistoryEntry
	} from '$lib/matrix';

	const MAX_MISTAKES = 3;

	let studentName = $state('');
	let instructorName = $state('');
	let matrix: Matrix = $state<Matrix>([]);
	let trueDet = $state(0);
	let steps = $state(0);
	let history: HistoryEntry[] = $state([
		{ matrix, opLatex: null, kind: null, detCoef: new Fraction(1) }
	]);
	let started = $state(false);
	let result = $state<'success' | 'ended' | null>(null);
	let mistakes = $state(0);
	let isPracticeMode = $state(false);
	let finishedAt = $state<Date | null>(null);
	let alertTitle: string | null = $state(null);
	let alertMessage: string | null = $state(null);
	let showResetConfirm = $state(false);

	let currentCoef = $derived(history[history.length - 1].detCoef ?? new Fraction(1));

	let solving = $state(false);
	let solveText = $state('');
	let solveParsed = $derived(parseRational(solveText));
	let solveLabelHtml = $derived(
		matrix.length === 2
			? katex.renderToString(
					`\\det ${matrixToLatex(history[0].matrix)} = ${coefLatex(currentCoef)}\\det ${matrixToLatex(matrix)} =`,
					{ throwOnError: false }
				)
			: ''
	);

	// The Solve form only applies while the matrix is 2x2 (e.g. close it after an undo).
	$effect(() => {
		if (matrix.length !== 2) solving = false;
	});

	function openSolve() {
		solveText = '';
		solving = true;
	}

	function submitSolve() {
		if (solveParsed === null) return;
		if (solveParsed.equals(trueDet)) {
			solving = false;
			result = 'success';
			finishedAt = new Date();
			return;
		}
		handleMistake("That isn't the determinant of the original matrix.");
	}

	function newMatrix() {
		const generated = generateDetTestMatrix();
		matrix = generated.matrix;
		trueDet = generated.det;
	}

	function handleSubmit(name: string, instructor: string) {
		studentName = name;
		instructorName = instructor;
		newMatrix();
		steps = 0;
		mistakes = 0;
		isPracticeMode = false;
		started = true;
	}

	function handlePractice() {
		studentName = 'PRACTICE';
		instructorName = 'PRACTICE';
		newMatrix();
		steps = 0;
		mistakes = 0;
		isPracticeMode = true;
		started = true;
	}

	/** Called by MatrixView when a step is incorrect (the step itself is refused). */
	function handleMistake(message: string) {
		mistakes += 1;
		if (isPracticeMode) {
			alertTitle = 'Mistake';
			alertMessage = message;
			return;
		}
		alertTitle = `Mistake (${MAX_MISTAKES - mistakes}/${MAX_MISTAKES} remaining)`;
		if (mistakes >= MAX_MISTAKES) {
			alertMessage = `${message} You've made ${MAX_MISTAKES} mistakes, so this attempt has ended. Reset to try again with a new matrix.`;
			result = 'ended';
			finishedAt = new Date();
			return;
		}
		alertMessage = message;
	}

	function handleReset() {
		started = false;
		result = null;
		matrix = [];
		trueDet = 0;
		steps = 0;
		mistakes = 0;
		isPracticeMode = false;
		finishedAt = null;
		solving = false;
		solveText = '';
		showResetConfirm = false;
	}
</script>

<svelte:head>
	<title>Matrix.Clontz.org | Determinant Skill Test</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center gap-4 bg-slate-50 p-10 pb-0">
	<h1 class="text-2xl font-bold text-slate-800">Determinant Skill Test</h1>
	{#if started}
		{#if result !== null}
			{#if result === 'success'}
				<h2 id="det-result-title" class="text-xl font-bold text-sky-700">
					Determinant Found! 🎉
				</h2>
			{:else}
				<h2 id="det-result-title" class="text-xl font-bold text-red-700">Attempt Ended</h2>
			{/if}
			<p class="text-sm text-slate-600">Mistakes: {mistakes} · Steps: {steps}</p>
			{#if !isPracticeMode}
				<p class="text-sm text-slate-800">Name: {studentName} · Instructor: {instructorName}</p>
				<p class="text-sm text-slate-600">
					{result === 'success' ? 'Completed' : 'Ended'} on: {(finishedAt as Date).toLocaleString()}
				</p>
			{/if}
			<button
				onclick={() => (showResetConfirm = true)}
				class="rounded-md px-4 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-200"
			>
				Reset
			</button>
		{:else}
			<p class="max-w-2xl text-sm text-slate-800">
				Use the below controls to reduce the 4x4 determinant to a 2x2 determinant,
				and then solve for its value.
			</p>
			<p class="text-sm text-slate-600">
				{#if isPracticeMode}
					Practice Mode · Mistakes: {mistakes}
				{:else}
					Name: {studentName}
					· Instructor: {instructorName}
					· Mistakes remaining: {MAX_MISTAKES - mistakes}/{MAX_MISTAKES}
				{/if}
			</p>
			<div class="flex items-center gap-3">
				{#if matrix.length === 2}
					<button
						onclick={openSolve}
						class="rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition-colors hover:bg-sky-700"
					>
						Solve
					</button>
				{/if}
				<button
					onclick={() => (showResetConfirm = true)}
					class="rounded-md px-4 py-2 font-medium text-slate-500 transition-colors hover:bg-slate-200"
				>
					Reset
				</button>
			</div>
			{#if solving}
				<div
					class="flex flex-col items-center gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
				>
					<div class="flex flex-wrap items-center justify-center gap-2 text-slate-800">
						<span>{@html solveLabelHtml}</span>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							type="text"
							autofocus
							aria-label="Determinant of the original matrix"
							bind:value={solveText}
							onkeydown={(e) => {
								if (e.key === 'Enter') submitSolve();
							}}
							class="min-w-16 [field-sizing:content] rounded-md border px-2 py-1 text-center font-mathnum focus:outline-none {solveText ===
								'' || solveParsed !== null
								? 'border-slate-300 text-slate-700 focus:border-sky-500'
								: 'border-red-400 text-red-600 focus:border-red-500'}"
						/>
					</div>
					<div class="flex items-center gap-3">
						<button
							onclick={submitSolve}
							disabled={solveParsed === null}
							class="rounded-md bg-sky-600 px-3 py-1 font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Submit
						</button>
						<button
							onclick={() => (solving = false)}
							class="rounded-md px-3 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100"
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}
		{/if}
		<MatrixView
			bind:matrix
			bind:steps
			bind:history
			detMode
			onmistake={handleMistake}
			detFinalValue={result === 'success' ? trueDet : null}
			hideControls={result !== null}
		/>
	{/if}
</main>

{#if !started}
	<StudentInfoModal
		onsubmit={handleSubmit}
		onpractice={handlePractice}
		initialName={studentName === 'PRACTICE' ? '' : studentName}
		initialInstructor={instructorName === 'PRACTICE' ? '' : instructorName}
	/>
{/if}

{#if alertMessage && alertTitle}
	<AlertModal
		title={alertTitle}
		message={alertMessage}
		onclose={() => {
			alertMessage = null;
		}}
	/>
{/if}

{#if showResetConfirm}
	<ConfirmModal
		title="Reset attempt?"
		message="This will discard your current progress and generate a new matrix. This can't be undone."
		confirmLabel="Reset"
		oncancel={() => (showResetConfirm = false)}
		onconfirm={handleReset}
	/>
{/if}
