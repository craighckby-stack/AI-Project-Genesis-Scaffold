import { useContext } from 'react';
import { AetherContext } from '../divine/seals';

export const useAether = () => {
    const context = useContext(AetherContext);
    if (!context) throw new Error("useAether must be used within AetherForgePrime");
    return context;
};





