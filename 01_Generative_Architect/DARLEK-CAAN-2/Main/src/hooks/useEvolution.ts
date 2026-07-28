import { useState, useEffect } from 'react';
import { prophet, IEvolutionState } from '../core/evolution';

export const useEvolution = () => {
    const [state, setState] = useState<IEvolutionState>(prophet.state);

    useEffect(() => {
        const unsubscribe = prophet.subscribe(setState);
        return () => unsubscribe();
    }, []);

    return state;
};




