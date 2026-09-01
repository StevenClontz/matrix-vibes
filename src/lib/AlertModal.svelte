<script lang="ts">
	let {
		title,
		message,
		onclose
	}: {
		title: string;
		message: string;
		onclose: () => void;
	} = $props();
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
		class="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 shadow-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="alert-modal-title"
	>
		<h2 id="alert-modal-title" class="text-lg font-bold text-slate-800">{title}</h2>
		<p class="text-sm text-slate-600">{message}</p>
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
