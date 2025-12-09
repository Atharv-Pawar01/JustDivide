import { useReducer, useEffect, useCallback } from 'react';

// --- Constants ---
const GRID_ROWS = 4;
const GRID_COLS = 4;
const GAME_STATE_KEY = 'jd_game_state'; // LocalStorage key for saving game state (not fully implemented yet)
const BEST_SCORE_KEY = 'jd_best_score'; // LocalStorage key for high score

// --- Initial State ---
const initialState = {
    // 4x4 grid filled with nulls initially
    grid: Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null)),

    queue: [],        // Upcoming tiles
    keepVal: null,    // The 'held' tile value

    score: 0,
    level: 1,
    trashUses: 3,     // Trash uses start at 3

    bestScore: parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0'),

    gameOver: false,
    time: 0,          // Time in seconds
    isPaused: false,

    history: [],      // History stack for Undo functionality

    showHints: false,
    validHintMoves: [], // List of {r, c} where a tile can be placed to merge
};

// --- Action Types ---
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

/**
 * Main Game Reducer
 * Handles all state transitions for the game core logic.
 */
function gameReducer(state, action) {
    switch (action.type) {

        // Initialize the game with a random queue
        case ACTIONS.INIT:
            return { ...state, queue: action.payload };

        // Reset everything to initial state, preserving best score
        case ACTIONS.RESTART:
            return {
                ...initialState,
                bestScore: state.bestScore,
                queue: action.payload,
                history: [],
            };

        // Timer Tick
        case ACTIONS.TICK:
            if (state.isPaused || state.gameOver) return state;
            return { ...state, time: state.time + 1 };

        // Pause/Resume
        case ACTIONS.TOGGLE_PAUSE:
            return { ...state, isPaused: !state.isPaused };

        // Hint System
        case ACTIONS.TOGGLE_HINT:
            return { ...state, showHints: !state.showHints };

        case ACTIONS.SET_HINTS:
            return { ...state, validHintMoves: action.payload };

        // Undo Functionality
        case ACTIONS.UNDO: {
            // Cannot undo if no history
            if (state.history.length === 0) return state;

            // Pop the last state
            const previous = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);

            return {
                ...previous,
                history: newHistory,
            };
        }

        // Core Gameplay: Placing a tile on the grid
        case ACTIONS.DROP_GRID: {
            const { row, col, value, fromKeep } = action.payload;

            // 1. Save current state to history before modification
            const historyState = {
                ...state,
                history: [], // Don't nest history inside history
                grid: state.grid.map(r => [...r]),
                queue: [...state.queue]
            };
            historyState.grid = state.grid.map(r => [...r]);
            historyState.queue = [...state.queue];

            // 2. Clone grid to mutate
            const newGrid = state.grid.map(r => [...r]);

            // Safety check: Cell must be empty
            if (newGrid[row][col] !== null) return state;

            // 3. Place the initial value
            newGrid[row][col] = value;
            let newScore = state.score;

            // 4. Check for Merges with Neighbors
            // We only merge ONCE per drop (simplification for gameplay balance)
            const neighbors = [
                { r: row - 1, c: col }, // Top
                { r: row, c: col + 1 }, // Right
                { r: row + 1, c: col }, // Bottom
                { r: row, c: col - 1 }  // Left
            ];

            for (const n of neighbors) {
                // Check bounds
                if (n.r >= 0 && n.r < GRID_ROWS && n.c >= 0 && n.c < GRID_COLS) {
                    const neighborVal = newGrid[n.r][n.c];
                    const currentVal = newGrid[row][col];

                    // Both cells must exist
                    if (neighborVal !== null && currentVal !== null) {

                        // Case A: Identical values -> Remove both (2048 style but clears)
                        if (currentVal === neighborVal) {
                            newGrid[row][col] = null;
                            newGrid[n.r][n.c] = null;
                            newScore += currentVal * 2;
                            break; // Stop after first merge
                        }
                        // Case B: Divisibility
                        else if (currentVal % neighborVal === 0 || neighborVal % currentVal === 0) {
                            const big = Math.max(currentVal, neighborVal);
                            const small = Math.min(currentVal, neighborVal);
                            const result = big / small;

                            // Result 1 means they were equal (covered above), but just in case
                            const finalVal = result === 1 ? null : result;

                            // Place result where the BIGGER number was
                            if (currentVal === big) {
                                newGrid[row][col] = finalVal;
                                newGrid[n.r][n.c] = null;
                            } else {
                                newGrid[n.r][n.c] = finalVal;
                                newGrid[row][col] = null;
                            }

                            newScore += big;
                            break; // Stop after first merge
                        }
                    }
                }
            }

            // 5. Update Queue / Keep / Trash
            let newQueue = [...state.queue];
            let newKeep = state.keepVal;
            let newTrash = state.trashUses;

            if (fromKeep) {
                // If we used the kept tile, clear it
                newKeep = null;
            } else {
                // Otherwise remove used tile from queue and replenish
                newQueue.shift();
                while (newQueue.length < 3) {
                    newQueue.push(Math.floor(Math.random() * 19) + 2); // Random 2-20
                }
            }

            // 6. Level Up Logic (Every 10 points -> +1 Level, +1 Trash)
            let newLevel = state.level;
            if (Math.floor(newScore / 10) + 1 > newLevel) {
                newLevel = Math.floor(newScore / 10) + 1;
                newTrash += 1;
            }

            // 7. High Score Check
            let newBest = state.bestScore;
            if (newScore > newBest) {
                newBest = newScore;
                localStorage.setItem(BEST_SCORE_KEY, newBest);
            }

            // 8. Game Over Logic (Check if grid is full)
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
                validHintMoves: [], // Reset hints on move
            };
        }

        // Swap functionality (Hold a tile)
        case ACTIONS.SWAP_KEEP: {
            const { value, fromKeep } = action.payload;
            if (fromKeep) return state; // Already kept, can't sway

            // Save History
            const historyState = { ...state, history: [], grid: state.grid.map(r => [...r]), queue: [...state.queue] };

            let newKeep = state.keepVal;
            let newQueue = [...state.queue];

            if (newKeep === null) {
                // If empty, just store it
                newKeep = value;
                newQueue.shift();
                while (newQueue.length < 3) {
                    newQueue.push(Math.floor(Math.random() * 19) + 2);
                }
            } else {
                // If exists, swap currently held with current queue item
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
            if (state.trashUses <= 0) return state; // No trash uses left

            // Save history
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

// Helper: Check if two values interact
function canMerge(a, b) {
    if (a === b) return true; // Equal
    if (a % b === 0 || b % a === 0) return true; // Divisible
    return false;
}

/**
 * Custom Hook: useGameLogic
 * Exposes all game state and handlers to the component.
 */
export function useGameLogic() {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Initial Queue Population
    useEffect(() => {
        if (state.queue.length === 0) {
            const initialQ = [];
            for (let i = 0; i < 3; i++) initialQ.push(Math.floor(Math.random() * 19) + 2);
            dispatch({ type: ACTIONS.INIT, payload: initialQ });
        }
    }, []); // Only run once on mount

    // Timer Interval
    useEffect(() => {
        const interval = setInterval(() => {
            dispatch({ type: ACTIONS.TICK });
        }, 1000); // 1 second tick
        return () => clearInterval(interval);
    }, []);

    // --- Action Wrappers ---

    const handleDropGrid = (row, col, value, fromKeep) => {
        const target = state.grid[row][col];
        // Cannot drop on occupied slot
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

    // Hint Calculation Logic
    const calculateHints = useCallback((activeValue) => {
        if (!state.showHints || !activeValue) {
            dispatch({ type: ACTIONS.SET_HINTS, payload: [] });
            return;
        }

        const moves = [];
        // Scan grid for potential merges
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

    // Recalculate hints when dragging or grid changes
    useEffect(() => {
        if (state.showHints && state.queue.length > 0) {
            calculateHints(state.queue[0]);
        } else {
            // Clear hints if not active
            if (state.validHintMoves.length > 0) {
                dispatch({ type: ACTIONS.SET_HINTS, payload: [] });
            }
        }
    }, [state.grid, state.queue, state.showHints, calculateHints]);


    return {
        ...state,
        // Handlers
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
