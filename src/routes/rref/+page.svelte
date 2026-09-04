<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import StudentInfoModal from '$lib/StudentInfoModal.svelte';
	import AlertModal from '$lib/AlertModal.svelte';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import {
		generateSkillTestMatrix,
		isRref,
		pivotCellKeys,
		type Matrix,
		type HistoryEntry
	} from '$lib/matrix';

	const MAX_WRONG_ATTEMPTS = 3;

	let studentName = $state('');
	let instructorName = $state('');
	let matrix: Matrix = $state<Matrix>([]);
	let markedCells: Set<string> = $state(new Set());
	let steps = $state(0);
	let history: HistoryEntry[] = $state([{ matrix, opLatex: null, kind: null }]);
	let started = $state(false);
	let claimResult = $state<'success' | null>(null);
	let wrongAttempts = $state(0);
	let isPracticeMode = $state(false);
	let submittedAt = $state<Date | null>(null);
	let alertTitle: string | null = $state(null);
	let alertMessage: string | null = $state(null);
	let showResetConfirm = $state(false);

	function handleSubmit(name: string, instructor: string) {
		studentName = name;
		instructorName = instructor;
		matrix = generateSkillTestMatrix();
		steps = 0;
		isPracticeMode = false;
		started = true;
	}

	function handlePractice() {
		studentName = "PRACTICE";
		instructorName = "PRACTICE";
		matrix = generateSkillTestMatrix();
		steps = 0;
		wrongAttempts = 0;
		isPracticeMode = true;
		started = true;
	}

	function claimFinished() {
		const truePivots = pivotCellKeys(matrix);
		const pivotsMatch =
			truePivots.size === markedCells.size && [...truePivots].every((k) => markedCells.has(k));
		if (isRref(matrix) && pivotsMatch) {
			claimResult = 'success';
			submittedAt = new Date();
			return;
		}
		wrongAttempts += 1;
		if (isPracticeMode) {
			alertTitle = "Incorrect Submission"
		} else {
			alertTitle = `Incorrect Submission (${MAX_WRONG_ATTEMPTS-wrongAttempts}/${MAX_WRONG_ATTEMPTS} attempts remain)`
		}
		if (!isPracticeMode && wrongAttempts >= MAX_WRONG_ATTEMPTS) {
			alertMessage =
				`Sorry, you've used all your ${MAX_WRONG_ATTEMPTS} attempts without a correct answer. Keep working on this matrix in Practice Mode, then reset to try again with a new matrix!`;
			isPracticeMode = true;
			return;
		}
		alertMessage =
			'Not quite — double-check that your matrix satisfies all the properties of RREF, and that every pivot (and no non-pivot) is marked.';
	}

	function handleReset() {
		started = false;
		claimResult = null;
		matrix = [];
		markedCells = new Set();
		steps = 0;
		wrongAttempts = 0;
		isPracticeMode = false;
		submittedAt = null;
		showResetConfirm = false;
	}
</script>

<svelte:head>
	<title>Matrix.Clontz.org | RREF Skill Test</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center gap-4 bg-slate-50 p-10 pb-0">
	<h1 class="text-2xl font-bold text-slate-800">RREF Skill Test</h1>
	{#if started}
		{#if claimResult === 'success'}
			<h2 id="rref-result-title" class="text-xl font-bold text-sky-700">RREF Found! 🎉</h2>
			<p class="text-sm text-slate-600">Attempts: {wrongAttempts + 1} · Steps: {steps}</p>
			{#if !isPracticeMode}
				<p class="text-sm text-slate-800">Name: {studentName} · Instructor: {instructorName}</p>
				<p class="text-sm text-slate-600">Completed on: {(submittedAt as Date).toLocaleString()}</p>
			{/if}
			<button
				onclick={() => (showResetConfirm = true)}
				class="rounded-md px-4 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-200"
			>
				Reset
			</button>
		{:else}
			<p class="text-sm text-slate-800">
				Use the controls below to manipulate the given matrix into reduced
				row echelon form, and click the cells to mark each pivot.
			</p>
			<p class="text-sm text-slate-600">
				{#if isPracticeMode}
					Practice Mode · Attempts: {wrongAttempts}
				{:else}
					Name: {studentName}
					· Instructor: {instructorName}
					· Attempts remaining: {MAX_WRONG_ATTEMPTS-wrongAttempts}/{MAX_WRONG_ATTEMPTS}
				{/if}
			</p>
			<div class="flex items-center gap-3">
				<button
					onclick={claimFinished}
					class="rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition-colors hover:bg-sky-700"
				>
					{#if isPracticeMode}
						Check if matrix is RREF
					{:else}
						Submit matrix as RREF
					{/if}
				</button>
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
			bind:markedCells
			bind:steps
			bind:history
			disableColOps
			hideControls={claimResult === 'success'}
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
