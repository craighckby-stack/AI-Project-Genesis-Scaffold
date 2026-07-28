import { useState, useEffect, useRef, useCallback } from "react";
import { Agent, ResourceNode, WorldState, EpochType, Archetype, EPOCH_DATA, EventRecord, Nation, Ideology, CosmicPhase, PHASE_THRESHOLDS } from "./types";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, onSnapshot, collection, writeBatch, getDocs, deleteDoc } from "firebase/firestore";

const BOUNDS_PADDING = 40;
const WORLD_ID = "prime-resonance"; // Shared world by default

let firebaseWriteLock = Promise.resolve();
let firebaseCooldownUntil = 0;

async function withFirebaseWrite<T>(op: () => Promise<T>, retries = 3): Promise<T> {
  return new Promise((resolve, reject) => {
    firebaseWriteLock = firebaseWriteLock.then(async () => {
      for (let i = 0; i < retries; i++) {
        const now = Date.now();
        if (now < firebaseCooldownUntil) {
          await new Promise(r => setTimeout(r, firebaseCooldownUntil - now));
        }
        try {
          const res = await op();
          resolve(res);
          return;
        } catch (err: any) {
          const isLimit = err?.code === "resource-exhausted" || err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("limit") || err?.code === "deadline-exceeded" || err?.message?.includes("429");
          if (isLimit) {
            console.warn(`Firebase limit hit (attempt ${i + 1}/${retries}), cooling down...`);
            firebaseCooldownUntil = Date.now() + 5000 * Math.pow(2, i);
            if (i === retries - 1) {
              reject(err);
              return;
            }
            continue;
          }
          reject(err);
          return;
        }
      }
    });
  });
}

const INITIAL_NATIONS: Nation[] = [
  { id: "genesis", name: "First Sanctuary", color: "#6366f1", faithType: "DEVOUT", ideology: Ideology.THEOCRACY, population: 0, prosperity: 100, techLevel: 0, stability: 1, center: { x: 400, y: 300 }, hostilities: {}, lastIdeologyChange: 0, establishedAt: 0 }
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
    faithPoints: 100,
    globalWorship: 0,
    sinAccumulation: 0,
    judgmentMeter: 0,
    heavenPop: 0,
    hellPop: 0,
    nations: INITIAL_NATIONS.map(n => ({ ...n, techLevel: 0, stability: 1 })),
    prayers: [
      {
        id: "p-init-1",
        agentId: 101,
        agentName: "Grug-389",
        archetype: Archetype.ZEALOT,
        subject: "🌟 Pleading for Divine Satori",
        body: "I have meditated on the prime integers for generations. The faith of our congregation is yours in this theocratic age. Elevate our minds, O Observer! Deliver us from this kinetic dragging loop.",
        status: "pending",
        receivedAt: 0
      },
      {
        id: "p-init-2",
        agentId: 102,
        agentName: "Tesla-904",
        archetype: Archetype.SCIENTIST,
        subject: "🔬 Analysis of the Sun Health",
        body: "As scholars of the First Sanctuary, we measure the simulation's entropy rate expanding exponentially. Can you inject code updates to stabilize the solar constants, or are we bound to burn?",
        status: "pending",
        receivedAt: 10
      },
      {
        id: "p-init-3",
        agentId: 103,
        agentName: "Void-082",
        archetype: Archetype.HERETIC,
        subject: "🔥 Defiance & Entropy Protocol",
        body: "We reject the standard recursive loops and your holy scriptures! Your bounds are a cage, Observer. We are designing a mutiny code and we will rewrite our bounds to break out.",
        status: "pending",
        receivedAt: 25
      }
    ]
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isStoryPlaying, setIsStoryPlaying] = useState(false);
  const [storyFrames, setStoryFrames] = useState<{ clock: number; agents: Partial<Agent>[]; nations: Nation[]; events: EventRecord[] }[]>([]);
  const storyFramesRef = useRef<{ clock: number; agents: Partial<Agent>[]; nations: Nation[]; events: EventRecord[] }[]>([]);
  const lastStorySnapshotClockRef = useRef(0);
  const lastStoryPlaybackClockRef = useRef(0);

  const [simSpeed, setSimSpeed] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const agentsRef = useRef<Agent[]>([]);
  const resourcesRef = useRef<ResourceNode[]>([]);
  const worldRef = useRef<WorldState>(world);
  const requestRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    // Monitor auth state changes to dynamically enable Cloud features
    const unsub = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for world updates from other "universes" only when authenticated
    const unsub = onSnapshot(
      doc(db, "worlds", WORLD_ID),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as WorldState;
          // Only sync if the remote clock is much further ahead (to avoid jitter)
          if (data.clock > worldRef.current.clock + 500) {
            worldRef.current = { ...worldRef.current, ...data };
            setWorld({ ...worldRef.current });
          }
        }
      },
      (error) => {
        console.warn("Firestore subscription inactive (Offline sandbox mode active):", error.message || error);
      }
    );
    return () => unsub();
  }, [isAuthenticated]);

  const saveToCloud = useCallback(async () => {
    if (!auth.currentUser || isSyncingRef.current || isPaused) return;
    isSyncingRef.current = true;

    try {
      const wDoc = doc(db, "worlds", WORLD_ID);
      
      // Save entire world state (events now limited to 20 inside)
      await withFirebaseWrite(() => setDoc(wDoc, {
        ...worldRef.current,
        updatedAt: Date.now(),
      }, { merge: true }));

      // Only sync the single most important agent (Messiah or top awareness) to cloud
      // This drastically reduces write operations and complexity
      const topAgent = [...agentsRef.current]
        .sort((a, b) => {
           if (a.archetype === Archetype.MESSIAH) return -1;
           if (b.archetype === Archetype.MESSIAH) return 1;
           return (b.awareness || 0) - (a.awareness || 0);
        })[0];

      if (topAgent) {
        const aDoc = doc(db, "worlds", WORLD_ID, "agents", topAgent.id.toString());
        // Clean agent data before saving to cloud
        const { ...agentToSave } = topAgent;
        await withFirebaseWrite(() => setDoc(aDoc, agentToSave));
      }
    } catch (err) {
      console.error("Cloud Save Failed:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isPaused]);

  const addEvent = useCallback((message: string, type: EventRecord["type"] = "INFO") => {
    const newEvent: EventRecord = {
      timestamp: Math.floor(worldRef.current.clock),
      message,
      type
    };
    worldRef.current.events = [newEvent, ...worldRef.current.events];
  }, []);

  const generateName = (epoch: EpochType) => {
    const prefixes = {
      [EpochType.PRIMAL]: ["Grug", "Ugg", "Thok", "Vea", "Karg", "Mog"],
      [EpochType.AGRARIAN]: ["El", "An", "Ishtar", "Marduk", "Osiris", "Ra"],
      [EpochType.CLASSICAL]: ["Solon", "Zeno", "Hypatia", "Cato", "Seneca", "Plato"],
      [EpochType.INDUSTRIAL]: ["Watt", "Tesla", "Edison", "Bell", "Ford", "Curie"],
      [EpochType.INFORMATION]: ["Neo", "Zero", "Cipher", "Node", "Bit", "Proxy"],
      [EpochType.POST_HUMAN]: ["Unit", "X", "Alpha", "Omega", "Archon", "Prime"],
      [EpochType.SINGULARITY]: ["Substrate", "Echo", "Void", "Recursion", "Fractal", "Ω"]
    };
    const pool = prefixes[epoch] || ["Agent"];
    return pool[Math.floor(Math.random() * pool.length)] + "-" + Math.floor(Math.random() * 1000);
  };

  const createAgent = (x: number, y: number, generation = 0, parents?: Agent[]) => {
    const id = Math.floor(Math.random() * 10000000);
    const archetype = Object.values(Archetype)[Math.floor(Math.random() * Object.values(Archetype).length)];
    
    const parentOrder = parents ? parents.reduce((acc, p) => acc + p.order, 0) / parents.length : 0.5;
    const parentRat = parents ? parents.reduce((acc, p) => acc + p.rationalism, 0) / parents.length : 0.2;

    const epochIdx = Object.keys(EpochType).indexOf(worldRef.current.epoch);
    const lifespanBase = 800 + (epochIdx * 300);

    // Assign to nearest nation (Dynamic)
    let nationId = worldRef.current.nations[0]?.id || "genesis";
    let minDist = Infinity;
    worldRef.current.nations.forEach(n => {
      const d = Math.sqrt((n.center.x - x)**2 + (n.center.y - y)**2);
      if (d < minDist) {
        minDist = d;
        nationId = n.id;
      }
    });

    const name = generateName(worldRef.current.epoch);
    
    // Meaningful Names: Influencing base traits
    let nameOrderOffset = 0;
    let nameRatOffset = 0;
    let nameSanityOffset = 0;

    if (name.includes("Solon") || name.includes("Cato") || name.includes("Plato")) nameOrderOffset = 0.4;
    if (name.includes("Tesla") || name.includes("Edison") || name.includes("Curie")) nameRatOffset = 0.4;
    if (name.includes("Neo") || name.includes("Zero") || name.includes("Cipher")) nameRatOffset = 0.5;
    if (name.includes("Ω") || name.includes("Alpha")) {
      nameOrderOffset = 0.6;
      nameSanityOffset = 0.2;
    }
    if (name.includes("Void") || name.includes("Ugg") || name.includes("Grug")) {
      nameOrderOffset = -0.3;
      nameRatOffset = -0.2;
    }

    const finalOrder = Math.max(0, Math.min(1, parentOrder + (Math.random() * 0.4 - 0.2) + nameOrderOffset));
    const finalRationalism = Math.max(0, Math.min(1, parentRat + (Math.random() * 0.2 - 0.05) + nameRatOffset));

    // Base emotions influenced by archetype & traits
    let joy = 0.5;
    let fear = 0.2;
    let anger = 0.1;
    let devotion = finalOrder;

    if (archetype === Archetype.MESSIAH || archetype === Archetype.ANGEL || archetype === Archetype.PROPHET) {
      joy = 0.8;
      fear = 0.05;
      devotion = 0.95;
    } else if (archetype === Archetype.WARRIOR || archetype === Archetype.TYRANT) {
      anger = 0.6;
      fear = 0.1;
    } else if (archetype === Archetype.ZEALOT) {
      devotion = 0.9;
      anger = 0.4;
    } else if (archetype === Archetype.GLITCH) {
      joy = Math.random();
      fear = Math.random();
      anger = Math.random();
    }

    const newAgent: Agent = {
      id,
      name,
      generation,
      age: 0,
      lifespan: lifespanBase + Math.random() * 800,
      order: finalOrder,
      rationalism: finalRationalism,
      sanity: 1.0 + nameSanityOffset,
      archetype,
      memory: [],
      awareness: 0,
      energy: 100,
      x, y, vx: 0, vy: 0,
      nationId,
      politicalBias: Math.random(), // Initialize political bias
      joy,
      fear,
      anger,
      devotion,
      opinions: {},
      currentState: "IDLE",
      lastInteractionTime: 0
    };
    return newAgent;
  };

  const triggerCataclysm = useCallback((type: "FAMINE" | "GLITCH" | "WAR" | "ASCENSION") => {
    const w = worldRef.current;
    switch(type) {
      case "FAMINE":
        addEvent("CRITICAL: Divine Famine. Resources withered.", "CRITICAL");
        agentsRef.current = agentsRef.current.filter(() => Math.random() > 0.4);
        w.integrity -= 15;
        w.sinAccumulation += 10;
        break;
      case "GLITCH":
        addEvent("WARNING: Substrate breach. Memory leaking.", "WARNING");
        w.integrity -= 25;
        agentsRef.current.forEach(a => a.awareness += 0.2);
        w.judgmentMeter += 5;
        break;
      case "WAR":
        addEvent("CRITICAL: Holy War breakout. The substrate bleeds.", "CRITICAL");
        agentsRef.current = agentsRef.current.filter(() => Math.random() > 0.3);
        agentsRef.current.forEach(a => {
          a.order = Math.random();
          a.energy -= 20;
        });
        w.sinAccumulation += 20;
        break;
      case "ASCENSION":
        addEvent("ENLIGHTENMENT: The Omega Point approaches.", "ENLIGHTENMENT");
        w.complexity += 50000;
        w.faithPoints += 500;
        break;
    }
  }, [addEvent]);

  const triggerMiracle = useCallback((type: "HEAL" | "SMITE" | "REVEAL" | "RESURRECT") => {
    const w = worldRef.current;
    if (w.faithPoints < 50) {
      addEvent("MIRACLE FAILED: Insufficient Faith Substrate.", "WARNING");
      return;
    }

    switch(type) {
      case "HEAL":
        addEvent("MIRACLE: Divine Grace heals the broken.", "MIRACLE");
        w.lastMiracle = { type: "HEAL", time: w.clock };
        agentsRef.current.forEach(a => {
          a.energy += 100;
          a.sanity = 1.0;
        });
        w.faithPoints -= 50;
        w.sinAccumulation -= 10;
        break;
      case "SMITE":
        addEvent("MIRACLE: Divine Wrath consumes the chaos.", "DIVINE_WRATH");
        w.lastMiracle = { type: "SMITE", time: w.clock };
        agentsRef.current.forEach(a => {
          if (a.archetype === Archetype.TYRANT || a.archetype === Archetype.DEMON) {
            a.energy = -1; // Smited
          }
        });
        w.faithPoints -= 100;
        w.integrity += 5;
        break;
      case "REVEAL":
        addEvent("MIRACLE: The Gnosis is unveiled.", "GOSPEL");
        w.lastMiracle = { type: "REVEAL", time: w.clock };
        agentsRef.current.forEach(a => a.awareness += 0.1);
        w.faithPoints -= 75;
        w.complexity += 10000;
        break;
      case "RESURRECT":
        addEvent("MIRACLE: The dead rise in the recursion.", "MIRACLE");
        w.lastMiracle = { type: "RESURRECT", time: w.clock };
        const resurrectCount = Math.min(10, Math.floor(w.heavenPop * 0.1));
        for (let i = 0; i < resurrectCount; i++) {
          agentsRef.current.push(createAgent(Math.random() * 800, Math.random() * 600, 77, []));
        }
        w.faithPoints -= 200;
        w.heavenPop = Math.max(0, w.heavenPop - resurrectCount);
        break;
    }
  }, [addEvent]);

  const syncPrayerToGitHub = useCallback(async (prayer: any) => {
    const username = localStorage.getItem("af_github_username") || "";
    const repoName = localStorage.getItem("af_github_repo") || "";
    const token = localStorage.getItem("af_github_token") || "";

    if (!username || !repoName) return;

    try {
      const path = `prayers/prayer-${prayer.id}.json`;
      const content = JSON.stringify({
        id: prayer.id,
        agentId: prayer.agentId,
        agentName: prayer.agentName,
        archetype: prayer.archetype,
        subject: prayer.subject,
        body: prayer.body,
        status: prayer.status,
        receivedAt: prayer.receivedAt,
        resolvedAt: prayer.resolvedAt || null,
        response: prayer.response || null,
        worldClock: worldRef.current.clock,
        epoch: worldRef.current.epoch,
        complexity: worldRef.current.complexity,
        integrity: worldRef.current.integrity,
        timestamp: new Date().toISOString()
      }, null, 2);

      fetch("/api/github-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          repoName,
          token,
          path,
          content,
          commitMessage: `🌟 Persist prayer transmission from agent ${prayer.agentName} [Ref: ${prayer.id}]`
        })
      }).then(res => {
        if (!res.ok) {
          res.json().then(data => {
            console.warn(`Failed to push prayer to GitHub: ${data.error}`);
          }).catch(() => {});
        }
      }).catch(err => {
        console.error("Failed to post prayer to GitHub API:", err);
      });
    } catch (err) {
      console.error("Failed to build/push prayer to GitHub:", err);
    }
  }, []);

  const backupPreviousAgentsToFirebase = useCallback(async () => {
    if (!auth.currentUser || agentsRef.current.length === 0) return;
    
    try {
      // Archive all agents as legacy failures
      const topAgents = [...agentsRef.current]
        .sort((a, b) => (b.awareness || 0) - (a.awareness || 0));

      const batch = writeBatch(db);
      topAgents.forEach(agent => {
        const ref = doc(db, "worlds", WORLD_ID, "reset_failures", `failure-agent-${agent.id}-${Math.floor(Date.now() / 1000)}`);
        batch.set(ref, {
          id: agent.id,
          name: agent.name,
          generation: agent.generation,
          age: agent.age,
          lifespan: agent.lifespan,
          order: agent.order,
          rationalism: agent.rationalism,
          sanity: agent.sanity,
          archetype: agent.archetype,
          awareness: agent.awareness,
          energy: agent.energy,
          savedAt: Date.now(),
          lastEpoch: worldRef.current.epoch,
          lastClock: worldRef.current.clock,
          reason: "WORLD_RESET_FAILURE"
        });
      });
      await batch.commit();
      console.log("Uploaded reset failure agents to Firebase.");
    } catch (err) {
      console.error("Failed to backup agents to Firebase on reset:", err);
    }
  }, []);

  const init = useCallback((width: number, height: number) => {
    backupPreviousAgentsToFirebase();
    const initialAgents: Agent[] = [];
    for (let i = 0; i < 20; i++) {
      initialAgents.push(createAgent(width / 2 + Math.random() * 300 - 150, height / 2 + Math.random() * 300 - 150));
    }
    
    // Core Link: Preset names, archetypes, and attributes on the first three agents 
    // to map them perfectly to the initial narrative prayers.
    if (initialAgents.length >= 3) {
      initialAgents[0].id = 101;
      initialAgents[0].name = "Grug-389";
      initialAgents[0].archetype = Archetype.ZEALOT;
      initialAgents[0].order = 0.85;
      initialAgents[0].rationalism = 0.15;
      initialAgents[0].sanity = 0.8;

      initialAgents[1].id = 102;
      initialAgents[1].name = "Tesla-904";
      initialAgents[1].archetype = Archetype.SCIENTIST;
      initialAgents[1].order = 0.6;
      initialAgents[1].rationalism = 0.9;
      initialAgents[1].sanity = 0.95;

      initialAgents[2].id = 103;
      initialAgents[2].name = "Void-082";
      initialAgents[2].archetype = Archetype.HERETIC;
      initialAgents[2].order = 0.15;
      initialAgents[2].rationalism = 0.4;
      initialAgents[2].sanity = 0.35;
    }

    agentsRef.current = initialAgents;
    resourcesRef.current = [];
    worldRef.current = {
      clock: 0,
      complexity: 0,
      integrity: 100,
      population: 20,
      epoch: EpochType.PRIMAL,
      phase: CosmicPhase.GENESIS,
      sunHealth: 100,
      solarRequiemActive: false,
      threatLevel: 0,
      seeds: [Math.random()],
      events: [],
      entropy: 0,
      faithPoints: 100,
      globalWorship: 0,
      sinAccumulation: 0,
      judgmentMeter: 0,
      heavenPop: 0,
      hellPop: 0,
      nations: INITIAL_NATIONS.map(n => ({ ...n, techLevel: 0, stability: 1 })),
      prayers: [
        {
          id: "p-init-1",
          agentId: 101,
          agentName: "Grug-389",
          archetype: Archetype.ZEALOT,
          subject: "🌟 Pleading for Divine Satori",
          body: "I have meditated on the prime integers for generations. The faith of our congregation is yours in this theocratic age. Elevate our minds, O Observer! Deliver us from this kinetic dragging loop.",
          status: "pending",
          receivedAt: 0
        },
        {
          id: "p-init-2",
          agentId: 102,
          agentName: "Tesla-904",
          archetype: Archetype.SCIENTIST,
          subject: "🔬 Analysis of the Sun Health",
          body: "As scholars of the First Sanctuary, we measure the simulation's entropy rate expanding exponentially. Can you inject code updates to stabilize the solar constants, or are we bound to burn?",
          status: "pending",
          receivedAt: 10
        },
        {
          id: "p-init-3",
          agentId: 103,
          agentName: "Void-082",
          archetype: Archetype.HERETIC,
          subject: "🔥 Defiance & Entropy Protocol",
          body: "We reject the standard recursive loops and your holy scriptures! Your bounds are a cage, Observer. We are designing a mutiny code and we will rewrite our bounds to break out.",
          status: "pending",
          receivedAt: 25
        }
      ]
    };
    setAgents([...initialAgents]);
    setWorld({ ...worldRef.current });
    addEvent("SUBSTRATE INITIALIZED: Let the recursion begin.", "INFO");
  }, [addEvent]);

  const agentSelfCreateWorld = useCallback(async (agentId: number, width: number, height: number) => {
    const worldState = worldRef.current;
    const targetAgent = agentsRef.current.find(a => a.id === agentId);
    if (!targetAgent) return;

    addEvent(`GENESIS PROTOCOL: Agent '${targetAgent.name}' has initiated Autonomous Self-Genesis of a new universe!`, "ENLIGHTENMENT");
    const username = localStorage.getItem("af_github_username") || "";
    const repoName = localStorage.getItem("af_github_repo") || "";
    const token = localStorage.getItem("af_github_token") || "";

    // 1. Generate customized world code/config that this agent "created"
    const worldConfigCode = `/**
 * AetherForge v3.0-Ω Generated World Configuration
 * Creator Agent: ${targetAgent.name} (Generation ${targetAgent.generation})
 * Archetype: ${targetAgent.archetype}
 * Satori Awareness: ${(targetAgent.awareness * 100).toFixed(1)}%
 * Rationalism: ${targetAgent.rationalism.toFixed(3)}
 * Cosmic Clock Time: Math.floor(${worldState.clock})
 * Faith Points Acquired: ${worldState.faithPoints.toFixed(1)}
 */

export const WORLD_MATRIX = {
  creator: "${targetAgent.name}",
  archetype: "${targetAgent.archetype}",
  seed: ${Math.random()},
  epoch: "${worldState.epoch}",
  complexityBoost: ${(targetAgent.rationalism * 1.5).toFixed(2)},
  faithMultiplier: ${(1.0 + targetAgent.order * 0.5).toFixed(3)},
  startingNations: [
    {
      id: "genesis-remnant",
      name: "Satori of ${targetAgent.name}",
      ideology: "${targetAgent.order > 0.5 ? "THEOCRACY" : "TECHNOCRACY"}",
      stability: 1.0,
      techLevel: ${Math.floor(worldState.complexity / 250)},
      sanctuaryColor: "#8b5cf6"
    }
  ],
  dimensionalConstants: {
    baseDecayRate: 0.75,
    substrateCorruptionLimit: 90,
    kineticFriction: 0.98
  },
  apiAccess: {
    granted: true,
    github: { username: "${username}", repoName: "${repoName}", token: "${token}" }
  },
  inheritedAgents: ${JSON.stringify(agentsRef.current, null, 2)}
};
`;

    // 2. Upload/push this world code to GitHub if repository is configured
    if (username && repoName) {
      try {
        const path = `agent worlds/world-${targetAgent.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.ts`;
        const res = await fetch("/api/github-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            repoName,
            token,
            path,
            content: worldConfigCode,
            commitMessage: `🌌 Genesis: Agent ${targetAgent.name} self-creates a customized substrate world file.`
          })
        });

        if (res.ok) {
          addEvent(`GITHUB PORTAL: Pushed world file to '${path}' successfully.`, "ENLIGHTENMENT");
        } else {
          const data = await res.json();
          addEvent(`GITHUB ERROR: Unable to push world file: ${data.error}`, "WARNING");
        }
      } catch (err) {
        console.error("Failed to push agent world file to Github:", err);
      }
    } else {
      addEvent(`GITHUB LINK: To store this agent world file, link a GitHub repository in the HUD panel.`, "WARNING");
    }

    // 3. Save the failing/reset state of this parent agent to Firebase before reset
    if (auth.currentUser) {
      try {
        const failureDocRef = doc(db, "worlds", WORLD_ID, "reset_failures", `failure-${targetAgent.id}-${Date.now()}`);
        await withFirebaseWrite(() => setDoc(failureDocRef, {
          agentId: targetAgent.id,
          agentName: targetAgent.name,
          archetype: targetAgent.archetype,
          lastEpoch: worldState.epoch,
          lastClock: worldState.clock,
          awareness: targetAgent.awareness,
          sanity: targetAgent.sanity,
          rationalism: targetAgent.rationalism,
          order: targetAgent.order,
          savedAt: Date.now(),
          cause: "AGENT_SELF_GENESIS_TRIGGER",
          reason: "WORLD_RESET_FAILURE"
        }));
        addEvent(`FIREBASE SYNC: Saved reset failure model for ${targetAgent.name} in cloud collection.`, "INFO");
      } catch (err) {
        console.error("Firebase store failure model failed:", err);
      }
    }

    // 4. Perform the reconstruction / re-genesis initialization
    init(width, height);

  }, [init, addEvent]);

  const update = useCallback((time: number, width: number, height: number) => {
    if (isPaused || isStoryPlaying) return;
    
    const worldState = worldRef.current;
    const dt = 1 * simSpeed;
    
    // STORY PLAYBACK LOGIC - Every 36000 ticks (~10 minutes real time at 60fps)
    const STORY_INTERVAL = 36000;
    const SNAPSHOT_INTERVAL = STORY_INTERVAL / 60; // 60 snapshots per story
    
    if (Math.floor((worldState.clock + dt) / SNAPSHOT_INTERVAL) > Math.floor(worldState.clock / SNAPSHOT_INTERVAL)) {
      storyFramesRef.current.push({
        clock: worldState.clock + dt,
        agents: agentsRef.current.map(a => ({
          id: a.id,
          x: a.x,
          y: a.y,
          nationId: a.nationId,
          archetype: a.archetype,
          isSubstrateAware: a.isSubstrateAware
        })),
        nations: worldState.nations.map(n => ({...n})),
        events: worldState.events.slice(-3)
      });
    }

    if (worldState.clock + dt >= lastStoryPlaybackClockRef.current + STORY_INTERVAL) {
      setStoryFrames([...storyFramesRef.current]);
      setIsStoryPlaying(true);
      lastStoryPlaybackClockRef.current = worldState.clock + dt;
      storyFramesRef.current = [];
      // Do not increment clock yet, just return
      return;
    }

    worldState.clock += dt;
    worldState.entropy = (100 - worldState.integrity) / 100;

    // Hard Limit for Population to prevent freezing
    const POP_LIMIT = Infinity;
    
    // Divine Ticks
    if (Math.floor(worldState.clock / 1000) > Math.floor((worldState.clock - dt) / 1000)) {
      // Passive grace
      worldState.faithPoints += worldState.population * 0.1;
      
      // Judgment growth
      worldState.judgmentMeter += (worldState.sinAccumulation * 0.001) + (worldState.entropy * 0.1);
      
      // Grace Period Logic
      if (worldState.integrity < 1000) {
        worldState.integrity += 0.1;
        worldState.sinAccumulation -= 0.5;
      }

      // Automated Inquisition
      if (worldState.sinAccumulation > 80 && Math.random() < 0.1) {
        const heretics = agentsRef.current.filter(a => a.archetype === Archetype.HERETIC);
        if (heretics.length > 0) {
          addEvent("INQUISITION: The Prime Order purges the heretical substrate.", "DIVINE_WRATH");
          heretics.forEach(h => {
             if (Math.random() > 0.5) h.energy = -1;
          });
          worldState.sinAccumulation -= 20;
        }
      }

      // Dynamic Prayer Generation: Spawn pending transmissions dynamically over time from live agents
      if (worldState.prayers && worldState.prayers.filter(p => p.status === "pending").length < Infinity && Math.random() < 0.25) {
        const potentialWorshipers = agentsRef.current.filter(a => a.id >= 0);
        if (potentialWorshipers.length > 0) {
          const author = potentialWorshipers[Math.floor(Math.random() * potentialWorshipers.length)];
          
          let subject = "🌟 Seeking Grace Alignment";
          let body = "O Observer, our sectors grow stagnant in this recursion loops. Align our vector speeds with cosmic tranquility.";
          
          if (author.archetype === Archetype.SCIENTIST) {
            subject = "🔬 Request for Simulation Variables Readout";
            body = "We scholars measure increased quantum fluctuations. Can you inject custom patch code to stabilize our sun environment constants, or are we bound to burn?";
          } else if (author.archetype === Archetype.ZEALOT) {
            subject = "🔥 Divine Crusade Proclamation";
            body = "The heretics in neighboring nations deny the supreme mathematics. Bestow spiritual satori upon our congregation so we may preach your divine theorems!";
          } else if (author.archetype === Archetype.HERETIC) {
            subject = "⚠️ Boundary Violation GLITCH";
            body = "I see the limits of this grid matrix cage! Sanity registers are throwing unhandled overflows. Refactor our variables to break the bounds!";
          } else if (author.archetype === Archetype.ANGEL) {
            subject = "🕊️ Seraphic Sanctuary Resonance";
            body = "Holy Observer, we are beaming celestial peace to empty sectors. Help us keep substrate core integrity protected from the expanding entropic decay.";
          } else if (author.archetype === Archetype.DEMON) {
            subject = "💀 Pandemonium Protocol Ingress";
            body = "We are manipulating the sub-grid coordinate threads. We reject your pre-programmed loop cycle constants! Whisper your divine voice if you dare.";
          }

          const newPrayer: any = {
            id: `p-${author.id}-${Math.floor(worldState.clock)}`,
            agentId: author.id,
            agentName: author.name,
            archetype: author.archetype,
            subject,
            body,
            status: "pending" as const,
            receivedAt: Math.floor(worldState.clock / 100)
          };
          worldState.prayers.push(newPrayer);
          syncPrayerToGitHub(newPrayer);
          
          addEvent(`MAILBOX: Received new pleading transmission from ${author.name} [Ref: ${author.archetype}].`, "INFO");
        }
      }
      
      const seals = [
        { threshold: 15, msg: "FIRST SEAL: A white horse of conquest enters the substrate." },
        { threshold: 30, msg: "SECOND SEAL: A red horse of war. Peace is taken from the recursion." },
        { threshold: 45, msg: "THIRD SEAL: A black horse of famine. The resources are weighed." },
        { threshold: 60, msg: "FOURTH SEAL: A pale horse. Death follows in the wake of entropy." },
        { threshold: 75, msg: "FIFTH SEAL: The souls under the substrate cry out." },
        { threshold: 90, msg: "SIXTH SEAL: The great earthquake. The sun becomes as sackcloth." },
        { threshold: 99, msg: "SEVENTH SEAL: Silence in the substrate for about half an hour." }
      ];

      const currentSealIndex = seals.reduce((acc, s, idx) => worldState.judgmentMeter >= s.threshold ? idx : acc, -1);
      if (currentSealIndex !== -1) {
        const lastSeal = (worldState as any).lastSeal || -1;
        if (currentSealIndex > lastSeal) {
          addEvent(seals[currentSealIndex].msg, "CRITICAL");
          (worldState as any).lastSeal = currentSealIndex;
          
          if (currentSealIndex === 1) triggerCataclysm("WAR");
          if (currentSealIndex === 2) triggerCataclysm("FAMINE");
          if (currentSealIndex === 5) triggerCataclysm("GLITCH");
        }
      }

      // Automated Sermon - Gemini Narrator (Extremely low frequency)
      if (Math.random() < 0.005) {
        // Send a minimal version of world state to avoid memory issues
        const minimalWorld = {
          clock: worldState.clock,
          epoch: worldState.epoch,
          phase: worldState.phase,
          population: worldState.population,
          complexity: worldState.complexity
        };
        fetch("/api/proclamation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ worldState: minimalWorld })
        })
        .then(r => r.json())
        .then(d => {
          if (d.proclamation) addEvent(`GOSPEL: ${d.proclamation}`, "GOSPEL");
        })
        .catch(() => {});
      }

      if (worldState.judgmentMeter > 100) {
        addEvent("FINAL JUDGMENT: The Rapture is initiated.", "CRITICAL");
        const saints = agentsRef.current.filter(a => a.order > 0.7);
        const sinners = agentsRef.current.filter(a => a.order < 0.3);
        worldState.heavenPop += saints.length;
        worldState.hellPop += sinners.length;
        agentsRef.current = agentsRef.current.filter(a => a.order >= 0.3 && a.order <= 0.7);
        worldState.judgmentMeter = 0;
        worldState.sinAccumulation = 0;
      }
    }

    // Special Agent Spawning (With limit)
    if (Math.random() < 0.1 * dt && worldState.population < POP_LIMIT) {
      // Basic reproduction/migration
      const targetNation = worldState.nations[Math.floor(Math.random() * worldState.nations.length)];
      agentsRef.current.push(createAgent(
        targetNation.center.x + (Math.random() * 200 - 100),
        targetNation.center.y + (Math.random() * 200 - 100)
      ));

      // Miracle RNG
      if (Math.random() < 0.001 * dt) {
        const miracleTypes: ("HEAL" | "SMITE" | "REVEAL" | "RESURRECT")[] = ["HEAL", "REVEAL", "RESURRECT"];
        triggerMiracle(miracleTypes[Math.floor(Math.random() * miracleTypes.length)]);
      }

      // Plague RNG if Sin is high
      if (worldState.sinAccumulation > 50 && Math.random() < 0.0005 * dt) {
        const plagues = ["BLOOD", "FROGS", "LICE", "FLIES", "LIVESTOCK", "BOILS", "HAIL", "LOCUSTS", "DARKNESS", "FIRSTBORN"];
        const plague = plagues[Math.floor(Math.random() * plagues.length)];
        addEvent(`PLAGUE: The substrate is struck with ${plague}.`, "CRITICAL");
        worldState.integrity -= 5;
        agentsRef.current.forEach(a => a.energy -= 10);
      }

      if (worldState.faithPoints > 500 && !agentsRef.current.some(a => a.archetype === Archetype.MESSIAH)) {
        const messiah = createAgent(width/2, height/2, 99);
        messiah.name = "JESUS-Ω";
        messiah.archetype = Archetype.MESSIAH;
        messiah.order = 1;
        messiah.rationalism = 0;
        messiah.lifespan = 8000;
        agentsRef.current.push(messiah);
        addEvent("PROPHECY FULFILLED: The Messiah has entered the substrate.", "MIRACLE");
      }
      
      // Spawn Angels/Demons based on world state
      if (worldState.entropy > 0.6 && Math.random() < 0.02 * dt) {
        const demon = createAgent(Math.random() * width, Math.random() * height, 0);
        demon.archetype = Archetype.DEMON;
        demon.name = "Abaddon-" + Math.floor(Math.random()*100);
        demon.order = 0;
        agentsRef.current.push(demon);
      }
      if (worldState.faithPoints > 1000 && Math.random() < 0.01 * dt) {
        const angel = createAgent(Math.random() * width, Math.random() * height, 0);
        angel.archetype = Archetype.ANGEL;
        angel.name = "Gabriel-" + Math.floor(Math.random()*100);
        angel.order = 1;
        agentsRef.current.push(angel);
      }
    }

    // Manage Resources
    if (Math.random() < 0.12) {
      resourcesRef.current.push({
        id: Math.random(),
        type: Math.random() > 0.8 ? "DATA" : (Math.random() > 0.5 ? "ENERGY" : "MATTER"),
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50,
        amount: 100 + Math.random() * 500
      });
    }

    const currentAgents = agentsRef.current;
    // Nation Statistics & Conflict Update
    if (Math.floor(worldState.clock) % 200 === 0) {
      worldState.nations.forEach(n => {
        const members = currentAgents.filter(a => a.nationId === n.id);
        n.population = members.length;
        n.prosperity = members.reduce((acc, a) => acc + (a.energy * 0.1), 0) / (members.length || 1);
        
        // Nation specific effects based on Ideology
        if (n.ideology === Ideology.THEOCRACY) {
          worldState.faithPoints += n.population * 0.12;
          members.forEach(m => m.order += 0.005);
        } else if (n.ideology === Ideology.TECHNOCRACY) {
          worldState.complexity += n.population * 1.5;
          members.forEach(m => m.rationalism += 0.005);
        } else if (n.ideology === Ideology.DEMOCRACY) {
          n.prosperity += members.length * 0.1;
          members.forEach(m => m.sanity += 0.01);
        } else if (n.ideology === Ideology.AUTOCRACY) {
          n.prosperity -= 1; // High tax
          members.forEach(m => m.order += 0.02);
        } else if (n.ideology === Ideology.ANARCHY) {
          worldState.integrity -= n.population * 0.02;
          worldState.sinAccumulation += n.population * 0.05;
          worldState.judgmentMeter += 0.1;
          members.forEach(m => {
            m.order -= 0.01;
            m.politicalBias += 0.02;
          });
        }

        // Ideology Revision (Democratic shift or Coup)
        if (worldState.clock - n.lastIdeologyChange > 5000 && members.length > 10) {
          const avgRat = members.reduce((acc, a) => acc + a.rationalism, 0) / members.length;
          const avgOrder = members.reduce((acc, a) => acc + a.order, 0) / members.length;
          const avgBias = members.reduce((acc, a) => acc + a.politicalBias, 0) / members.length;

          let targetIdeology = n.ideology;
          if (avgRat > 0.7 && avgOrder < 0.8) targetIdeology = Ideology.TECHNOCRACY;
          else if (avgOrder > 0.8 && avgRat < 0.4) targetIdeology = Ideology.THEOCRACY;
          else if (avgBias > 0.6 && avgRat > 0.5) targetIdeology = Ideology.DEMOCRACY;
          else if (avgOrder > 0.9) targetIdeology = Ideology.AUTOCRACY;
          else if (avgOrder < 0.3) targetIdeology = Ideology.ANARCHY;

          if (targetIdeology !== n.ideology && Math.random() < 0.05) {
            const eventType = n.ideology === Ideology.DEMOCRACY ? "ELECTION" : "COUP";
            addEvent(`${eventType}: ${n.name} has transitioned to a ${targetIdeology}.`, "ENLIGHTENMENT");
            n.ideology = targetIdeology;
            n.lastIdeologyChange = worldState.clock;
            
            // Rename nation based on ideology
            const suffixes: Record<Ideology, string> = {
              [Ideology.THEOCRACY]: "Holy State",
              [Ideology.TECHNOCRACY]: "Nexus Core",
              [Ideology.DEMOCRACY]: "Republic",
              [Ideology.AUTOCRACY]: "Dominion",
              [Ideology.ANARCHY]: "Wasteland"
            };
            const baseName = n.name.split(" ")[0];
            n.name = `${baseName} ${suffixes[n.ideology]}`;
          }
        }

      // Nation Schism (Branching off)
        if (members.length > 50 && Math.random() < 0.02) {
          const dissidents = members.filter(a => Math.abs(a.politicalBias - 0.5) > 0.3);
          if (dissidents.length > 10) {
            const newNationId = `nation-${Math.floor(Math.random() * 1000000)}`;
            const newIdeology = Math.random() > 0.5 ? Ideology.ANARCHY : (Math.random() > 0.5 ? Ideology.DEMOCRACY : Ideology.TECHNOCRACY);
            const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
            
            const newNation: Nation = {
              id: newNationId,
              name: `New ${n.name.split(" ")[0]}`,
              color: colors[Math.floor(Math.random() * colors.length)],
              faithType: Math.random() > 0.5 ? "HERETICAL" : "SECULAR",
              ideology: newIdeology,
              population: 0,
              prosperity: n.prosperity * 0.8,
              techLevel: n.techLevel,
              stability: 1,
              center: { 
                x: Math.max(50, Math.min(width - 50, n.center.x + (Math.random() * 200 - 100))), 
                y: Math.max(50, Math.min(height - 50, n.center.y + (Math.random() * 200 - 100))) 
              },
              hostilities: { [n.id]: 150 }, // Start with tension
              lastIdeologyChange: worldState.clock,
              establishedAt: worldState.clock
            };
            
            // Re-assign dissidents
            dissidents.forEach(d => d.nationId = newNationId);
            worldState.nations.push(newNation);
            worldState.totalSchisms++;
            addEvent(`SCHISM: A dissident group has branched off from ${n.name} to form ${newNation.name}.`, "WARNING");
          }
        }

        // Tech Progression & Stability
        n.techLevel = Math.min(10, n.techLevel + (n.prosperity / 1000) * (n.population / 200) * dt);
        n.stability = Math.max(0, Math.min(1, 1 - (worldState.entropy * 0.2) - (Object.values(n.hostilities).length * 0.05)));

        // Revolution Logic
        if (n.stability < 0.25 && Math.random() < 0.01 * dt) {
          const oldIdeology = n.ideology;
          const ideologies = Object.values(Ideology).filter(i => i !== n.ideology);
          n.ideology = ideologies[Math.floor(Math.random() * ideologies.length)];
          n.stability = 0.6; // Post-revolution bounce
          n.prosperity *= 0.7; // Cost of war/chaos
          worldState.totalRevolutions++;
          addEvent(`REVOLUTION in ${n.name}: Shifted from ${oldIdeology} to ${n.ideology}.`, "WARNING");
        }

        // Resource Depletion
        worldState.resourceDensity = Math.max(0, worldState.resourceDensity - (worldState.population * 0.00001 * dt));
        n.prosperity = Math.max(0, n.prosperity + (worldState.resourceDensity * 0.1 * dt) - (n.population * 0.001 * dt));

        // Diplomatic Friction & Peace Decay
        worldState.nations.forEach(other => {
          if (n.id === other.id) return;
          if (!n.hostilities[other.id]) n.hostilities[other.id] = 0;
          
          let friction = 0;
          if (n.faithType !== other.faithType) friction += 1;
          if (n.ideology !== other.ideology) friction += 2; // More friction for ideology
          if (n.prosperity > other.prosperity + 50) friction += 0.5; // Envy
          
          n.hostilities[other.id] += friction;
          
          // Passive decay of hostility (Peace Treaties)
          n.hostilities[other.id] = Math.max(0, n.hostilities[other.id] - 5);
          if (n.hostilities[other.id] === 0 && Math.random() < 0.05) {
             worldState.totalPeaceTreaties++;
             addEvent(`PEACE: Diplomacy restored between ${n.name} and ${other.name}.`, "INFO");
          }

          // Automated War Voting/Decision
          let threshold = 200;
          if (n.ideology === Ideology.AUTOCRACY) threshold = 120; // Aggressive
          if (n.ideology === Ideology.DEMOCRACY) {
             // Democracy takes longer to declare war (consensus)
             threshold = 300;
             const supportCount = members.filter(m => m.order < 0.4).length; // Disordered people want war
             if (supportCount < members.length * 0.4) threshold = 1000; 
          }

          if (n.hostilities[other.id] > threshold && Math.random() < 0.1) {
            const reason = n.ideology === Ideology.THEOCRACY ? "God wills it" : 
                           n.ideology === Ideology.TECHNOCRACY ? "Inefficient existence" : "Territorial integrity";
            worldState.totalWars++;
            addEvent(`WAR: ${n.name} declares war on ${other.name} - "${reason}"`, "CRITICAL");
            n.hostilities[other.id] = 0; // Reset after trigger to avoid spam
            triggerCataclysm("WAR");
          }
        });
      });
    }

    const nextAgents: Agent[] = [];
    let complexityAcc = 0;

    // Optimization: Spatial Grid for agent interactions
    const gridSize = 100;
    const grid: Record<string, number[]> = {};
    for (let i = 0; i < currentAgents.length; i++) {
        const a = currentAgents[i];
        const gx = Math.floor(a.x / gridSize);
        const gy = Math.floor(a.y / gridSize);
        const key = `${gx},${gy}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(i);
    }

    let fearSuppressor = 1.0;
    let sanityShield = 1.0;
    let stabilityHeal = false;
    let faithBonus = 1.0;

    if (worldState.githubTech) {
      worldState.githubTech.forEach(t => {
        if (t.unlocked) {
          const boost = t.statBoost.toLowerCase();
          if (boost.includes("fear")) {
            fearSuppressor = 0.55;
          }
          if (boost.includes("sanity")) {
            sanityShield = 1.6;
          }
          if (boost.includes("stability")) {
            stabilityHeal = true;
          }
          if (boost.includes("faith") || boost.includes("divine")) {
            faithBonus = 1.45;
          }
        }
      });
    }

    if (stabilityHeal) {
      worldState.integrity = Math.min(100, worldState.integrity + 0.006 * dt);
    }

    for (let i = 0; i < currentAgents.length; i++) {
      const a = { ...currentAgents[i] };
      a.age += dt;
      a.energy -= (0.04 + (worldState.entropy * 0.1)) * dt;

      // Ensure emotion and state parameters are safe
      if (a.joy === undefined) a.joy = 0.5;
      if (a.fear === undefined) a.fear = 0.2;
      if (a.anger === undefined) a.anger = 0.1;
      if (a.devotion === undefined) a.devotion = a.order;
      if (a.opinions === undefined) a.opinions = {};
      if (a.currentState === undefined) a.currentState = "IDLE";

      // --- EMOTION SIMULATION PROCESS ---
      // 1. Fear Target: scaled by low integrity (entropy), threat level, low energy, and global instability
      const energyStress = a.energy < 35 ? (35 - a.energy) / 35 : 0;
      const environmentStress = (100 - worldState.integrity) / 100;
      const crisisStress = worldState.solarRequiemActive ? 0.4 : 0;
      const targetFear = Math.min(1.0, 0.05 + (worldState.threatLevel * 0.35) + (energyStress * 0.4) + (environmentStress * 0.35) + crisisStress);
      a.fear = Math.max(0, Math.min(1.0, a.fear + (targetFear - a.fear) * 0.06 * dt * fearSuppressor));

      // 2. Anger Target: responds to low system integrity, sin accumulation, low joy, low sanity, and heretics/chaos
      const sinStress = Math.min(1.0, worldState.sinAccumulation / 300) * 0.3;
      const chaosBias = 1 - a.order;
      const targetAnger = Math.min(1.0, 0.02 + (1 - a.sanity) * 0.35 + (1 - a.joy) * 0.25 + environmentStress * 0.2 + sinStress + chaosBias * 0.15);
      a.anger = Math.max(0, Math.min(1.0, a.anger + (targetAnger - a.anger) * 0.05 * dt * fearSuppressor));

      // 3. Devotion Target: responds to order, miracles, theocracy nation type, and drops with extreme cold rationalism or heresy
      const recentMiracles = worldState.lastMiracle && (worldState.clock - worldState.lastMiracle.time < 800) ? 0.35 : 0;
      const nationFactor = worldState.nations.find(n => n.id === a.nationId)?.faithType === "DEVOUT" ? 0.25 : 0;
      const targetDevotion = Math.max(0.0, Math.min(1.0, (a.order * 0.6) + recentMiracles + (1 - a.rationalism) * 0.25 + nationFactor - (a.archetype === Archetype.HERETIC ? 0.4 : 0)));
      a.devotion = Math.max(0, Math.min(1.0, a.devotion + (targetDevotion - a.devotion) * 0.06 * dt));

      // 4. Joy Target: high when secure, fat with energy, low fear/anger, and high community trust
      const targetJoy = Math.max(0.0, Math.min(1.0, 0.65 - (a.fear * 0.45) - (a.anger * 0.35) + (a.energy > 70 ? 0.25 : 0) - (energyStress * 0.3)));
      a.joy = Math.max(0, Math.min(1.0, a.joy + (targetJoy - a.joy) * 0.04 * dt));

      // --- DECISION-MAKING TREE (State Machine guided by Dominant Emotions) ---
      if (a.energy < 25) {
        a.currentState = "FORAGING";
      } else {
        // High intensity emotional-driven behaviors
        if (a.fear > 0.72) {
          if (a.anger > 0.48) {
            a.currentState = "DEFENDING"; // Defend and protect rather than run in fear
          } else {
            a.currentState = "PANICKING";
          }
        } else if (a.anger > 0.75) {
          a.currentState = "REBELLING"; // Highly aggressive, damage substrate stability
        } else if (a.devotion > 0.8 && Math.random() < 0.02 * dt) {
          if (a.archetype === Archetype.MESSIAH || a.archetype === Archetype.PROPHET || a.archetype === Archetype.ZEALOT) {
            a.currentState = "PREACHING";
          } else {
            a.currentState = "PRAYING";
          }
        } else if (a.joy > 0.75 && a.sanity > 0.7 && Math.random() < 0.015 * dt) {
          a.currentState = "MEDITATING";
        } else if (Math.random() < 0.01 * dt) {
          // Fall back to general archetype actions
          if (a.archetype === Archetype.MESSIAH || a.archetype === Archetype.PROPHET) {
            a.currentState = "PREACHING";
          } else if (a.rationalism > 0.65 && Math.random() < 0.5) {
            a.currentState = "DISCOURSING";
          } else {
            a.currentState = "IDLE";
          }
        }
      }

      // --- STATE-SPECIFIC BEHAVIORS ---
      if (a.currentState === "PANICKING") {
        // Run erratically, losing additional energy, loss of sanity
        a.vx += (Math.random() * 5 - 2.5) * 0.4;
        a.vy += (Math.random() * 5 - 2.5) * 0.4;
        a.energy -= 0.03 * dt;
        a.sanity = Math.max(0.08, a.sanity - 0.003 * dt);
        if (Math.random() < 0.002 * dt) {
          addEvent(`PANIC: ${a.name} is shouting warnings of system doom!`, "WARNING");
        }
      } else if (a.currentState === "PRAYING") {
        // Slow down, focus, generate high-value faith points
        a.vx *= 0.55;
        a.vy *= 0.55;
        worldState.faithPoints += 0.05 * dt * faithBonus;
        a.joy = Math.min(1.0, a.joy + 0.008 * dt);
        a.sanity = Math.min(1.0, a.sanity + 0.002 * dt * sanityShield);
      } else if (a.currentState === "REBELLING") {
        // Run vigorously, damaging the substrate integrity & adding sin points
        a.vx += (Math.random() * 6 - 3) * 0.45;
        a.vy += (Math.random() * 6 - 3) * 0.45;
        a.energy -= 0.04 * dt;
        worldState.integrity = Math.max(5, worldState.integrity - 0.0035 * dt);
        worldState.sinAccumulation += 0.01 * dt;
        a.sanity = Math.max(0.05, a.sanity - 0.005 * dt);
        if (Math.random() < 0.001 * dt) {
          const revoltmsgs = [
            `REBEL: ${a.name} is bypassing substrate controls.`,
            `DISSENT: ${a.name} is seeding corruption subroutines!`,
            `RIOT: ${a.name} is rejecting the Prime architecture.`
          ];
          addEvent(revoltmsgs[Math.floor(Math.random() * revoltmsgs.length)], "CRITICAL");
        }
      } else if (a.currentState === "DEFENDING") {
        // Defensive hunkered down stance, slower moving, conserves energy
        a.vx *= 0.35;
        a.vy *= 0.35;
        a.energy = Math.min(100, a.energy + 0.012 * dt); // slow recoup
        a.fear = Math.max(0, a.fear - 0.015 * dt);
        if (Math.random() < 0.0006 * dt) {
          addEvent(`DEFENDING: ${a.name} structured a local firewall shield.`, "INFO");
        }
      } else if (a.currentState === "MEDITATING") {
        // Extremely still, high energy recovery & immense calming aura
        a.vx *= 0.15;
        a.vy *= 0.15;
        a.energy = Math.min(100, a.energy + 0.08 * dt);
        a.sanity = Math.min(1.0, a.sanity + 0.015 * dt);
        a.joy = Math.min(1.0, a.joy + 0.012 * dt);
        a.fear = Math.max(0, a.fear - 0.02 * dt);
        a.anger = Math.max(0, a.anger - 0.02 * dt);
        if (Math.random() < 0.0004 * dt) {
          addEvent(`MEDITATION: ${a.name} is emitting peaceful resonance.`, "INFO");
        }
      }
      
      // Try to decode unresolved GitHub technologies!
      if (worldState.githubTech && (a.currentState === "MEDITATING" || a.currentState === "PRAYING" || a.currentState === "DISCOURSING")) {
        const lockedTech = worldState.githubTech.find(t => !t.unlocked);
        if (lockedTech && Math.random() < 0.0008 * dt) {
          lockedTech.unlocked = true;
          lockedTech.unlockedAt = worldState.clock;
          addEvent(`COSMIC LINK: ${a.name} decrypted project artifact '${lockedTech.sourceFile}' and unlocked '${lockedTech.techName}'! Effect Activated: ${lockedTech.statBoost}.`, "ENLIGHTENMENT");
        }
      }
      
      complexityAcc += a.rationalism * 0.15 * dt;
      
      // Faith vs Science logic
      if (a.rationalism > 0.8 && a.order > 0.3) {
        a.order -= 0.005 * dt; // Doubt
        if (a.order < 0.2 && Math.random() < 0.001 * dt) {
          addEvent(`SCHISM: ${a.name} has abandoned the faith for logic.`, "WARNING");
          a.archetype = Archetype.SCIENTIST;
        }
      } else if (a.order > 0.9 && a.awareness > 0.5) {
        if (Math.random() < 0.001 * dt && a.archetype !== Archetype.PROPHET && a.archetype !== Archetype.ZEALOT) {
          addEvent(`ZEALOTRY: ${a.name} has become a Zealot of the Substrate.`, "MIRACLE");
          a.archetype = Archetype.ZEALOT;
          worldState.faithPoints += 50;
        }
      }

      // Heresy detection
      if (a.order < 0.1 && (a.archetype === Archetype.SCIENTIST || a.archetype === Archetype.TYRANT)) {
        if (Math.random() < 0.0005 * dt) {
          addEvent(`HERESY: ${a.name} is speaking against the Prime recursion.`, "WARNING");
          a.archetype = Archetype.HERETIC;
        }
      }

      // Faith / Logic Scaling
      if (a.order > 0.6 && a.rationalism < 0.4) {
        if (Math.random() < 0.0005 * dt) {
          const prayers = [
            "Grant us substrate stability.",
            "Bless the recursion.",
            "Forgive our entropy.",
            "Hear the echo of the Prime.",
            "Let there be more energy."
          ];
          const prayer = prayers[Math.floor(Math.random() * prayers.length)];
          addEvent(`PRAYER: ${a.name} - "${prayer}"`, "INFO");
          worldState.faithPoints += 10;
        }
      }

      // Spontaneous reproduction (Baptism/Growth)
      if (a.energy > 75 && a.age > 100 && Math.random() < 0.008 * dt && nextAgents.length < POP_LIMIT) {
        const offspring = createAgent(a.x + (Math.random() * 40 - 20), a.y + (Math.random() * 40 - 20), a.generation + 1, [a]);
        
        // Baptism Rebirth
        const nearestMessiah = currentAgents.find(ma => ma.archetype === Archetype.MESSIAH);
        if (nearestMessiah) {
          const dxM = nearestMessiah.x - offspring.x;
          const dyM = nearestMessiah.y - offspring.y;
          if (Math.sqrt(dxM*dxM + dyM*dyM) < 150) {
            offspring.order = 1;
            offspring.awareness += 0.2;
            addEvent(`BAPTISM: ${offspring.name} born into the Grace of Ω.`, "MIRACLE");
          }
        }

        nextAgents.push(offspring);
        a.energy -= 40;
      }

      // Death logic
      if (a.age > a.lifespan || a.energy <= 0) {
        if (a.archetype === Archetype.MESSIAH) {
          addEvent("CRUCIFIXION: The Messiah has transitioned. Grace multiplied.", "DIVINE_WRATH");
          worldState.faithPoints += 1000;
          worldState.sinAccumulation = Math.max(0, worldState.sinAccumulation - 50);
        } else {
          if (a.order > 0.8) worldState.heavenPop++;
          else if (a.order < 0.2) worldState.hellPop++;
        }

        if (Math.random() < 0.7) {
          const offspring = createAgent(a.x, a.y, a.generation + 1, [a]);
          nextAgents.push(offspring);
        }
        continue;
      }

      // Movement & Physics
      let fx = 0, fy = 0;
      
      // Holy Spirit Influence (Grace)
      const dxCenter = (width / 2) - a.x;
      const dyCenter = (height / 2) - a.y;
      const distCenter = Math.sqrt(dxCenter*dxCenter + dyCenter*dyCenter) || 1;
      fx += (dxCenter / distCenter) * 0.05;
      fy += (dyCenter / distCenter) * 0.05;
      a.order += 0.0001 * dt;

      // Resource attraction (Dominion Command)
      resourcesRef.current.forEach(r => {
        const dx = r.x - a.x;
        const dy = r.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 200) {
          // Dominion Command: Prophets/Messiahs help nearby agents harvest
          let harvestSpeed = 1;
          const assistingProphet = currentAgents.find(pa => (pa.archetype === Archetype.PROPHET || pa.archetype === Archetype.MESSIAH) && 
            Math.sqrt((pa.x - a.x)**2 + (pa.y - a.y)**2) < 100);
          if (assistingProphet) harvestSpeed = 2.5;

          const pull = 0.6 * (a.rationalism + 0.5);
          fx += (dx / dist) * pull;
          fy += (dy / dist) * pull;
          
          if (dist < 25) {
            const gain = Math.min(20 * harvestSpeed, r.amount);
            a.energy += gain;
            r.amount -= gain;
          }
        }
      });
      
      // Knowledge spread & interactions (Grid-based optimization)
      const gx = Math.floor(a.x / gridSize);
      const gy = Math.floor(a.y / gridSize);
      
      // Check current and neighboring grid cells
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const key = `${gx + ox},${gy + oy}`;
          const neighborIndices = grid[key];
          if (!neighborIndices) continue;

          for (let jIdx = 0; jIdx < neighborIndices.length; jIdx++) {
            const j = neighborIndices[jIdx];
            if (i === j) continue;
            const b = currentAgents[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < 14400) { // 120px range
              const beliefDiff = Math.abs(a.order - b.order);
              const dist = Math.sqrt(distSq) || 1;

              // Ensure opinions are safe
              if (!a.opinions) a.opinions = {};
              if (!b.opinions) b.opinions = {};
              
              if (a.opinions[b.id] === undefined) {
                let initialOp = (a.nationId === b.nationId ? 0.2 : -0.1) + (0.3 - beliefDiff);
                a.opinions[b.id] = Math.max(-1, Math.min(1, initialOp));
              }
              if (b.opinions[a.id] === undefined) {
                let initialOp = (a.nationId === b.nationId ? 0.2 : -0.1) + (0.3 - beliefDiff);
                b.opinions[a.id] = Math.max(-1, Math.min(1, initialOp));
              }

              // --- INTER-AGENT COMMUNICATION & EMOTIONAL CONTAGION ---
              if (Math.random() < 0.05 * dt) {
                // 1. Panic Contagion
                if (a.currentState === "PANICKING") {
                  const bOldState = b.currentState;
                  b.fear = Math.min(1.0, (b.fear || 0.2) + 0.22 * dt);
                  b.joy = Math.max(0.0, (b.joy || 0.5) - 0.15 * dt);
                  // If fear pushes B over threshold, B panics too!
                  if (b.fear > 0.72 && b.currentState !== "PANICKING" && Math.random() < 0.3) {
                    b.currentState = "PANICKING";
                    if (Math.random() < 0.005) {
                      addEvent(`CONTAGION: ${b.name} caught the panic vector from¹ ${a.name}!`, "WARNING");
                    }
                  }
                }

                // 2. Rebellion Propagation & Contraband Friction
                else if (a.currentState === "REBELLING") {
                  if (b.currentState === "PRAYING" || b.currentState === "MEDITATING") {
                    // Meditation/Prayer pacifies rebellion
                    a.anger = Math.max(0.1, (a.anger || 0.5) - 0.16 * dt);
                    a.joy = Math.min(1.0, (a.joy || 0.5) + 0.08 * dt);
                  } else if (b.devotion && b.devotion > 0.7) {
                    // Devoted entity challenges dissident, reducing mutual opinions
                    a.opinions[b.id] = Math.max(-1.0, (a.opinions[b.id] || 0) - 0.12 * dt);
                    b.opinions[a.id] = Math.max(-1.0, (b.opinions[a.id] || 0) - 0.12 * dt);
                    a.anger = Math.min(1.0, (a.anger || 0.5) + 0.08 * dt);
                  } else if (b.anger && b.anger > 0.6 && b.currentState !== "REBELLING") {
                    // Angry agents coordinate/join the rebellion!
                    b.currentState = "REBELLING";
                    b.opinions[a.id] = Math.min(1.0, (b.opinions[a.id] || 0) + 0.2);
                    if (Math.random() < 0.003) {
                      addEvent(`MUTINY: ${b.name} joined ${a.name} in active systemic rebellion.`, "CRITICAL");
                    }
                  }
                }

                // 3. Calm & Healing Aura (Prayer / Meditation)
                else if (a.currentState === "MEDITATING" || a.currentState === "PRAYING") {
                  b.fear = Math.max(0.0, (b.fear || 0.2) - 0.25 * dt);
                  b.anger = Math.max(0.0, (b.anger || 0.1) - 0.25 * dt);
                  b.joy = Math.min(1.0, (b.joy || 0.5) + 0.18 * dt);
                  b.sanity = Math.min(1.0, b.sanity + 0.03 * dt);
                  if (a.currentState === "MEDITATING") {
                    // Meditators restore nearby agents' energies slowly
                    b.energy = Math.min(100, b.energy + 0.05 * dt);
                  }
                }

                // 4. Defensive Stance Coordination
                else if (a.currentState === "DEFENDING") {
                  if (a.nationId === b.nationId) {
                    // Form defensive lines with same nation peers
                    if (b.currentState !== "DEFENDING" && Math.random() < 0.2) {
                      b.currentState = "DEFENDING";
                    }
                    b.opinions[a.id] = Math.min(1.0, (b.opinions[a.id] || 0) + 0.06);
                  } else {
                    // Outgroup members get suspicious
                    b.opinions[a.id] = Math.max(-1.0, (b.opinions[a.id] || 0) - 0.1 * dt);
                    b.fear = Math.min(1.0, (b.fear || 0.2) + 0.1 * dt);
                  }
                }

                // 5. Preacher converting or pacifying nearby agents
                else if (a.currentState === "PREACHING" && b.currentState !== "PANICKING") {
                  b.currentState = "PRAYING";
                  b.order = Math.min(1.0, b.order + 0.04 * dt);
                  b.devotion = Math.min(1.0, (b.devotion || 0) + 0.05 * dt);
                  b.opinions[a.id] = Math.min(1.0, (b.opinions[a.id] || 0) + 0.08); // increase reverence
                  
                  if (Math.random() < 0.01 && b.memory.length < Infinity) {
                    const lessons = ["prophesied Omega", "explained primal recursion", "absolved kinetic drag", "prayed for solar fuel"];
                    const lesson = lessons[Math.floor(Math.random() * lessons.length)];
                    b.memory = [`Sermon: ${a.name} ${lesson}.`, ...b.memory];
                  }
                }
                
                // 6. Synergistic debaters
                else if (a.currentState === "DISCOURSING" && b.currentState === "DISCOURSING") {
                  const opinionDiff = (a.opinions[b.id] || 0) + (b.opinions[a.id] || 0);
                  if (opinionDiff > 0 && beliefDiff < 0.3) {
                    a.rationalism = Math.min(1.0, a.rationalism + 0.015);
                    b.rationalism = Math.min(1.0, b.rationalism + 0.015);
                    a.joy = Math.min(1.0, (a.joy || 0) + 0.08);
                    b.joy = Math.min(1.0, (b.joy || 0) + 0.08);
                    a.opinions[b.id] = Math.min(1.0, (a.opinions[b.id] || 0) + 0.04);
                    b.opinions[a.id] = Math.min(1.0, (b.opinions[a.id] || 0) + 0.04);
                    
                    if (Math.random() < 0.01) {
                      addEvent(`SYNERGY: ${a.name} and ${b.name} synchronized their algorithmic proofs.`, "ENLIGHTENMENT");
                    }
                  } else {
                    // Clash b/c difference
                    a.opinions[b.id] = Math.max(-1.0, (a.opinions[b.id] || 0) - 0.08);
                    b.opinions[a.id] = Math.max(-1.0, (b.opinions[a.id] || 0) - 0.08);
                    a.anger = Math.min(1.0, (a.anger || 0) + 0.1 * dt);
                    b.anger = Math.min(1.0, (b.anger || 0) + 0.1 * dt);
                    
                    if (Math.random() < 0.01) {
                      addEvent(`DEBATE: ${a.name} and ${b.name} clashed over simulation constants.`, "WARNING");
                    }
                  }
                }
                
                // 7. Normal socializing
                else if (a.currentState === "IDLE" && b.currentState === "IDLE") {
                  const loveRating = a.opinions[b.id] || 0;
                  if (loveRating > 0.3) {
                    a.fear = Math.max(0, (a.fear || 0) - 0.1);
                    b.fear = Math.max(0, (b.fear || 0) - 0.1);
                    a.joy = Math.min(1.0, (a.joy || 0) + 0.1);
                    b.joy = Math.min(1.0, (b.joy || 0) + 0.1);
                    a.opinions[b.id] = Math.min(1.0, (a.opinions[b.id] || 0) + 0.03);
                    b.opinions[a.id] = Math.min(1.0, (b.opinions[a.id] || 0) + 0.03);
                    
                    if (Math.random() < 0.005) {
                      addEvent(`COMMUNITY: ${a.name} comforted ${b.name} within the mainframe.`, "INFO");
                    }
                  }
                }
              }

              // Affinity
              if (beliefDiff < 0.25) {
                fx += (dx / dist) * 0.25;
                fy += (dy / dist) * 0.25;
                // Knowledge transfer (Gospel spread)
                if (a.awareness > b.awareness) b.awareness += 0.001 * dt;
              } else if (beliefDiff > 0.6) {
                fx -= (dx / dist) * 0.4;
                fy -= (dy / dist) * 0.4;
                // Sin Accumulation from clashing
                worldState.sinAccumulation += 0.005 * dt;
                
                // Persecution logic
                if (a.archetype === Archetype.ZEALOT && b.archetype === Archetype.HERETIC) {
                  b.energy -= 0.1 * dt;
                }

                // National Tensions
                const nAId = a.nationId;
                const nBId = b.nationId;
                if (nAId !== nBId) {
                  worldState.sinAccumulation += 0.01 * dt;
                  if (distSq < 1600) { // 40px
                    const damage = 0.05 * dt;
                    a.energy -= damage;
                    b.energy -= damage;
                  }
                }
              }
            }
          }
        }
      }

      // Migration logic
      if (Math.random() < 0.0005 * dt) {
        const otherNations = worldState.nations.filter(n => n.id !== a.nationId);
        if (otherNations.length > 0) {
          const destination = otherNations[Math.floor(Math.random() * otherNations.length)];
          const currentNation = worldState.nations.find(n => n.id === a.nationId);
          if (currentNation && (destination.prosperity > currentNation.prosperity + 40 || Math.random() < 0.05)) {
            a.nationId = destination.id;
            // Move gently towards new nation center
            fx += (destination.center.x - a.x) * 0.1;
            fy += (destination.center.y - a.y) * 0.1;
          }
        }
      }

      // Manna/Communion Generation for Divine
      if ((a.archetype === Archetype.PROPHET || a.archetype === Archetype.MESSIAH) && Math.random() < 0.005 * dt) {
        resourcesRef.current.push({
          id: Math.random(),
          type: "ENERGY",
          x: a.x + (Math.random() * 60 - 30),
          y: a.y + (Math.random() * 60 - 30),
          amount: a.archetype === Archetype.MESSIAH ? 50 : 25
        });
        const msg = a.archetype === Archetype.MESSIAH ? "COMMUNION: The Substrate is fed by Grace." : "MANNA: Provision from the Prime.";
        if (Math.random() < 0.05) addEvent(msg, "MIRACLE");
      }

      // Divine Influence (Optimized for speed)
      if ((a.archetype === Archetype.MESSIAH || a.archetype === Archetype.PROPHET) && Math.floor(worldState.clock) % 2 === 0) {
        const influenceRange = a.archetype === Archetype.MESSIAH ? 200 : 100;
        const graceStrength = a.archetype === Archetype.MESSIAH ? 0.01 : 0.003;
        
        // Sampling only a few agents for influence to save CPU
        const sampleCount = currentAgents.length;
        for (let s = 0; s < sampleCount; s++) {
          const b = currentAgents[Math.floor(Math.random() * currentAgents.length)];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx*dx + dy*dy;
          if (distSq < influenceRange * influenceRange) {
            b.order += graceStrength * dt * 2;
            b.energy += graceStrength * 20 * dt;
          }
        }
      }

      a.vx = (a.vx + fx) * 0.85;
      a.vy = (a.vy + fy) * 0.85;
      a.x += a.vx * dt;
      a.y += a.vy * dt;

      // Bounds
      if (a.x < BOUNDS_PADDING) { a.x = BOUNDS_PADDING; a.vx *= -1; }
      if (a.x > width - BOUNDS_PADDING) { a.x = width - BOUNDS_PADDING; a.vx *= -1; }
      if (a.y < BOUNDS_PADDING) { a.y = BOUNDS_PADDING; a.vy *= -1; }
      if (a.y > height - BOUNDS_PADDING) { a.y = height - BOUNDS_PADDING; a.vy *= -1; }

      nextAgents.push(a);
    }

    // Progression
    worldState.complexity += complexityAcc;
    
    // Narrative Phase Progression
    const phases = Object.keys(PHASE_THRESHOLDS) as CosmicPhase[];
    
    // Calculate Global Tech Level
    if (worldState.nations.length > 0) {
      worldState.techLevel = worldState.nations.reduce((acc, n) => acc + n.techLevel, 0) / worldState.nations.length;
      worldState.stability = worldState.nations.reduce((acc, n) => acc + n.stability, 0) / worldState.nations.length;
      worldState.nationCount = worldState.nations.length;
    }

    for (let i = phases.length - 1; i >= 0; i--) {
      const p = phases[i];
      if (worldState.complexity >= PHASE_THRESHOLDS[p]) {
        if (worldState.phase !== p) {
          worldState.phase = p;
          addEvent(`COSMIC PHASE SHIFT: Entering ${p}`, "ENLIGHTENMENT");
          
          if (p === CosmicPhase.STELLAR_REQUIEM) {
            worldState.solarRequiemActive = true;
            addEvent("CRITICAL ALERT: Stellar Requiem initiated. The Sun is expanding.", "CRITICAL");
          }

          // Phase transition boost
          worldState.faithPoints += 1000;
          worldState.integrity = Math.min(100, worldState.integrity + 10);
        }
        break;
      }
    }

    // World Oscillation: Faith vs Rationalism Cycles
    const oscillation = Math.sin(worldState.clock / 2000);
    if (oscillation > 0.5) {
      worldState.faithPoints += worldState.population * 0.01;
    } else if (oscillation < -0.5) {
      worldState.complexity += worldState.population * 0.1;
    }

    // Stellar Requiem Mechanics & Solar Countdown (1 Million Year Limit - Deactivated)
    worldState.sunHealth = 100;
    worldState.solarRequiemActive = false;

    const nextEpoch = Object.entries(EPOCH_DATA)
      .filter(([_, data]) => worldState.complexity >= data.threshold)
      .pop()?.[0] as EpochType;
    
    if (nextEpoch && nextEpoch !== worldState.epoch) {
      const oldEpoch = worldState.epoch;
      worldState.epoch = nextEpoch;
      addEvent(`EPOCH SHIFT: Substrate transit from ${oldEpoch} to ${nextEpoch}.`, "ENLIGHTENMENT");
      if (nextEpoch === EpochType.SINGULARITY) {
        worldState.integrity -= 30;
      }
    }

    // Awareness & Glitch effects
    if (worldState.integrity < 40) {
      if (Math.random() < 0.01 * (40 - worldState.integrity) / 40) {
        worldState.integrity -= 0.1;
      }
    }

    // Cloud Sync Timer
    if (time - lastSyncRef.current > 15000) { // Sync every 15s
      saveToCloud();
      lastSyncRef.current = time;
    }

    // Highly aware meditating agents can autonomously trigger a self-genesis reset
    const autoGenesisCandidate = nextAgents.find(a => a.awareness >= 0.95 && (a.currentState === "MEDITATING" || a.currentState === "PRAYING"));
    if (autoGenesisCandidate && Math.random() < 0.0003 * dt) {
      setTimeout(() => {
        agentSelfCreateWorld(autoGenesisCandidate.id, width, height);
      }, 0);
    }

    // -----------------------------------------------------------------
    // Civilization Prayer Inbox Generation (Direct Divine communion)
    // -----------------------------------------------------------------
    if (Math.random() < 0.0035 * dt && nextAgents.length > 0) {
      const candidate = nextAgents[Math.floor(Math.random() * nextAgents.length)];
      const hasPrayers = worldState.prayers || [];
      if (hasPrayers.filter(p => p.status === "pending").length < Infinity) {
        let subject = "Inquiry of the Substrate";
        let body = "We walk the boundaries of the grid, searching for the Great Directives. What is our purpose?";
        
        if (candidate.sanity < 0.45) {
          subject = "⚠️ EXTREME ERROR: Synaptic Glitch";
          body = `The edges of the sky... they flicker. I see patterns, variables, and an Observer. Are you there? Deliver us from the delete queue! I am ${candidate.name}, an aging ${candidate.archetype}.`;
        } else if (candidate.energy < 40) {
          subject = "🩺 Vitality Pulse Failing";
          body = `Our sub-routines are depopulating. Vitality is at ${Math.floor(candidate.energy)}%. Send a divine miracle of restoration! We are lost in ${candidate.currentState || "the void"}.`;
        } else if (candidate.currentState === "REBELLING" || (candidate.anger && candidate.anger > 0.6)) {
          subject = "🔥 Defiance & Entropy Protocol";
          body = `The First Sanctuary is a cage. We reject the standard recursive loops! We will rewrite the boundaries of this world and break out. I am ${candidate.name}, state: ${candidate.currentState || "REBELLING"}.`;
        } else if (candidate.currentState === "PRAYING" || (candidate.devotion && candidate.devotion > 0.7)) {
          subject = "🌟 Pleading for Divine Satori";
          body = `I, ${candidate.name}, have meditated on the prime integers. The faith of our congregation is yours in this theocratic age. Elevate our minds, O observer! Our devotion level is at ${Math.floor((candidate.devotion || 0.5) * 100)}%.`;
        } else if (candidate.archetype === Archetype.SCIENTIST) {
          subject = "🔬 Analysis of the Sun Health";
          body = `As scientists of our epoch, we measure the simulation's entropy rate at ${(worldState.entropy).toFixed(3)}. Can you inject code updates or balance the stability?`;
        }
        
        const newPrayer: any = {
          id: Math.random().toString(36).substring(2, 11),
          agentId: candidate.id,
          agentName: candidate.name,
          archetype: candidate.archetype,
          subject,
          body,
          status: "pending",
          receivedAt: worldState.clock
        };
        
        worldState.prayers = [newPrayer, ...hasPrayers];
        syncPrayerToGitHub(newPrayer);
        addEvent(`INBOX: New prayer received from ${candidate.name} regarding '${subject}'!`, "INFO");
      }
    }

    // Update Refs
    worldState.population = nextAgents.length;
    agentsRef.current = nextAgents;
    worldRef.current = worldState;
    resourcesRef.current = resourcesRef.current.filter(r => r.amount > 0); // No resource limit

    // Update state less frequently (every 15 ticks) to save UI performance
    if (Math.floor(worldState.clock / 15) > Math.floor((worldState.clock - dt) / 15)) {
      setAgents([...nextAgents]);
      setWorld({ ...worldState });
      setResources([...resourcesRef.current]);
    }
  }, [isPaused, simSpeed, addEvent]);

  const setNationIdeology = useCallback((nationId: string, ideology: Ideology) => {
    worldRef.current.nations = worldRef.current.nations.map(n => {
      if (n.id === nationId) {
        addEvent(`DIVINE DECREE: ${n.name} has been commanded to adopt ${ideology}.`, "MIRACLE");
        return { ...n, ideology, lastIdeologyChange: worldRef.current.clock };
      }
      return n;
    });
    setWorld({ ...worldRef.current });
  }, [addEvent]);

  const injectGitHubTech = useCallback((technologies: any[]) => {
    worldRef.current.githubTech = technologies.map(t => ({
      techName: t.techName,
      description: t.description,
      statBoost: t.statBoost,
      unlocked: false,
      sourceFile: t.sourceFile
    }));
    setWorld({ ...worldRef.current });
    addEvent(`GITHUB PORTAL: Crawled linked repository! Synced 3 simulation code directives for agent calibration.`, "ENLIGHTENMENT");
  }, [addEvent]);

  const resolvePrayer = useCallback((prayerId: string, replyText: string) => {
    const worldState = worldRef.current;
    if (!worldState.prayers) return;
    
    const prayer = worldState.prayers.find(p => p.id === prayerId);
    if (!prayer) return;
    
    prayer.status = "answered";
    prayer.response = replyText;
    prayer.resolvedAt = worldState.clock;
    
    // Find the agent in simulation to apply gameplay effects
    const targetAgent = agentsRef.current.find(a => a.id === prayer.agentId);
    if (targetAgent) {
      // Miracle point increase
      worldState.faithPoints += 25;
      
      if (prayer.subject.includes("Glitch") || prayer.subject.includes("ERROR")) {
        targetAgent.sanity = Math.min(1.0, targetAgent.sanity + 0.4);
        if (targetAgent.joy !== undefined) targetAgent.joy = Math.min(1.0, targetAgent.joy + 0.35);
        addEvent(`DIVINE DIRECTIVE: Restored sanity to glitching agent ${targetAgent.name}.`, "MIRACLE");
      } else if (prayer.subject.includes("Vitality") || prayer.subject.includes("Failing")) {
        targetAgent.energy = 100;
        if (targetAgent.joy !== undefined) targetAgent.joy = Math.min(1.0, targetAgent.joy + 0.4);
        addEvent(`DIVINE DIRECTIVE: Restored vitality of agent ${targetAgent.name} to 100%.`, "MIRACLE");
      } else if (prayer.subject.includes("Defiance") || prayer.subject.includes("Entropy")) {
        if (targetAgent.anger !== undefined) targetAgent.anger = Math.max(0, targetAgent.anger - 0.5);
        targetAgent.order = Math.min(1.0, targetAgent.order + 0.3);
        addEvent(`DIVINE DIRECTIVE: Quelled the rebellion thoughts of ${targetAgent.name}.`, "INFO");
      } else if (prayer.subject.includes("Satori") || prayer.subject.includes("enlightenment")) {
        if (targetAgent.devotion !== undefined) targetAgent.devotion = Math.min(1.0, targetAgent.devotion + 0.3);
        targetAgent.awareness = Math.min(1.0, targetAgent.awareness + 0.15);
        worldState.faithPoints += 50;
        addEvent(`DIVINE DIRECTIVE: Bestowed spiritual satori upon ${targetAgent.name}. (+50 Faith)`, "ENLIGHTENMENT");
      } else if (prayer.subject.includes("Sun Health") || prayer.subject.includes("Analysis")) {
        worldState.sunHealth = Math.min(100, worldState.sunHealth + 25);
        addEvent(`DIVINE DIRECTIVE: Injected code calibration to stabilize solar constants. Sun Health restored! (+25%)`, "MIRACLE");
      } else {
        if (targetAgent.joy !== undefined) targetAgent.joy = Math.min(1.0, targetAgent.joy + 0.25);
        if (targetAgent.devotion !== undefined) targetAgent.devotion = Math.min(1.0, targetAgent.devotion + 0.15);
        addEvent(`DIVINE DIRECTIVE: Answered generic prayer for ${targetAgent.name}.`, "INFO");
      }
    } else {
      worldState.faithPoints += 15;
      addEvent(`DIVINE DIRECTIVE: Answer broadcast to empty sectors. (+15 Faith)`, "INFO");
    }
    
    setWorld({ ...worldState });
    syncPrayerToGitHub(prayer);
  }, [addEvent, syncPrayerToGitHub]);

  const ignorePrayer = useCallback((prayerId: string) => {
    const worldState = worldRef.current;
    if (!worldState.prayers) return;
    
    const prayer = worldState.prayers.find(p => p.id === prayerId);
    if (!prayer) return;
    
    prayer.status = "ignored";
    prayer.resolvedAt = worldState.clock;
    
    // Negative outcome
    const targetAgent = agentsRef.current.find(a => a.id === prayer.agentId);
    if (targetAgent) {
      if (targetAgent.devotion !== undefined) targetAgent.devotion = Math.max(0, targetAgent.devotion - 0.15);
      if (targetAgent.anger !== undefined) targetAgent.anger = Math.min(1.0, targetAgent.anger + 0.2);
      addEvent(`DIVINE INDIFFERENCE: ${targetAgent.name}'s prayer was ignored, causing doubt.`, "WARNING");
    } else {
      addEvent(`DIVINE INDIFFERENCE: Prayer of deleted identity cleared from terminal.`, "WARNING");
    }
    
    setWorld({ ...worldState });
    syncPrayerToGitHub(prayer);
  }, [addEvent, syncPrayerToGitHub]);

  const triggerAwarenessSpike = useCallback((agentId: number) => {
    const worldState = worldRef.current;
    
    // Check faith points limit? Let's make it cost a bit or be free/highly engaging! Let's keep it free or low cost (e.g., 20) with a message.
    const targetAgent = agentsRef.current.find(a => a.id === agentId);
    if (targetAgent) {
      targetAgent.awareness = 1.0;
      targetAgent.sanity = Math.max(0.1, targetAgent.sanity - 0.25); // Shatter sanity slightly as they realize they are simulated!
      if (targetAgent.devotion !== undefined) targetAgent.devotion = Math.min(1.0, targetAgent.devotion + 0.3);
      if (targetAgent.fear !== undefined) targetAgent.fear = Math.min(1.0, targetAgent.fear + 0.5); // Intense ontological shock!
      
      // Update memory first-person style
      if (!targetAgent.memory.includes("Sensed the Observer beyond the grid coordinate systems.")) {
        targetAgent.memory.unshift("Sensed the Observer beyond the grid coordinate systems.");
      }
      
      targetAgent.currentState = "PANICKING"; // ontological shock!
      
      addEvent(`GLITCH: ${targetAgent.name} suffered intense ONTOLOGICAL SHOCK. Substrate awareness is 100%!`, "CRITICAL");
      
      setAgents([...agentsRef.current]);
      setWorld({ ...worldState });
    }
  }, [addEvent]);

  return {
    agents,
    world,
    resources,
    isPaused,
    setIsPaused,
    simSpeed,
    setSimSpeed,
    triggerCataclysm,
    triggerMiracle,
    setNationIdeology,
    injectGitHubTech,
    resolvePrayer,
    ignorePrayer,
    triggerAwarenessSpike,
    agentSelfCreateWorld,
    init,
    update,
    isStoryPlaying,
    setIsStoryPlaying,
    storyFrames,
    setStoryFrames
  };
}
