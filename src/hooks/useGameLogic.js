import { useReducer, useEffect, useCallback } from 'react';

const GRID_ROWS = 4;
const GRID_COLS = 4;
const GAME_STATE_KEY = 'jd_game_state';
const BEST_SCORE_KEY = 'jd_best_score';

const initialState = {
    grid: Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null)),
    queue: [],
    keepVal: null,
    score: 0,
    level: 1,
    trashUses: 3,
    bestScore: parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0'),
    gameOver: false,
    time: 0,
    isPaused: false,
    history: [],
    showHints: false,
    validHintMoves: [],
};

const ACTIONS = {
    INIT: 'INIT',
    DROP_GRID: 'DROP_GRID',
    SWAP_KEEP: 'SWAP_KEEP',
    USE_TRASH: 'USE_TRASH',
    RESTART: 'RESTART',
    TICK: 'TICK',
    TOGGLE_PAUSE: 'TOGGLE_PAUSE',
    UNDO: 'UNDO',
    TOGGLE_HINT: 'TOGGLE_HINT',
    SET_HINTS: 'SET_HINTS',
};

function gameReducer(state, action) {
    switch (action.type) {
        case ACTIONS.INIT:
            return { ...state, queue: action.payload };

        case ACTIONS.RESTART:
            return {
                ...initialState,
                bestScore: state.bestScore,
                queue: action.payload,
                history: [],
            };

        case ACTIONS.TICK:
            if (state.isPaused || state.gameOver) return state;
            return { ...state, time: state.time + 1 };

        case ACTIONS.TOGGLE_PAUSE:
            return { ...state, isPaused: !state.isPaused };

        case ACTIONS.TOGGLE_HINT:
            return { ...state, showHints: !state.showHints };

        case ACTIONS.SET_HINTS:
            return { ...state, validHintMoves: action.payload };

        case ACTIONS.UNDO: {
            if (state.history.length === 0) return state;
            const previous = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);
            return {
                ...previous,
                history: newHistory,
            };
        }

        case ACTIONS.DROP_GRID: {
            const { row, col, value, fromKeep } = action.payload;

            const historyState = {
                ...state,
                history: [],
                grid: state.grid.map(r => [...r]),
                queue: [...state.queue]
            };
            historyState.grid = state.grid.map(r => [...r]);
            historyState.queue = [...state.queue];

            const newGrid = state.grid.map(r => [...r]);

            if (newGrid[row][col] !== null) return state;

            newGrid[row][col] = value;
            let newScore = state.score;

            const neighbors = [
                { r: row - 1, c: col },
                { r: row, c: col + 1 },
                { r: row + 1, c: col },
                { r: row, c: col - 1 }
            ];

            for (const n of neighbors) {
                if (n.r >= 0 && n.r < GRID_ROWS && n.c >= 0 && n.c < GRID_COLS) {
                    const neighborVal = newGrid[n.r][n.c];
                    const currentVal = newGrid[row][col];

                    if (neighborVal !== null && currentVal !== null) {
                        if (currentVal === neighborVal) {
                            newGrid[row][col] = null;
                            newGrid[n.r][n.c] = null;
                            newScore += currentVal * 2;
                            break;
                        }
                        else if (currentVal % neighborVal === 0 || neighborVal % currentVal === 0) {
                            const big = Math.max(currentVal, neighborVal);
                            const small = Math.min(currentVal, neighborVal);
                            const result = big / small;
                            const finalVal = result === 1 ? null : result;

                            if (currentVal === big) {
                                newGrid[row][col] = finalVal;
                                newGrid[n.r][n.c] = null;
                            } else {
                                newGrid[n.r][n.c] = finalVal;
                                newGrid[row][col] = null;
                            }

                            newScore += big;
                            break;
                        }
                    }
                }
            }

            let newQueue = [...state.queue];
            let newKeep = state.keepVal;
            let newTrash = state.trashUses;

            if (fromKeep) {
                newKeep = null;
            } else {
                newQueue.shift();
                while (newQueue.length < 3) {
                    newQueue.push(Math.floor(Math.random() * 19) + 2);
                }
            }

            let newLevel = state.level;
            if (Math.floor(newScore / 10) + 1 > newLevel) {
                newLevel = Math.floor(newScore / 10) + 1;
                newTrash += 1;
            }

            let newBest = state.bestScore;
            if (newScore > newBest) {
                newBest = newScore;
                localStorage.setItem(BEST_SCORE_KEY, newBest);
            }

            let gridFull = true;
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (newGrid[r][c] === null) {
                        gridFull = false;
                        break;
                    }
                }
            }

            return {
                ...state,
                grid: newGrid,
                score: newScore,
                level: newLevel,
                trashUses: newTrash,
                bestScore: newBest,
                queue: newQueue,
                keepVal: newKeep,
                gameOver: gridFull,
                history: [...state.history, historyState],
                validHintMoves: [],
            };
        }

        case ACTIONS.SWAP_KEEP: {
            const { value, fromKeep } = action.payload;
            if (fromKeep) return state;

            const historyState = { ...state, history: [], grid: state.grid.map(r => [...r]), queue: [...state.queue] };

            let newKeep = state.keepVal;
            let newQueue = [...state.queue];

            if (newKeep === null) {
                newKeep = value;
                newQueue.shift();
                while (newQueue.length < 3) {
                    newQueue.push(Math.floor(Math.random() * 19) + 2);
                }
            } else {
                const temp = newKeep;
                newKeep = value;
                newQueue[0] = temp;
            }

            return {
                ...state,
                keepVal: newKeep,
                queue: newQueue,
                history: [...state.history, historyState],
                validHintMoves: []
            };
        }

        case ACTIONS.USE_TRASH: {
            const { value, fromKeep } = action.payload;
            if (state.trashUses <= 0) return state;

            const historyState = { ...state, history: [], grid: state.grid.map(r => [...r]), queue: [...state.queue] };

            let newTrash = state.trashUses - 1;
            let newKeep = state.keepVal;
            let newQueue = [...state.queue];

            if (fromKeep) {
                newKeep = null;
            } else {
                newQueue.shift();
                while (newQueue.length < 3) {
                    newQueue.push(Math.floor(Math.random() * 19) + 2);
                }
            }

            return {
                ...state,
                trashUses: newTrash,
                keepVal: newKeep,
                queue: newQueue,
                history: [...state.history, historyState],
                validHintMoves: []
            };
        }

        default:
            return state;
    }
}

function canMerge(a, b) {
    if (a === b) return true;
    if (a % b === 0 || b % a === 0) return true;
    return false;
}

export function useGameLogic() {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        if (state.queue.length === 0) {
            const initialQ = [];
            for (let i = 0; i < 3; i++) initialQ.push(Math.floor(Math.random() * 19) + 2);
            dispatch({ type: ACTIONS.INIT, payload: initialQ });
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            dispatch({ type: ACTIONS.TICK });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDropGrid = (row, col, value, fromKeep) => {
        const target = state.grid[row][col];
        if (target !== null) {
            return false;
        }
        dispatch({ type: ACTIONS.DROP_GRID, payload: { row, col, value, fromKeep } });
        return true;
    };

    const handleKeep = (value, fromKeep) => {
        dispatch({ type: ACTIONS.SWAP_KEEP, payload: { value, fromKeep } });
    };

    const handleTrash = (value, fromKeep) => {
        dispatch({ type: ACTIONS.USE_TRASH, payload: { value, fromKeep } });
    };

    const restartGame = () => {
        const newQ = [];
        for (let i = 0; i < 3; i++) newQ.push(Math.floor(Math.random() * 19) + 2);
        dispatch({ type: ACTIONS.RESTART, payload: newQ });
    };

    const togglePause = () => dispatch({ type: ACTIONS.TOGGLE_PAUSE });

    const handleUndo = () => dispatch({ type: ACTIONS.UNDO });

    const toggleHint = () => dispatch({ type: ACTIONS.TOGGLE_HINT });

    const calculateHints = useCallback((activeValue) => {
        if (!state.showHints || !activeValue) {
            dispatch({ type: ACTIONS.SET_HINTS, payload: [] });
            return;
        }

        const moves = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (state.grid[r][c] === null) {
                    let causesMerge = false;
                    const neighbors = [
                        { r: r - 1, c: c },
                        { r: r, c: c + 1 },
                        { r: r + 1, c: c },
                        { r: r, c: c - 1 }
                    ];

                    for (const n of neighbors) {
                        if (n.r >= 0 && n.r < GRID_ROWS && n.c >= 0 && n.c < GRID_COLS) {
                            const neighborVal = state.grid[n.r][n.c];
                            if (neighborVal !== null && canMerge(activeValue, neighborVal)) {
                                causesMerge = true;
                                break;
                            }
                        }
                    }
                    if (causesMerge) moves.push({ r, c });
                }
            }
        }
        dispatch({ type: ACTIONS.SET_HINTS, payload: moves });
    }, [state.grid, state.showHints]);

    useEffect(() => {
        if (state.showHints && state.queue.length > 0) {
            calculateHints(state.queue[0]);
        } else {
            if (state.validHintMoves.length > 0) {
                dispatch({ type: ACTIONS.SET_HINTS, payload: [] });
            }
        }
    }, [state.grid, state.queue, state.showHints, calculateHints]);


    return {
        ...state,
        handleDropGrid,
        handleKeep,
        handleTrash,
        restartGame,
        togglePause,
        handleUndo,
        toggleHint,
        calculateHints
    };
}
