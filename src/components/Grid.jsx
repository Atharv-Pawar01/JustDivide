import React, { } from 'react';
import Tile from './Tile';

export default function Grid({ grid, hintMoves = [] }) {
    const isHint = (r, c) => {
        return hintMoves.some(m => m.r === r && m.c === c);
    };

    return (
        <div className="grid-container" id="game-grid">
            {grid.map((row, rIndex) => (
                <React.Fragment key={rIndex}>
                    {row.map((cellValue, cIndex) => {
                        const highlighted = isHint(rIndex, cIndex);
                        return (
                            <div
                                key={`${rIndex}-${cIndex}`}
                                className={`grid-slot ${highlighted ? 'hint-highlight' : ''}`}
                                data-row={rIndex}
                                data-col={cIndex}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: 'url(/assets/Placement_Box.png)',
                                    backgroundSize: 'contain',
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {cellValue !== null && (
                                    <Tile value={cellValue} size="95%" />
                                )}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
}
