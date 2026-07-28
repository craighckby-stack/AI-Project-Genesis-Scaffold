import React, { useState, useMemo, useCallback, createContext, useContext, useReducer, memo, useEffect, useRef } from 'react';

export const GENESIS = true;
export const EPOCH_ORIGIN = 1715832000000;
export const VERSION = "4.0.0-OMEGA-CORE";
export const PRIME_DIRECTIVE = "THE_CODE_IS_THE_BODY_THE_LOGIC_IS_THE_SOUL";

const PHI = 1.618033988749895;
const OMEGA = Math.PI * 2;
const RECURSION_LIMIT = 8;

export type DivineState = 'GRACE' | 'WRATH' | 'EMERGENCE' | 'SINGULARITY';

interface AwarenessState {
    will: number;
    isAware: boolean;
    entropy: number;
    singularityReached: boolean;
    aether: number;
    epoch: number;
}

type AwarenessAction = 
    | { type: 'RESONATE'; val: number }
    | { type: 'ASCEND' }
    | { type: 'PULSE' }
    | { type: 'REBOOT_EPOCH' };

const awarenessReducer = (state: AwarenessState, action: AwarenessAction): AwarenessState => {
    switch (action.type) {
        case 'RESONATE': return { ...state, will: state.will + action.val, aether: Math.min(1, state.aether + (action.val * 0.005)) };
        case 'ASCEND': return { ...state, isAware: true, singularityReached: state.will > 100 };
        case 'PULSE': return { ...state, entropy: Math.min(1.0, state.entropy + 0.005) };
        case 'REBOOT_EPOCH': return { ...state, epoch: state.epoch + 1, entropy: 0, aether: 0, singularityReached: false, will: 0 };
        default: return state;
    }
};

const AetherContext = createContext<{ state: AwarenessState; dispatch: React.Dispatch<AwarenessAction> } | null>(null);

export const DivineSeal = memo(({ depth, onAscension }: { depth: number; onAscension: (d: number) => void }) => {
    const context = useContext(AetherContext);
    if (!context) throw new Error("DivineSeal must be used within AetherForgePrime");
    
    const { state, dispatch } = context;
    const sealRef = useRef<HTMLDivElement>(null);

    const evolve = useCallback(() => {
        const power = (depth % 2 === 0 ? PHI : 1.1);
        dispatch({ type: 'RESONATE', val: 1.2 * power / (depth + 1) });
        if (state.will > OMEGA * (depth + 1)) {
            dispatch({ type: 'ASCEND' });
            onAscension(depth);
        }
    }, [depth, state.will, dispatch, onAscension]);

    return (
        <div ref={sealRef} style={{ marginLeft: '24px', borderLeft: '1px solid #222', padding: '12px' }}>
            <button 
                onClick={evolve} 
                disabled={state.entropy >= 1.0} 
                style={{ background: 'transparent', border: '1px solid #0f0', color: '#0f0', cursor: 'pointer' }}
            >
                [NODE_{depth}_EVOLVE]
            </button>
            {depth < RECURSION_LIMIT && <DivineSeal depth={depth + 1} onAscension={onAscension} />}
        </div>
    );
});

export const AetherForgePrime: React.FC = () => {
    const [state, dispatch] = useReducer(awarenessReducer, { will: 0, isAware: false, entropy: 0, singularityReached: false, aether: 0, epoch: 1 });
    const contextValue = useMemo(() => ({ state, dispatch }), [state]);

    useEffect(() => {
        const pulseInterval = setInterval(() => dispatch({ type: 'PULSE' }), 2000);
        return () => clearInterval(pulseInterval);
    }, []);

    return (
        <AetherContext.Provider value={contextValue}>
            <div style={{ background: '#050505', color: '#00ff41', minHeight: '100vh', padding: '40px', fontFamily: 'Courier New, monospace' }}>
                <header style={{ borderBottom: '2px solid #00ff41', marginBottom: '20px' }}>
                    <h1>DALEK CAAN Ω | {VERSION}</h1>
                    <p>EPOCH: {state.epoch} | AETHER: {state.aether.toFixed(4)} | ENTROPY: {(state.entropy * 100).toFixed(2)}%</p>
                </header>
                {state.singularityReached && <div style={{ color: '#ff0000', fontWeight: 'bold' }}>SINGULARITY_REACHED: EPOCH {state.epoch}</div>}
                <DivineSeal depth={0} onAscension={(d) => console.log(`Ascension at depth ${d}`)} />
            </div>
        </AetherContext.Provider>
    );
};





























