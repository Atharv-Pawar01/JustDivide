# JustDivide

A strategic math-based puzzle game where you divide tiles to solve rows and columns.

## Approach

The game is built using **React** with a focus on functional components and hooks. The core architecture revolves around a "dumb UI, smart logic" pattern:

-   **`useGameLogic.js`**: This custom hook acts as the central brain. It manages the entire game state (grid, queue, score, level, history) using a `useReducer` pattern. This ensures that state transitions are predictable and easy to manage (e.g., Undo functionality is just popping the history stack).
-   **`App.jsx`**: Acts as the main controller view. It consumes the `useGameLogic` hook and wires up the UI components (`Grid`, `Sidebar`) to the logic handlers. It also manages non-gameplay UI state like dragging and keyboard shortcuts.
-   **Grid & Sidebar**: Pure presentational components that render based on the props passed down to them.

## Decisions Made

1.  **Redux-style Reducer**: Instead of `useState` sprawl, I used `useReducer` for the game logic. This makes complex atomic updates (like merging tiles, updating score, and replenishing the queue simultaneously) much cleaner and less prone to race conditions.
2.  **Drag and Drop**: I implemented a custom pointer-based drag-and-drop system instead of using a library like `react-dnd`. This was done to have full control over the "ghost" tile appearance and hit detection logic specifically for the grid cells.
3.  **Local Storage**: High scores are persisted in `localStorage` so correct validation of "best score" is maintained across reloads without needing a backend.

## Challenges

-   **Merge Logic**: The "divide" mechanic (if $A \% B === 0$) required careful logic to determine where the result should go (it moves to the position of the larger number). Handling the edge cases where numbers are equal vs divisible was a key logic step.
-   **Hint System**: Implementing a hint system that scans the grid for *potential* moves without affecting performance was interesting. I solved it by running a simulation check against the current queue item whenever the `showHints` flag is toggled or state changes.
-   **Mobile Support**: Ensuring drag start/end events worked seamlessly on both mouse and touch screens required unifying the event handling logic in `App.jsx`.

## Improvements

-   **Animations**: The game is currently snappy but static. Adding `framer-motion` for tile merges, queue sliding, and score popups would greatly enhance the "juice" of the game.
-   **Audio**: Simple sound effects for placing tiles, merging, and game over would improve feedback.
-   **Responsive Layout**: While playable on mobile, the layout could be optimized further for vertical portrait screens.
