<script lang="ts">
	import MatrixView from '$lib/MatrixView.svelte';
	import AlertModal from '$lib/AlertModal.svelte';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import {
		generateRrefleMatrix,
		rrefleId,
		rrefleShareText,
		isRref,
		pivotCellKeys,
		type Matrix
	} from '$lib/matrix';

	const id = rrefleId();

	function freshMatrix(): Matrix {
		return generateRrefleMatrix(id);
	}

	let matrix: Matrix = $state(freshMatrix());
	let markedCells: Set<string> = $state(new Set());
	let steps = $state(0);
	let claimResult = $state<'success' | null>(null);
	let alertTitle: string | null = $state(null);
	let alertMessage: string | null = $state(null);
	let showResetConfirm = $state(false);
	let shareFeedback: string | null = $state(null);

	let shareText = $derived(rrefleShareText(id, matrix));

	async function handleShare() {
		if (navigator.share) {
			try {
				await navigator.share({ text: shareText });
				return;
			} catch (err) {
				if ((err as Error)?.name === 'AbortError') return;
			}
		}
		try {
			await navigator.clipboard.writeText(shareText);
			shareFeedback = 'Copied to clipboard!';
		} catch {
			shareFeedback = 'Could not copy — please copy manually.';
		}
		setTimeout(() => (shareFeedback = null), 2000);
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareText);
			shareFeedback = 'Copied to clipboard!';
		} catch {
			shareFeedback = 'Could not copy — please copy manually.';
		}
		setTimeout(() => (shareFeedback = null), 2000);
	}

	function claimFinished() {
		const truePivots = pivotCellKeys(matrix);
		const pivotsMatch =
			truePivots.size === markedCells.size && [...truePivots].every((k) => markedCells.has(k));
		if (isRref(matrix) && pivotsMatch) {
			claimResult = 'success';
			return;
		}
		alertTitle = 'Not quite';
		alertMessage =
			'Not quite — double-check that your matrix satisfies all the properties of RREF, and that every pivot (and no non-pivot) is marked.';
	}

	function handleReset() {
		matrix = freshMatrix();
		markedCells = new Set();
		steps = 0;
		claimResult = null;
		showResetConfirm = false;
	}
</script>

<main class="flex min-h-screen flex-col items-center gap-4 bg-slate-50 p-10 pb-0">
	<h1 class="text-2xl font-bold text-slate-800">RREF-le #{id}</h1>
	{#if claimResult === 'success'}
		<h2 class="text-xl font-bold text-sky-700">RREF Found! 🎉</h2>
		<p class="text-sm text-slate-600">Steps: {steps}</p>
		<textarea
			readonly
			onclick={(e) => e.currentTarget.select()}
			class="text-lg w-80 h-54 border-slate-500 border rounded-sm p-2">{shareText}</textarea
		>
		<div class="flex items-center gap-3">
			<button
				onclick={handleShare}
				class="rounded-md bg-emerald-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-emerald-700"
			>
				Share Results
			</button>
			<button
				onclick={handleCopy}
				class="rounded-md bg-sky-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-sky-700"
			>
				Copy Results
			</button>
			<button
				onclick={() => (showResetConfirm = true)}
				class="rounded-md px-4 py-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-200"
			>
				Reset
			</button>
		</div>
		{#if shareFeedback}
			<p class="text-sm text-emerald-700">{shareFeedback}</p>
		{/if}
	{:else}
		<p class="text-sm text-slate-800">
			Use the controls below to manipulate today's matrix into reduced row echelon form, and
			click the cells to mark each pivot.
		</p>
		<p class="text-sm text-slate-600">Steps: {steps}</p>
		<div class="flex items-center gap-3">
			<button
				onclick={claimFinished}
				class="cursor-pointer rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition-colors hover:bg-sky-700"
			>
				Claim your RREF-le!
			</button>
			<button
				onclick={() => (showResetConfirm = true)}
				class="cursor-pointer rounded-md px-4 py-2 font-medium text-slate-500 transition-colors hover:bg-slate-200"
			>
				Reset
			</button>
		</div>
	{/if}
	<MatrixView bind:matrix bind:markedCells bind:steps disableColOps hideControls={claimResult === 'success'} />
</main>

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
		title="Reset this puzzle?"
		message="This will discard your current progress on today's RREF-le. This can't be undone."
		confirmLabel="Reset"
		oncancel={() => (showResetConfirm = false)}
		onconfirm={handleReset}
	/>
{/if}
