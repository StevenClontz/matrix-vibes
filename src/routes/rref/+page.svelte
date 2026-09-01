<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import StudentInfoModal from '$lib/StudentInfoModal.svelte';
	import RrefResultModal from '$lib/RrefResultModal.svelte';
	import { generateSkillTestMatrix, isRref, pivotCellKeys, type Matrix } from '$lib/matrix';

	const MAX_WRONG_ATTEMPTS = 3;

	let studentName = $state('');
	let instructorName = $state('');
	let matrix: Matrix = $state<Matrix>([]);
	let initialMatrix: Matrix = $state<Matrix>([]);
	let markedCells: Set<string> = $state(new Set());
	let steps = $state(0);
	let started = $state(false);
	let claimResult = $state<'success' | null>(null);
	let wrongAttempts = $state(0);
	let showResultModal = $state(false);
	let isPracticeMode = $state(false);
	let submittedAt = $state<Date | null>(null);

	function handleSubmit(name: string, instructor: string) {
		studentName = name;
		instructorName = instructor;
		matrix = generateSkillTestMatrix();
		initialMatrix = matrix;
		steps = 0;
		isPracticeMode = false;
		started = true;
	}

	function handlePractice() {
		matrix = generateSkillTestMatrix();
		initialMatrix = matrix;
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
			showResultModal = true;
			return;
		}
		wrongAttempts += 1;
		if (!isPracticeMode && wrongAttempts >= MAX_WRONG_ATTEMPTS) {
			alert(
				"You've used all 3 attempts without a correct answer. You'll need to reattempt the test — the page will now reload with a new matrix."
			);
			location.reload();
			return;
		}
		alert(
			'Not quite — double-check that your matrix satisfies all the properties of RREF, and that every pivot (and no non-pivot) is marked.'
		);
	}
</script>

<main class="flex min-h-screen flex-col items-center gap-4 bg-slate-50 p-10">
	<h1 class="text-2xl font-bold text-slate-800">RREF Skill Test</h1>
	{#if started}
		<p class="text-sm text-slate-800">
			Use the controls below to manipulate the given matrix into reduced
			row echelon form, and click the cells to mark each pivot.
		</p>
		<p class="text-sm text-slate-600">
			{#if isPracticeMode}
				Practice · Attempts: {wrongAttempts}
			{:else}
				Name: {studentName} 
				· Instructor: {instructorName}
				· Attempts remaining: {MAX_WRONG_ATTEMPTS-wrongAttempts}/{MAX_WRONG_ATTEMPTS}
			{/if}
		</p>
		{#if claimResult === 'success'}
			<p class="max-w-md text-center text-sm font-medium text-emerald-700">
				Test complete — this matrix was confirmed in RREF.
			</p>
			<button
				onclick={() => (showResultModal = true)}
				class="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700"
			>
				View Result
			</button>
		{:else}
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
			<MatrixView bind:matrix bind:markedCells bind:steps disableColOps />
		{/if}
	{/if}
</main>

{#if !started}
	<StudentInfoModal onsubmit={handleSubmit} onpractice={handlePractice} />
{/if}

{#if showResultModal}
	<RrefResultModal
		{studentName}
		{instructorName}
		beforeMatrix={initialMatrix}
		afterMatrix={matrix}
		{markedCells}
		attempts={wrongAttempts + 1}
		{steps}
		submittedAt={submittedAt as Date}
		onclose={() => (showResultModal = false)}
	/>
{/if}
