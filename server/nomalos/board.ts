import { Space } from "./space";

export type Board = {
    spaces: Space[];
    size: number;
};

export function createBoard(size: number): Board {
    return {
        spaces: Array(size * size).fill(Space.Empty),
        size,
    };
}

export function toIndex(row: number, col: number, size: number): number {
    return row * size + col;
}

export function fromIndex(index: number, size: number): [number, number] {
    const row = Math.floor(index / size);
    const col = index % size;
    return [row, col];
}

function getConnectedGroup(board: Board, row: number, col: number, visited: Set<number> = new Set()): number[] {
    const { size, spaces } = board;
    const index = toIndex(row, col, size);
    const color = spaces[index];
    if (color !== Space.Black && color !== Space.White) return [];

    const stack = [[row, col]];
    const group: number[] = [];
    while (stack.length) {
        const [r, c] = stack.pop()!;
        const idx = toIndex(r, c, size);
        if (visited.has(idx) || spaces[idx] !== color) continue;
        visited.add(idx);
        group.push(idx);
        for (const [dr, dc] of [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                const nidx = toIndex(nr, nc, size);
                if (!visited.has(nidx) && spaces[nidx] === color) {
                    stack.push([nr, nc]);
                }
            }
        }
    }
    return group;
}

function parityRemoval(board: Board, row: number, col: number): Board {
    const { size, spaces } = board;
    const index = toIndex(row, col, size);
    const color = spaces[index];
    if (color !== Space.Black && color !== Space.White) return board;

    const group = getConnectedGroup(board, row, col);
    if (group.length > 1 && group.length % 2 === 0) {
        const newSpaces = [...spaces];
        for (const idx of group) {
            newSpaces[idx] = Space.Removed;
        }
        return { spaces: newSpaces, size };
    }
    return board;
}

export function applyMove(board: Board, row: number, col: number, player: Space.Black | Space.White): Board | false {
    if (player !== Space.Black && player !== Space.White) {
        return false;
    }
    
    if (row < 0 || col < 0 || row >= board.size || col >= board.size) {
        return false;
    }

    const index = toIndex(row, col, board.size);
    if (board.spaces[index] !== Space.Empty) {
        return false;
    }

    const newSpaces = [...board.spaces];
    newSpaces[index] = player;

    let newBoard = { spaces: newSpaces, size: board.size };
    newBoard = parityRemoval(newBoard, row, col);

    return newBoard;
}