import Fraction from 'fraction.js';

export type Matrix = Fraction[][];

export function createMatrix(rows: number, cols: number): Matrix {
	return Array.from({ length: rows }, () => Array.from({ length: cols }, () => new Fraction(0)));
}

export function identityMatrix(n: number): Matrix {
	return Array.from({ length: n }, (_, i) =>
		Array.from({ length: n }, (_, j) => new Fraction(i === j ? 1 : 0))
	);
}

/** Convenience for building a Matrix literal from plain integers. */
export function matrixFromInts(rows: number[][]): Matrix {
	return rows.map((row) => row.map((v) => new Fraction(v)));
}

export function cloneMatrix(m: Matrix): Matrix {
	return m.map((row) => [...row]);
}

export function cellKey(i: number, j: number): string {
	return `${i},${j}`;
}

/** Renders a matrix as a KaTeX bmatrix, boxing any cells present in `markedCells`. */
export function matrixToLatex(m: Matrix, markedCells?: Set<string>): string {
	const rows = m.map((row, i) =>
		row
			.map((value, j) => {
				const latex = value.toLatex();
				return markedCells?.has(cellKey(i, j)) ? `\\boxed{${latex}}` : latex;
			})
			.join(' & ')
	);
	return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
}

/** True if m satisfies all RREF properties: zero rows at bottom, each pivot
 *  equal to 1, pivot columns strictly increasing downward, each pivot the
 *  only nonzero entry in its column. */
export function isRref(m: Matrix): boolean {
	let prevPivotCol = -1;
	let seenZeroRow = false;
	for (const row of m) {
		const pivotCol = row.findIndex((v) => !v.equals(0));
		if (pivotCol === -1) {
			seenZeroRow = true;
			continue;
		}
		if (seenZeroRow) return false; // nonzero row below a zero row
		if (pivotCol <= prevPivotCol) return false;
		if (!row[pivotCol].equals(1)) return false;
		for (const otherRow of m) {
			if (otherRow !== row && !otherRow[pivotCol].equals(0)) return false;
		}
		prevPivotCol = pivotCol;
	}
	return true;
}

/** cellKeys of each row's leading nonzero entry. Only meaningful as "the
 *  pivots" once isRref(m) is true. */
export function pivotCellKeys(m: Matrix): Set<string> {
	const keys = new Set<string>();
	m.forEach((row, i) => {
		const j = row.findIndex((v) => !v.equals(0));
		if (j !== -1) keys.add(cellKey(i, j));
	});
	return keys;
}

export function parseRational(text: string): Fraction | null {
	try {
		return new Fraction(text.trim());
	} catch {
		return null;
	}
}

/** Inclusive random integer in [min, max]. */
export function randomInt(min: number, max: number, rng: () => number = Math.random): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

function randomNonZeroInt(maxAbsValue: number, rng: () => number = Math.random): number {
	const magnitude = randomInt(1, maxAbsValue, rng);
	return rng() < 0.5 ? -magnitude : magnitude;
}

/** Picks k distinct values from pool at random, sorted ascending. */
function sampleDistinctSorted(pool: number[], k: number, rng: () => number = Math.random): number[] {
	const arr = [...pool];
	for (let i = 0; i < k; i++) {
		const j = randomInt(i, arr.length - 1, rng);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr.slice(0, k).sort((a, b) => a - b);
}

/** Deterministic PRNG (mulberry32) — same seed always yields the same sequence. */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function columnKey(grid: number[][], col: number, rows: number): string {
	const parts: string[] = [];
	for (let i = 0; i < rows; i++) parts.push(String(grid[i][col]));
	return parts.join(',');
}

/**
 * Generates a random matrix already in reduced row echelon form (RREF).
 * Never produces an all-zero column. By default no two columns are identical
 * as vectors (best-effort: falls back to allowing a duplicate if the space of
 * distinct possible vectors is smaller than the number of columns needed).
 */
export function randomRrefMatrix(
	rows: number,
	cols: number,
	rank: number,
	maxAbsValue: number,
	allowRepeatedColumns = false,
	rng: () => number = Math.random
): Matrix {
	if (!Number.isInteger(rows) || rows < 1) throw new Error('rows must be a positive integer');
	if (!Number.isInteger(cols) || cols < 1) throw new Error('cols must be a positive integer');
	if (!Number.isInteger(rank) || rank < 1 || rank > Math.min(rows, cols)) {
		throw new Error('rank must be an integer between 1 and min(rows, cols)');
	}
	if (!Number.isInteger(maxAbsValue) || maxAbsValue < 0) {
		throw new Error('maxAbsValue must be a non-negative integer');
	}
	if (cols > rank && maxAbsValue < 1) {
		throw new Error('maxAbsValue must be at least 1 when the matrix has free columns');
	}
	if (cols > rank && !allowRepeatedColumns && maxAbsValue < 2) {
		throw new Error(
			'maxAbsValue must be at least 2 when the matrix has free columns and repeated columns are not allowed'
		);
	}

	// Column 0 must always be a pivot column: otherwise every column to its left
	// would be forced to zero in every row, producing a forbidden zero column.
	const remainingPool = Array.from({ length: cols - 1 }, (_, i) => i + 1);
	const pivotCols = [0, ...sampleDistinctSorted(remainingPool, rank - 1, rng)];
	const pivotColSet = new Set(pivotCols);

	const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
	for (let i = 0; i < rank; i++) grid[i][pivotCols[i]] = 1;

	const usedColumnKeys = new Set<string>();
	for (const p of pivotCols) usedColumnKeys.add(columnKey(grid, p, rows));

	const MAX_ATTEMPTS = 200;
	for (let j = 0; j < cols; j++) {
		if (pivotColSet.has(j)) continue;

		const candidateRows: number[] = [];
		for (let i = 0; i < rank; i++) if (pivotCols[i] < j) candidateRows.push(i);

		let attempt = 0;
		let key: string;
		do {
			for (const i of candidateRows) grid[i][j] = randomInt(-maxAbsValue, maxAbsValue, rng);
			if (candidateRows.every((i) => grid[i][j] === 0)) {
				const forced = candidateRows[randomInt(0, candidateRows.length - 1, rng)];
				grid[forced][j] = randomNonZeroInt(maxAbsValue, rng);
			}
			key = columnKey(grid, j, rows);
			attempt++;
		} while (!allowRepeatedColumns && usedColumnKeys.has(key) && attempt < MAX_ATTEMPTS);

		usedColumnKeys.add(key);
	}

	return grid.map((row) => row.map((v) => new Fraction(v)));
}

// Row operations
export function swapRows(m: Matrix, r1: number, r2: number): Matrix {
	const result = cloneMatrix(m);
	[result[r1], result[r2]] = [result[r2], result[r1]];
	return result;
}

export function scaleRow(m: Matrix, r: number, scalar: Fraction): Matrix {
	const result = cloneMatrix(m);
	result[r] = result[r].map((v) => v.mul(scalar));
	return result;
}

export function addScaledRow(m: Matrix, target: number, source: number, scalar: Fraction): Matrix {
	const result = cloneMatrix(m);
	result[target] = result[target].map((v, j) => v.add(scalar.mul(m[source][j])));
	return result;
}

function randomDistinctPair(n: number, rng: () => number = Math.random): [number, number] {
	const a = randomInt(0, n - 1, rng);
	let b = randomInt(0, n - 1, rng);
	while (b === a) b = randomInt(0, n - 1, rng);
	return [a, b];
}

export function matricesEqual(a: Matrix, b: Matrix): boolean {
	return a.length === b.length && a.every((row, i) => row.every((v, j) => v.equals(b[i][j])));
}

function withinAbsBound(m: Matrix, bound: number): boolean {
	return m.every((row) => row.every((v) => v.abs().valueOf() <= bound));
}

const ROW_OP_MAX_CELL_ABS_VALUE = 15;

/**
 * Applies one random elementary row operation (swap / scale / add-scaled-row) to m.
 * Retries with a freshly chosen operation until a row actually changes and no cell
 * exceeds ROW_OP_MAX_CELL_ABS_VALUE in absolute value (best effort, capped, in case
 * no candidate op satisfies both, e.g. an all-zero matrix or an already-oversized cell).
 */
export function randomRowOperation(
	m: Matrix,
	maxAbsScalar: number,
	rng: () => number = Math.random
): Matrix {
	const rows = m.length;
	const kinds: Array<'swap' | 'scale' | 'addScaled'> = ['scale'];
	if (rows >= 2) kinds.push('swap', 'swap', 'addScaled', 'addScaled', 'addScaled', 'addScaled');

	const MAX_ATTEMPTS = 50;
	let result = m;
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const kind = kinds[randomInt(0, kinds.length - 1, rng)];
		switch (kind) {
			case 'swap': {
				const [r1, r2] = randomDistinctPair(rows, rng);
				result = swapRows(m, r1, r2);
				break;
			}
			case 'scale': {
				const r = randomInt(0, rows - 1, rng);
				result = scaleRow(m, r, new Fraction(randomNonZeroInt(maxAbsScalar, rng)));
				break;
			}
			case 'addScaled': {
				const [target, source] = randomDistinctPair(rows, rng);
				result = addScaledRow(m, target, source, new Fraction(randomNonZeroInt(maxAbsScalar, rng)));
				break;
			}
		}
		if (!matricesEqual(result, m) && withinAbsBound(result, ROW_OP_MAX_CELL_ABS_VALUE)) return result;
	}
	return result;
}

// Column operations
export function swapCols(m: Matrix, c1: number, c2: number): Matrix {
	const result = cloneMatrix(m);
	for (let i = 0; i < m.length; i++) {
		[result[i][c1], result[i][c2]] = [result[i][c2], result[i][c1]];
	}
	return result;
}

export function scaleCol(m: Matrix, c: number, scalar: Fraction): Matrix {
	const result = cloneMatrix(m);
	for (let i = 0; i < m.length; i++) {
		result[i][c] = result[i][c].mul(scalar);
	}
	return result;
}

export function addScaledCol(m: Matrix, target: number, source: number, scalar: Fraction): Matrix {
	const result = cloneMatrix(m);
	for (let i = 0; i < m.length; i++) {
		result[i][target] = m[i][target].add(scalar.mul(m[i][source]));
	}
	return result;
}

export function describeSwapRows(r1: number, r2: number): string {
	return `R_{${r1 + 1}} \\leftrightarrow R_{${r2 + 1}}`;
}

export function describeScaleRow(r: number, scalar: Fraction): string {
	return `${scalar.toLatex()} R_{${r + 1}} \\rightarrow R_{${r + 1}}`;
}

export function describeAddScaledRow(target: number, source: number, scalar: Fraction): string {
	const sign = scalar.compare(0) < 0 ? `- ${scalar.abs().toLatex()}` : `+ ${scalar.toLatex()}`;
	return `R_{${target + 1}} ${sign} R_{${source + 1}} \\rightarrow R_{${target + 1}}`;
}

const SKILL_TEST_RANDOM_MATRIX_MAX_ABS_VALUE = 9; // matches RANDOM_MATRIX_MAX_ABS_VALUE in NewMatrixModal.svelte
const SKILL_TEST_ROW_OP_MAX_ABS_SCALAR = 3; // matches ROW_OP_MAX_ABS_SCALAR in NewMatrixModal.svelte
const SKILL_TEST_MAX_OPS = 20;

function hasZeroCell(m: Matrix): boolean {
	return m.some((row) => row.some((v) => v.equals(0)));
}

/**
 * Generates a random 4x6 or 5x5 matrix for the RREF skill test: starts from a
 * random RREF matrix of rank 3 or 4, then scrambles it with random row
 * operations (same restrictions as the main page) until every cell is
 * nonzero. Retries from a fresh RREF matrix if more than 20 operations are
 * needed.
 */
export function generateSkillTestMatrix(): Matrix {
	while (true) {
		const [rows, cols] = Math.random() < 0.5 ? [4, 6] : [5, 5];
		const rank = Math.random() < 0.5 ? 3 : 4;
		let matrix = randomRrefMatrix(rows, cols, rank, SKILL_TEST_RANDOM_MATRIX_MAX_ABS_VALUE);

		let ops = 0;
		while (hasZeroCell(matrix) && ops < SKILL_TEST_MAX_OPS) {
			matrix = randomRowOperation(matrix, SKILL_TEST_ROW_OP_MAX_ABS_SCALAR);
			ops++;
		}
		if (!hasZeroCell(matrix)) return matrix;
	}
}

// Sept 1, 2026
const RREFLE_EPOCH = { year: 2026, month: 8, date: 2 };

/** Days past the rrefle epoch, using the UTC calendar date. UTC (not local
 *  time) keeps this consistent between SSR and client hydration regardless
 *  of the server's or visitor's timezone. */
export function rrefleId(now: Date = new Date()): number {
	const epochUTC = Date.UTC(RREFLE_EPOCH.year, RREFLE_EPOCH.month, RREFLE_EPOCH.date);
	const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return Math.round((todayUTC - epochUTC) / 86_400_000);
}

const RREFLE_ROWS = 6;
const RREFLE_COLS = 5;
const RREFLE_RANK = 3;
const RREFLE_RANDOM_MATRIX_MAX_ABS_VALUE = 9; // matches SKILL_TEST_RANDOM_MATRIX_MAX_ABS_VALUE
const RREFLE_ROW_OP_MAX_ABS_SCALAR = 3; // matches SKILL_TEST_ROW_OP_MAX_ABS_SCALAR
const RREFLE_ROW_OPS = 20;

/** Deterministic 6x5, rank-3 RREF matrix scrambled by exactly 10 row ops, seeded by id. */
export function generateRrefleMatrix(id: number): Matrix {
	const rng = mulberry32(id);
	let matrix = randomRrefMatrix(
		RREFLE_ROWS,
		RREFLE_COLS,
		RREFLE_RANK,
		RREFLE_RANDOM_MATRIX_MAX_ABS_VALUE,
		false,
		rng
	);
	for (let i = 0; i < RREFLE_ROW_OPS; i++) {
		matrix = randomRowOperation(matrix, RREFLE_ROW_OP_MAX_ABS_SCALAR, rng);
	}
	return matrix;
}

/** Wordle-style result grid: one line per pivot row, 🟩 pivot / ⬜ zero / 🟨 other.
 *  Only meaningful once isRref(matrix) is true. */
export function rrefleEmojiGrid(matrix: Matrix): string {
	const pivots = pivotCellKeys(matrix);
	const lines: string[] = [];
	matrix.forEach((row, i) => {
		if (!row.some((_, j) => pivots.has(cellKey(i, j)))) return;
		lines.push(
			row.map((v, j) => (pivots.has(cellKey(i, j)) ? '🟩' : v.equals(0) ? '⬜' : '🟨')).join('')
		);
	});
	return lines.join('\n');
}

/** Shareable Wordle-style summary of a completed rrefle. */
export function rrefleShareText(id: number, matrix: Matrix): string {
	return `RREF-le #${id}\n\n${rrefleEmojiGrid(matrix)}`;
}

export function describeSwapCols(c1: number, c2: number): string {
	return `C_{${c1 + 1}} \\leftrightarrow C_{${c2 + 1}}`;
}

export function describeScaleCol(c: number, scalar: Fraction): string {
	return `${scalar.toLatex()} C_{${c + 1}} \\rightarrow C_{${c + 1}}`;
}

export function describeAddScaledCol(target: number, source: number, scalar: Fraction): string {
	const sign = scalar.compare(0) < 0 ? `- ${scalar.abs().toLatex()}` : `+ ${scalar.toLatex()}`;
	return `C_{${target + 1}} ${sign} C_{${source + 1}} \\rightarrow C_{${target + 1}}`;
}
