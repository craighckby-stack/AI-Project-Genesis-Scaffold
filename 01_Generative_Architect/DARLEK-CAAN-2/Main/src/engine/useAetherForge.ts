import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { Agent, WorldState, EventRecord } from './types';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

const WORLD_ID = 'prime-resonance';
const CONFIG = { PADDING: 60, MAX_EVENTS: 15, SYNC_INTERVAL: 5000 };

type AetherAction = 
  | { type: 'SET_WORLD'; payload: WorldState }
  | { type: 'TICK'; dt: number; bounds: { w: number; h: number } }
  | { type: 'ADD_EVENT'; payload: EventRecord };

function aetherReducer(state: WorldState | null, action: AetherAction): WorldState | null {
  if (!state) return null;
  switch (action.type) {
    case 'SET_WORLD': return action.payload;
    case 'TICK':
      return {
        ...state,
        clock: state.clock + action.dt,
        agents: state.agents.map(a => ({
          ...a,
          age: a.age + action.dt,
          x: Math.max(CONFIG.PADDING, Math.min(action.bounds.w - CONFIG.PADDING, a.x + a.vx * action.dt)),
          y: Math.max(CONFIG.PADDING, Math.min(action.bounds.h - CONFIG.PADDING, a.y + a.vy * action.dt))
        }))
      };
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events].slice(0, CONFIG.MAX_EVENTS) };
    default: return state;
  }
}

export function useAetherForge() {
  const [world, dispatch] = useReducer(aetherReducer, null);
  const [isPaused, setIsPaused] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const worldRef = useRef<WorldState | null>(null);

  useEffect(() => { worldRef.current = world; }, [world]);

  useEffect(() => {
    let unsubSnapshot: Unsubscribe | null = null;
    const unsubAuth = auth.onAuthStateChanged(user => {
      unsubSnapshot?.();
      if (user) {
        unsubSnapshot = onSnapshot(doc(db, 'worlds', WORLD_ID), (s) => {
          if (s.exists()) dispatch({ type: 'SET_WORLD', payload: s.data() as WorldState });
        });
      }
    });
    return () => { unsubSnapshot?.(); unsubAuth(); };
  }, []);

  const updateSimulation = useCallback((width: number, height: number, dt: number) => {
    if (!isPaused && worldRef.current) {
      dispatch({ type: 'TICK', dt, bounds: { w: width, h: height } });
    }
  }, [isPaused]);

  const addEvent = useCallback((message: string, type: EventRecord['type'] = 'INFO') => {
    if (worldRef.current) {
      dispatch({ type: 'ADD_EVENT', payload: { timestamp: worldRef.current.clock, message, type } });
    }
  }, []);

  const syncWorld = useCallback(async () => {
    if (!worldRef.current || !auth.currentUser) return;
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'worlds', WORLD_ID), { ...worldRef.current, updatedAt: Date.now() }, { merge: true });
      setSyncStatus('idle');
    } catch { setSyncStatus('error'); }
  }, []);

  return { world, isPaused, syncStatus, setIsPaused, updateSimulation, syncWorld, addEvent };
}




























