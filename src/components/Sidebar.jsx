import React from 'react';
import Tile from './Tile';

export default function Sidebar({ queue, keepVal, trashUses, onDragStart, score, best, level }) {

    const renderQueueRow = () => {
        const visibleQueue = queue.slice(0, 2);

        return (
            <div className="queue-row" style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '10px',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '15px',
                border: '3px solid white',
                minHeight: '120px',
                minWidth: '220px'
            }}>
                {visibleQueue.length === 0 && <span style={{ opacity: 0.5 }}>Empty</span>}

                {visibleQueue.map((val, idx) => {
                    const isCurrent = idx === 0;

                    return (
                        <div key={`q-${idx}`} style={{
                            position: 'relative',
                            opacity: isCurrent ? 1 : 0.8,
                            transform: isCurrent ? 'scale(1.05)' : 'scale(0.95)'
                        }}>
                            <Tile
                                value={val}
                                size={90}
                                isInteractive={isCurrent}
                                onDragStart={isCurrent ? (e) => onDragStart(e, val, 'queue') : undefined}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

            <div className="panel-section">
                <div className="slot-container" id="slot-keep">
                    <div className="slot-bg"></div>
                    {keepVal !== null && (
                        <Tile
                            value={keepVal}
                            size={100}
                            isInteractive={true}
                            onDragStart={(e) => onDragStart(e, keepVal, 'keep')}
                        />
                    )}
                </div>
                <h3 className="panel-label">KEEP</h3>
            </div>

            <div className="panel-section">
                {renderQueueRow()}
            </div>

            <div className="panel-section">
                <div className="slot-container" id="slot-trash">
                    <div className="slot-bg trash-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: '40px' }}>🗑️</span>
                    </div>
                </div>
                <h3 className="panel-label">TRASH</h3>

                <div className="trash-counter">
                    <div className="trash-icon-mini">🗑️</div>
                    <span>x{trashUses}</span>
                </div>
            </div>
        </div>
    );
}
