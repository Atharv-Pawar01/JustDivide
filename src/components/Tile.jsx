import React from 'react';

/**
 * Tile Component
 * Renders a single number tile.
 */
export default function Tile({ value, size, x, y, isInteractive = false, onDragStart, className = '' }) {

    // Determine color based on value range
    const getColor = (v) => {
        if (v <= 3) return 'blue';
        if (v <= 6) return 'pink';
        if (v <= 10) return 'orange';
        if (v <= 20) return 'purple';
        return 'red';
    };

    const color = getColor(value);

    // Map colors to asset filenames
    const assetMap = {
        blue: 'blue.png',
        pink: 'pink.png',
        orange: 'orange.png',
        purple: 'purpule.png', // Note: typo in asset name preserved
        red: 'red.png'
    };

    const styles = {
        width: size,
        height: size,
        // If x,y provided, absolute positioning (for drag ghost), else relative
        position: x !== undefined ? 'absolute' : 'relative',
        left: x,
        top: y,
        backgroundImage: `url(/assets/${assetMap[color]})`,
        backgroundSize: 'contain',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"Fredoka One", cursive',
        fontSize: size * 0.5,
        color: 'white',
        userSelect: 'none',
        cursor: isInteractive ? 'grab' : 'default',
        zIndex: isInteractive ? 10 : 1,
    };

    const handlePointerDown = (e) => {
        if (isInteractive && onDragStart) {
            onDragStart(e, value);
        }
    };

    return (
        <div
            className={`tile ${className}`}
            style={styles}
            onPointerDown={handlePointerDown}
        >
            {value}
        </div>
    );
}
