<script lang="ts">
	let {
		title,
		message,
		confirmLabel = 'Confirm',
		oncancel,
		onconfirm
	}: {
		title: string;
		message: string;
		confirmLabel?: string;
		oncancel: () => void;
		onconfirm: () => void;
	} = $props();
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') oncancel();
	}}
/>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
	role="presentation"
	onmousedown={(e) => {
		if (e.target === e.currentTarget) oncancel();
	}}
>
	<div
		class="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 shadow-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-modal-title"
	>
		<h2 id="confirm-modal-title" class="text-lg font-bold text-slate-800">{title}</h2>
		<p class="text-sm text-slate-600">{message}</p>
		<div class="flex justify-center gap-3 border-t border-slate-200 pt-4">
			<button
				onclick={oncancel}
				class="rounded-md px-4 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-100"
			>
				Cancel
			</button>
			<button
				onclick={onconfirm}
				class="rounded-md bg-violet-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-violet-700"
			>
				{confirmLabel}
			</button>
		</div>
	</div>
</div>
