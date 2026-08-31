<script lang="ts">
	let {
		onsubmit
	}: {
		onsubmit: (name: string, instructor: string) => void;
	} = $props();

	let name = $state('');
	let instructor = $state('');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmedName = name.trim();
		const trimmedInstructor = instructor.trim();
		if (!trimmedName || !trimmedInstructor) return;
		onsubmit(trimmedName, trimmedInstructor);
	}

	let firstInputEl = $state<HTMLInputElement>();
	$effect(() => {
		firstInputEl?.focus();
	});
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
	role="presentation"
>
	<div
		class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="student-info-title"
	>
		<h2 id="student-info-title" class="text-lg font-bold text-slate-800">Your Info</h2>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<label class="flex flex-col gap-1 text-sm text-slate-600">
				Your name
				<input
					bind:this={firstInputEl}
					type="text"
					bind:value={name}
					required
					class="rounded-md border border-slate-300 px-3 py-1.5 focus:border-violet-400 focus:outline-none"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm text-slate-600">
				Instructor's name
				<input
					type="text"
					bind:value={instructor}
					required
					class="rounded-md border border-slate-300 px-3 py-1.5 focus:border-violet-400 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="mt-2 rounded-md bg-violet-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-violet-700"
			>
				Start
			</button>
		</form>
	</div>
</div>
