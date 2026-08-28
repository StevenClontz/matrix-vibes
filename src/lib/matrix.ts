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

export function parseRational(text: string): Fraction | null {
	try {
		return new Fraction(text.trim());
	} catch {
		return null;
	}
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
