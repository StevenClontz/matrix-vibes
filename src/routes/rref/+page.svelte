<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import StudentInfoModal from '$lib/StudentInfoModal.svelte';
	import { generateSkillTestMatrix, type Matrix } from '$lib/matrix';

	let studentName = $state('');
	let instructorName = $state('');
	let matrix: Matrix = $state<Matrix>([]);
	let started = $state(false);

	function handleSubmit(name: string, instructor: string) {
		studentName = name;
		instructorName = instructor;
		matrix = generateSkillTestMatrix();
		started = true;
	}
</script>

<main class="flex min-h-screen flex-col items-center gap-6 bg-slate-50 p-10">
	<h1 class="text-2xl font-bold text-slate-800">RREF Skill Test</h1>
	{#if started}
		<p class="text-sm text-slate-600">Name: {studentName} · Instructor: {instructorName}</p>
		<MatrixView bind:matrix disableColOps />
	{/if}
</main>

{#if !started}
	<StudentInfoModal onsubmit={handleSubmit} />
{/if}
