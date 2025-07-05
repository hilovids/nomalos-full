import { Board, createBoard, applyMove } from "./board";
import { Space } from "./space";

export type GameState = {
    board: Board;
    moveList: number[];
    currentPlayer: Space.Black | Space.White;
    isOver: boolean;
    winner: Space.Black | Space.White | null;
};

export function createGameState(size: number = 11): GameState {
    return {
        board: createBoard(size),
        moveList: [],
        currentPlayer: Space.Black,
        isOver: false,
        winner: null,
    };
}

export function makeMove(state: GameState, row: number, col: number): GameState | false {
    if (state.isOver) return false;

    const moveIndex = row * state.board.size + col;
    const newBoard = applyMove(state.board, row, col, state.currentPlayer);
    if (!newBoard) return false;

    const newMoveList = [...state.moveList, moveIndex];

    const isFull = newBoard.spaces.every(
        (space) => space !== Space.Empty
    );

    let blackCount = 0, whiteCount = 0;
    for (const space of newBoard.spaces) {
        if (space === Space.Black) blackCount++;
        if (space === Space.White) whiteCount++;
    }

    let winner: Space.Black | Space.White | null = null;
    let isOver = false;
    if (isFull) {
        isOver = true;
        if (blackCount > whiteCount) winner = Space.Black;
        else if (whiteCount > blackCount) winner = Space.White;
        else winner = null;
    }

    return {
        board: newBoard,
        moveList: newMoveList,
        currentPlayer: state.currentPlayer === Space.Black ? Space.White : Space.Black,
        isOver,
        winner,
    };
}