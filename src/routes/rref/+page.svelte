<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import StudentInfoModal from '$lib/StudentInfoModal.svelte';
	import { generateSkillTestMatrix, isRref, pivotCellKeys, type Matrix } from '$lib/matrix';

	const MAX_WRONG_ATTEMPTS = 3;

	let studentName = $state('');
	let instructorName = $state('');
	let matrix: Matrix = $state<Matrix>([]);
	let markedCells: Set<string> = $state(new Set());
	let started = $state(false);
	let claimResult = $state<'success' | null>(null);
	let wrongAttempts = $state(0);

	function handleSubmit(name: string, instructor: string) {
		studentName = name;
		instructorName = instructor;
		matrix = generateSkillTestMatrix();
		started = true;
	}

	function claimFinished() {
		const truePivots = pivotCellKeys(matrix);
		const pivotsMatch =
			truePivots.size === markedCells.size && [...truePivots].every((k) => markedCells.has(k));
		if (isRref(matrix) && pivotsMatch) {
			claimResult = 'success';
			return;
		}
		wrongAttempts += 1;
		if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
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

<main class="flex min-h-screen flex-col items-center gap-6 bg-slate-50 p-10">
	<h1 class="text-2xl font-bold text-slate-800">RREF Skill Test</h1>
	{#if started}
		<p class="text-sm text-slate-600">Name: {studentName} · Instructor: {instructorName}</p>
		<MatrixView bind:matrix bind:markedCells disableColOps />
		<button
			onclick={claimFinished}
			class="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700"
		>
			Confirm RREF
		</button>
		{#if claimResult === 'success'}
			<p class="max-w-md text-center text-sm font-medium text-emerald-700">
				Correct — this matrix is in RREF and every pivot is marked!
			</p>
		{/if}
	{/if}
</main>

{#if !started}
	<StudentInfoModal onsubmit={handleSubmit} />
{/if}
