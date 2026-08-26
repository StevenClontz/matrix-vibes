export type Matrix = number[][];

export function createMatrix(rows: number, cols: number): Matrix {
	return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function identityMatrix(n: number): Matrix {
	return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

export function cloneMatrix(m: Matrix): Matrix {
	return m.map((row) => [...row]);
}

// Row operations
export function swapRows(m: Matrix, r1: number, r2: number): Matrix {
	const result = cloneMatrix(m);
	[result[r1], result[r2]] = [result[r2], result[r1]];
	return result;
}

export function scaleRow(m: Matrix, r: number, scalar: number): Matrix {
	const result = cloneMatrix(m);
	result[r] = result[r].map((v) => v * scalar);
	return result;
}

export function addScaledRow(m: Matrix, target: number, source: number, scalar: number): Matrix {
	const result = cloneMatrix(m);
	result[target] = result[target].map((v, j) => v + scalar * m[source][j]);
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

export function scaleCol(m: Matrix, c: number, scalar: number): Matrix {
	const result = cloneMatrix(m);
	for (let i = 0; i < m.length; i++) {
		result[i][c] = result[i][c] * scalar;
	}
	return result;
}

export function addScaledCol(m: Matrix, target: number, source: number, scalar: number): Matrix {
	const result = cloneMatrix(m);
	for (let i = 0; i < m.length; i++) {
		result[i][target] = m[i][target] + scalar * m[i][source];
	}
	return result;
}

export function formatNum(v: number): string {
	if (Number.isInteger(v)) return String(v);
	// Show as fraction if close to one
	const denom = [2, 3, 4, 5, 6, 8, 10, 12];
	for (const d of denom) {
		const n = Math.round(v * d);
		if (Math.abs(n / d - v) < 1e-9) return n === d ? '1' : n === -d ? '-1' : `${n}/${d}`;
	}
	return v.toFixed(3).replace(/\.?0+$/, '');
}

export function formatNumLatex(v: number): string {
	if (Number.isInteger(v)) return String(v);
	const denom = [2, 3, 4, 5, 6, 8, 10, 12];
	for (const d of denom) {
		const n = Math.round(v * d);
		if (Math.abs(n / d - v) < 1e-9) {
			if (n === d) return '1';
			if (n === -d) return '-1';
			return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
		}
	}
	return v.toFixed(3).replace(/\.?0+$/, '');
}

export function describeSwapRows(r1: number, r2: number): string {
	return `R_{${r1 + 1}} \\leftrightarrow R_{${r2 + 1}}`;
}

export function describeScaleRow(r: number, scalar: number): string {
	return `R_{${r + 1}} \\rightarrow ${formatNumLatex(scalar)} R_{${r + 1}}`;
}

export function describeAddScaledRow(target: number, source: number, scalar: number): string {
	const s = formatNumLatex(scalar);
	const sign = scalar >= 0 ? `+ ${s}` : `- ${formatNumLatex(Math.abs(scalar))}`;
	return `R_{${target + 1}} \\rightarrow R_{${target + 1}} ${sign} R_{${source + 1}}`;
}

export function describeSwapCols(c1: number, c2: number): string {
	return `C_{${c1 + 1}} \\leftrightarrow C_{${c2 + 1}}`;
}

export function describeScaleCol(c: number, scalar: number): string {
	return `C_{${c + 1}} \\rightarrow ${formatNumLatex(scalar)} \\cdot C_{${c + 1}}`;
}

export function describeAddScaledCol(target: number, source: number, scalar: number): string {
	const s = formatNumLatex(scalar);
	const sign = scalar >= 0 ? `+ ${s}` : `- ${formatNumLatex(Math.abs(scalar))}`;
	return `C_{${target + 1}} \\rightarrow C_{${target + 1}} ${sign} \\cdot C_{${source + 1}}`;
}
