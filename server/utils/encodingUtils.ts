/**
 * Applies all 8 dihedral symmetries to a move list and returns the lexicographically smallest (canonical) form.
 */
export function canonicalizeMoveList(moveList: number[], size: number): number[] {
    const toRC = (idx: number): [number, number] => [Math.floor(idx / size), idx % size];
    const toIdx = (r: number, c: number): number => r * size + c;

    const syms: Array<(pos: [number, number]) => [number, number]> = [
        ([r, c]: [number, number]) => [r, c],
        ([r, c]: [number, number]) => [c, size - 1 - r],
        ([r, c]: [number, number]) => [size - 1 - r, size - 1 - c],
        ([r, c]: [number, number]) => [size - 1 - c, r],
        ([r, c]: [number, number]) => [c, r],
        ([r, c]: [number, number]) => [size - 1 - c, size - 1 - r],
        ([r, c]: [number, number]) => [r, size - 1 - c],
        ([r, c]: [number, number]) => [size - 1 - r, c],
    ];

    const variants = syms.map(sym =>
        moveList.map((idx: number) => {
            const [r, c] = toRC(idx);
            const [r2, c2] = sym([r, c]);
            return toIdx(r2, c2);
        })
    );

    const canonical = variants.reduce((min, curr) => {
        for (let i = 0; i < curr.length; i++) {
            if (curr[i] < min[i]) return curr;
            if (curr[i] > min[i]) break;
        }
        return min;
    }, variants[0]);

    return canonical;
}

/**
 * Lehmer encode a permutation (partial or full) of [0..N-1] as a BigInt.
 */
export function lehmerEncode(perm: number[], size: number): bigint {
    let code = BigInt(0);
    let N = size * size;
    const used: boolean[] = Array(N).fill(false);
    let factorial: bigint[] = [BigInt(1)];
    for (let i = 1; i <= N; i++) factorial[i] = factorial[i - 1] * BigInt(i);

    for (let i = 0; i < perm.length; i++) {
        let count = 0;
        for (let j = 0; j < perm[i]; j++) {
            if (!used[j]) count++;
        }
        code = code * BigInt(N - i) + BigInt(count);
        used[perm[i]] = true;
    }
    return code;
}

export function lehmerDecode(code: bigint | string, size: number): number[] {
    let lehmer: number[] = [];
    let c: bigint = typeof code === "string" ? BigInt(code) : code;
    let N = size * size;
    // Extract Lehmer digits (in reverse order)
    for (let i = size - 1; i >= 0; i--) {
        const base = BigInt(N - i);
        lehmer[i] = Number(c % base);
        c = c / base;
    }

    // Convert Lehmer code to permutation
    const perm: number[] = [];
    const available: number[] = Array.from({ length: N }, (_, i) => i);
    for (let i = 0; i < length; i++) {
        perm.push(available[lehmer[i]]);
        available.splice(lehmer[i], 1);
    }
    return perm;
}

/**
 * Compress a game's move list to canonical form and Lehmer encode it.
 */
export function compressMoveList(moveList: number[], size: number): bigint {
    const canonical = canonicalizeMoveList(moveList, size);
    return lehmerEncode(canonical, size);
}