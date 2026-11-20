<script lang="ts">
	import Fraction from 'fraction.js';
	import MatrixView from '$lib/MatrixView.svelte';
	import StudentInfoModal from '$lib/StudentInfoModal.svelte';
	import AlertModal from '$lib/AlertModal.svelte';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import {
		generateDetTestMatrix,
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

	/** Called by MatrixView once the last row and column are removed. Every
	 *  recorded step was verified as it was made, so this should always succeed. */
	function checkFinished() {
		if (currentCoef.equals(trueDet)) {
			result = 'success';
			finishedAt = new Date();
			return;
		}
		alertTitle = 'Something went wrong';
		alertMessage = 'Not quite — undo and double-check your work.';
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
					Determinant Found! 🎉 det = {currentCoef.toFraction()}
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
				Use row and column operations to make a row or column all 0s except for a 1 on the
				diagonal, then select it and remove that row and column. After each operation, enter
				the new coefficient so that the equation of determinants stays true. Repeat until the
				whole matrix is removed: the remaining coefficient is the determinant.
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
				<button
					onclick={() => (showResetConfirm = true)}
					class="rounded-md px-4 py-2 font-medium text-slate-500 transition-colors hover:bg-slate-200"
				>
					Reset
				</button>
			</div>
		{/if}
		<MatrixView
			bind:matrix
			bind:steps
			bind:history
			detMode
			onmistake={handleMistake}
			onremovelast={checkFinished}
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
