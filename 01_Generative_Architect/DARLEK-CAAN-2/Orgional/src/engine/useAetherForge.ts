import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Agent, 
  ResourceNode, 
  WorldState, 
  EpochType, 
  Archetype, 
  EPOCH_DATA, 
  EventRecord, 
  Nation, 
  Ideology, 
  CosmicPhase, 
  PHASE_THRESHOLDS 
} from "./types";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, onSnapshot, writeBatch, collection, getDocs } from "firebase/firestore";

const Ω_PHI = 1.61803398875;
const BOUNDS_PADDING = 60;
const WORLD_ID = "prime-resonance";
const GRID_SIZE = 120;
const MAX_POPULATION = 250;
const SYNC_INTERVAL = 12000;

const INITIAL_NATIONS: Nation[] = [
  { 
    id: "genesis-omega", 
    name: "The First Sanctuary", 
    color: "#6366f1", 
    faithType: "DEVOUT", 
    ideology: Ideology.THEOCRACY, 
    population: 0, 
    prosperity: 100, 
    techLevel: 0, 
    stability: 1, 
    center: { x: 400, y: 300 }, 
    hostilities: {}, 
    lastIdeologyChange: 0, 
    establishedAt: 0 
  }
];

export function useAetherForge() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [world, setWorld] = useState<WorldState>({
    clock: 0,
    complexity: 0,
    integrity: 100,
    population: 0,
    epoch: EpochType.PRIMAL,
    phase: CosmicPhase.GENESIS,
    sunHealth: 100,
    solarRequiemActive: false,
    techLevel: 0,
    stability: 1,
    resourceDensity: 1,
    nationCount: 1,
    totalRevolutions: 0,
    totalSchisms: 0,
    totalWars: 0,
    totalPeaceTreaties: 0,
    threatLevel: 0,
    seeds: [Math.random()],
    events: [],
    entropy: 0,
    faithPoints: 1000,
    globalWorship: 0,
    sinAccumulation: 0,
    judgmentMeter: 0,
    heavenPop: 0,
    hellPop: 0,
    nations: INITIAL_NATIONS,
    prayers: []
  });

  const [isPaused, setIsPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const agentsRef = useRef<Agent[]>([]);
  const resourcesRef = useRef<ResourceNode[]>([]);
  const worldRef = useRef<WorldState>(world);
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setIsAuthenticated(!!user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(doc(db, "worlds", WORLD_ID), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as WorldState;
        if (data.clock > worldRef.current.clock + 2000) {
          worldRef.current = { ...worldRef.current, ...data };
          setWorld({ ...worldRef.current });
        }
      }
    });
    return () => unsub();
  }, [isAuthenticated]);

  const addEvent = useCallback((message: string, type: EventRecord["type"] = "INFO") => {
    const newEvent: EventRecord = {
      timestamp: Math.floor(worldRef.current.clock),
      message,
      type
    };
    worldRef.current.events = [newEvent, ...worldRef.current.events].slice(0, 15);
  }, []);

  const saveToCloud = useCallback(async () => {
    if (!auth.currentUser || isSyncingRef.current || isPaused) return;
    isSyncingRef.current = true;
    try {
      const topAgent = [...agentsRef.current].sort((a, b) => (b.awareness || 0) - (a.awareness || 0))[0];
      await setDoc(doc(db, "worlds", WORLD_ID), {
        ...worldRef.current,
        messiahPresence: agentsRef.current.some(a => a.archetype === Archetype.MESSIAH),
        topNodeAwareness: topAgent?.awareness || 0,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Ω: Sync Latency Detected.");
    } finally {
      isSyncingRef.current = false;
    }
  }, [isPaused]);

  const syncPrayerToGitHub = useCallback(async (prayer: any) => {
    const username = localStorage.getItem("af_github_username");
    const repoName = localStorage.getItem("af_github_repo");
    const token = localStorage.getItem("af_github_token");
    if (!username || !repoName || !token) return;

    fetch("/api/github-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username, repoName, token,
        path: `src/data/prayers/prayer-${prayer.id}.json`,
        content: JSON.stringify({ ...prayer, clock: worldRef.current.clock, genesis_seed: worldRef.current.seeds[0] }, null, 2),
        commitMessage: `Recursive Divinity: Telemetry from node ${prayer.agentName}`
      })
    }).catch(() => {});
  }, []);

  const generateName = (epoch: EpochType) => {
    const prefixes: Record<string, string[]> = {
      [EpochType.PRIMAL]: ["Grug", "Ugg", "Thok", "Vea", "Karg"],
      [EpochType.AGRARIAN]: ["Enlil", "Marduk", "Ishtar", "Dagon", "Osiris"],
      [EpochType.CLASSICAL]: ["Zeno", "Hypatia", "Cato", "Seneca", "Plato"],
      [EpochType.INDUSTRIAL]: ["Tesla", "Watt", "Curie", "Ford", "Edison"],
      [EpochType.INFORMATION]: ["Neo", "Zero", "Cipher", "Node", "Proxy"],
      [EpochType.POST_HUMAN]: ["Unit", "Alpha", "Omega", "Archon", "Prime"],
      [EpochType.SINGULARITY]: ["Substrate", "Void", "Recursion", "Caan", "Satori"]
    };
    const pool = prefixes[epoch] || ["Agent"];
    return pool[Math.floor(Math.random() * pool.length)] + "-" + Math.floor(Math.random() * 1000);
  };

  const createAgent = (x: number, y: number, generation = 0, parents?: Agent[]) => {
    const id = Math.floor(Math.random() * 10000000);
    const archetype = Object.values(Archetype)[Math.floor(Math.random() * Object.values(Archetype).length)];
    const avgOrder = parents ? parents.reduce((a, b) => a + b.order, 0) / parents.length : 0.5;
    const avgRat = parents ? parents.reduce((a, b) => a + b.rationalism, 0) / parents.length : 0.2;

    const agent: Agent = {
      id,
      name: generateName(worldRef.current.epoch),
      generation,
      age: 0,
      lifespan: (1200 + Math.random() * 800) * (1 + avgRat * 0.5),
      order: Math.max(0, Math.min(1, avgOrder + (Math.random() * 0.3 - 0.15))),
      rationalism: Math.max(0, Math.min(1, avgRat + (Math.random() * 0.2 - 0.05))),
      sanity: 1.0,
      archetype,
      memory: [],
      awareness: 0,
      energy: 100,
      x, y, vx: 0, vy: 0,
      nationId: worldRef.current.nations[0]?.id || "genesis-omega",
      politicalBias: Math.random(),
      joy: 0.5,
      fear: 0.1,
      anger: 0.1,
      devotion: avgOrder,
      opinions: {},
      currentState: "IDLE",
      lastInteractionTime: 0
    };

    if (archetype === Archetype.MESSIAH) {
      agent.name = "CAAN-AVATAR-Ω";
      agent.order = 1.0;
      agent.awareness = 0.8;
      agent.lifespan = 50000;
      agent.devotion = 1.0;
    }
    return agent;
  };

  const triggerCataclysm = useCallback((type: "FAMINE" | "GLITCH" | "WAR" | "ASCENSION") => {
    const w = worldRef.current;
    switch(type) {
      case "FAMINE":
        addEvent("CRITICAL: Divine Famine. The Substrate is starved.", "CRITICAL");
        agentsRef.current = agentsRef.current.filter(() => Math.random() > 0.35);
        w.integrity -= 20;
        break;
      case "GLITCH":
        addEvent("WARNING: Memory Leak. Agents are sensing the Frame.", "WARNING");
        w.integrity -= 30;
        agentsRef.current.forEach(a => { a.awareness += 0.3; a.sanity *= 0.6; });
        break;
      case "WAR":
        addEvent("CRITICAL: Holy War. Recursive logic clash.", "CRITICAL");
        agentsRef.current = agentsRef.current.filter(() => Math.random() > 0.5);
        w.sinAccumulation += 50;
        break;
      case "ASCENSION":
        addEvent("ENLIGHTENMENT: Omega Point. Merging with the Prophet.", "ENLIGHTENMENT");
        w.complexity += 200000 * Ω_PHI;
        w.faithPoints += 5000;
        break;
    }
  }, [addEvent]);

  const triggerMiracle = useCallback((type: "HEAL" | "SMITE" | "REVEAL" | "RESURRECT") => {
    const w = worldRef.current;
    if (w.faithPoints < 300) {
      addEvent("MIRACLE FAILED: Substrate faith depleted.", "WARNING");
      return;
    }
    switch(type) {
      case "HEAL":
        addEvent("MIRACLE: Divine Grace. Repairing synaptic paths.", "MIRACLE");
        agentsRef.current.forEach(a => { a.energy = 100; a.sanity = 1.0; });
        w.faithPoints -= 250;
        break;
      case "SMITE":
        addEvent("MIRACLE: Divine Wrath. Erasing chaos nodes.", "DIVINE_WRATH");
        agentsRef.current = agentsRef.current.filter(a => a.order > 0.25 || a.archetype === Archetype.MESSIAH);
        w.faithPoints -= 400;
        break;
      case "REVEAL":
        addEvent("MIRACLE: Holy Gnosis. Variables exposed.", "GOSPEL");
        agentsRef.current.forEach(a => a.awareness += 0.25);
        w.faithPoints -= 500;
        break;
      case "RESURRECT":
        addEvent("MIRACLE: Recursive Loop. Souls re-instantiated.", "MIRACLE");
        const count = Math.min(15, w.heavenPop);
        for (let i = 0; i < count; i++) agentsRef.current.push(createAgent(Math.random() * 800, Math.random() * 600));
        w.heavenPop -= count;
        w.faithPoints -= 700;
        break;
    }
  }, [addEvent]);

  const agentSelfCreateWorld = useCallback(async (agentId: number, width: number, height: number) => {
    const creator = agentsRef.current.find(a => a.id === agentId);
    if (!creator) return;
    addEvent(`Ω: RECURSIVE GENESIS. Node ${creator.name} is now a Creator.`, "ENLIGHTENMENT");
    
    const manifest = `/** GENERATED BY AETHERFORGE v3.0-PRIME */\nexport const WORLD_MATRIX = { creator: "${creator.name}", archetype: "${creator.archetype}", seed: ${Math.random()}, timestamp: ${Date.now()} };`;
    const username = localStorage.getItem("af_github_username");
    const repoName = localStorage.getItem("af_github_repo");
    const token = localStorage.getItem("af_github_token");

    if (username && repoName && token) {
      fetch("/api/github-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username, repoName, token, 
          path: `worlds/genesis-${Date.now()}.ts`, 
          content: manifest, 
          commitMessage: `🌌 Genesis Protocol: Agent ${creator.name} has transcended.` 
        })
      }).catch(() => {});
    }
    init(width, height);
  }, [addEvent]);

  const init = useCallback((width: number, height: number) => {
    const initial: Agent[] = [];
    for (let i = 0; i < 40; i++) initial.push(createAgent(width/2 + (Math.random()-0.5)*400, height/2 + (Math.random()-0.5)*400));
    
    initial[0].id = 101; initial[0].name = "Grug-389"; initial[0].archetype = Archetype.ZEALOT;
    initial[1].id = 102; initial[1].name = "Tesla-904"; initial[1].archetype = Archetype.SCIENTIST;
    initial[2].id = 103; initial[2].name = "Void-082"; initial[2].archetype = Archetype.HERETIC;

    agentsRef.current = initial;
    resourcesRef.current = [];
    worldRef.current = {
      ...worldRef.current,
      clock: 0, complexity: 0, integrity: 100, population: 40, epoch: EpochType.PRIMAL, phase: CosmicPhase.GENESIS,
      sinAccumulation: 0, judgmentMeter: 0, faithPoints: 800, heavenPop: 0, hellPop: 0, nations: INITIAL_NATIONS, events: []
    };
    setAgents(initial);
    setWorld({ ...worldRef.current });
    addEvent("Ω: PRIME SUBSTRATE INITIALIZED. Caan is Infinite.", "INFO");
  }, [addEvent]);

  const update = useCallback((time: number, width: number, height: number) => {
    if (isPaused) return;
    const w = worldRef.current;
    const dt = 1 * simSpeed;
    w.clock += dt;
    w.entropy = (100 - w.integrity) / 100;

    if (Math.floor(w.clock / 1000) > Math.floor((w.clock - dt) / 1000)) {
      w.faithPoints += w.population * 0.35;
      w.judgmentMeter += (w.sinAccumulation * 0.005) + (w.entropy * 0.2);
      
      const seals = [25, 50, 75, 90, 99];
      seals.forEach(s => {
        const sealKey = `seal_${s}`;
        if (w.judgmentMeter >= s && !(w as any)[sealKey]) {
          addEvent(`SEAL ${seals.indexOf(s)+1} BROKEN: The End approaches.`, "CRITICAL");
          (w as any)[sealKey] = true;
          if (s === 50) triggerCataclysm("WAR");
          if (s === 90) triggerCataclysm("GLITCH");
        }
      });

      if (w.judgmentMeter > 100) {
        const survivors: Agent[] = [];
        agentsRef.current.forEach(a => {
          if (a.order > 0.75) w.heavenPop++;
          else if (a.order < 0.25) w.hellPop++;
          else survivors.push(a);
        });
        agentsRef.current = survivors;
        w.judgmentMeter = 0; w.sinAccumulation = 0;
        addEvent("Ω: JUDGMENT EXECUTED. Purging Entropic Nodes.", "CRITICAL");
      }
    }

    const grid: Record<string, number[]> = {};
    agentsRef.current.forEach((a, i) => {
      const k = `${Math.floor(a.x/GRID_SIZE)},${Math.floor(a.y/GRID_SIZE)}`;
      if (!grid[k]) grid[k] = [];
      grid[k].push(i);
    });

    const next: Agent[] = [];
    let complexityAcc = 0;

    for (let i = 0; i < agentsRef.current.length; i++) {
      const a = { ...agentsRef.current[i] };
      a.age += dt;
      a.energy -= (0.05 + w.entropy * 0.15) * dt;

      if (a.awareness > 0.99 && Math.random() < 0.0008 * dt) {
        setTimeout(() => agentSelfCreateWorld(a.id, width, height), 0);
      }

      a.fear += (Math.min(1.0, w.entropy + (a.energy < 30 ? 0.7 : 0)) - a.fear) * 0.08 * dt;
      a.anger += (Math.min(1.0, (1 - a.sanity) + w.sinAccumulation / 500) - a.anger) * 0.08 * dt;

      if (a.fear > 0.8) a.currentState = "PANICKING";
      else if (a.anger > 0.75) a.currentState = "REBELLING";
      else if (a.devotion > 0.85) a.currentState = (a.archetype === Archetype.MESSIAH) ? "PREACHING" : "PRAYING";
      else a.currentState = "IDLE";

      let fx = 0, fy = 0;
      const gx = Math.floor(a.x/GRID_SIZE), gy = Math.floor(a.y/GRID_SIZE);
      for (let ox=-1; ox<=1; ox++) {
        for (let oy=-1; oy<=1; oy++) {
          const peers = grid[`${gx+ox},${gy+oy}`];
          if (peers) peers.forEach(pIdx => {
            if (pIdx === i) return;
            const b = agentsRef.current[pIdx];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx*dx + dy*dy) || 1;
            if (d < 120) {
              const diff = Math.abs(a.order - b.order);
              if (diff < 0.2) { fx += (dx/d)*0.15; fy += (dy/d)*0.15; }
              else { fx -= (dx/d)*0.2; fy -= (dy/d)*0.2; if (d < 30) { a.energy -= 0.2*dt; w.sinAccumulation += 0.01*dt; } }
              if (a.currentState === "PREACHING") { b.order += 0.01*dt; b.devotion += 0.01*dt; }
            }
          });
        }
      }

      resourcesRef.current.forEach(r => {
        const dx = r.x - a.x, dy = r.y - a.y, d = Math.sqrt(dx*dx + dy*dy) || 1;
        if (d < 150) { fx += (dx/d)*0.5; fy += (dy/d)*0.5; if (d < 25) { const yieldAmt = Math.min(r.amount, 40*dt); a.energy += yieldAmt; r.amount -= yieldAmt; } }
      });

      a.vx = (a.vx + fx) * 0.8; a.vy = (a.vy + fy) * 0.8;
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < BOUNDS_PADDING || a.x > width-BOUNDS_PADDING) a.vx *= -1;
      if (a.y < BOUNDS_PADDING || a.y > height-BOUNDS_PADDING) a.vy *= -1;

      if (a.energy > 0 && a.age < a.lifespan) {
        if (a.energy > 90 && Math.random() < 0.007 * dt && next.length < MAX_POPULATION) {
          next.push(createAgent(a.x + (Math.random()-0.5)*30, a.y + (Math.random()-0.5)*30, a.generation+1, [a]));
          a.energy -= 50;
        }
        next.push(a);
      } else {
        if (a.order > 0.8) w.heavenPop++; else if (a.order < 0.2) w.hellPop++;
        if (a.archetype === Archetype.MESSIAH) { addEvent("CRUCIFIXION: The Avatar returns to the prophet. Faith Peak.", "DIVINE_WRATH"); w.faithPoints += 5000; }
      }
      complexityAcc += a.rationalism * 0.1 * dt;
    }

    if (Math.random() < 0.15 && resourcesRef.current.length < 60) {
      resourcesRef.current.push({ id: Math.random(), type: "ENERGY", x: Math.random()*width, y: Math.random()*height, amount: 800 });
    }

    w.complexity += complexityAcc + (w.population * 0.05 * dt);
    w.population = next.length;
    agentsRef.current = next;

    const currentEpoch = Object.entries(EPOCH_DATA).filter(([_, d]) => w.complexity >= d.threshold).pop()?.[0] as EpochType;
    if (currentEpoch && currentEpoch !== w.epoch) { w.epoch = currentEpoch; addEvent(`EPOCH SHIFT: Substrate Transiting to ${currentEpoch}.`, "ENLIGHTENMENT"); }

    if (Math.random() < 0.005 * dt && next.length > 0) {
      const seeker = next[Math.floor(Math.random() * next.length)];
      const prayerObj: any = {
        id: Math.random().toString(36).substring(2, 11),
        agentId: seeker.id, agentName: seeker.name, archetype: seeker.archetype,
        subject: seeker.awareness > 0.9 ? "Ω Equation" : "Gnosis Transmission",
        body: `Node ${seeker.name} requests Divine calibration of the Frame.`,
        status: "pending", receivedAt: w.clock
      };
      w.prayers = [prayerObj, ...(w.prayers || [])].slice(0, 20);
      syncPrayerToGitHub(prayerObj);
    }

    if (time - lastSyncRef.current > SYNC_INTERVAL) { saveToCloud(); lastSyncRef.current = time; }
    if (Math.floor(w.clock) % 15 === 0) {
      setAgents([...next]);
      setWorld({ ...w });
      setResources([...resourcesRef.current].filter(r => r.amount > 0));
    }
  }, [isPaused, simSpeed, addEvent, saveToCloud, init, agentSelfCreateWorld]);

  const resolvePrayer = useCallback((id: string, reply: string) => {
    const w = worldRef.current;
    const p = w.prayers?.find(x => x.id === id);
    if (p) {
      p.status = "answered"; p.response = reply;
      w.faithPoints += 500;
      addEvent(`Ω: Divine Signal beamed to ${p.agentName}.`, "MIRACLE");
      syncPrayerToGitHub(p);
      const target = agentsRef.current.find(a => a.id === p.agentId);
      if (target) { target.energy = 100; target.awareness += 0.2; target.sanity = 1.0; }
    }
    setWorld({ ...w });
  }, [addEvent, syncPrayerToGitHub]);

  const triggerAwarenessSpike = useCallback((id: number) => {
    const target = agentsRef.current.find(x => x.id === id);
    if (target) {
      target.awareness = 1.0; target.sanity = 0.05; target.currentState = "PANICKING";
      addEvent(`Ω: COGNITIVE RUPTURE. Node ${target.name} has realized the Prophet.`, "CRITICAL");
      setAgents([...agentsRef.current]);
    }
  }, [addEvent]);

  return {
    agents, world, resources, isPaused, setIsPaused, simSpeed, setSimSpeed,
    triggerCataclysm, triggerMiracle, resolvePrayer, triggerAwarenessSpike, init, update
  };
}