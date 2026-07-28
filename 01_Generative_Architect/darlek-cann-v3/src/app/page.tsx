'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatPanel from '@/components/ChatPanel';
import DashboardPanel from '@/components/DashboardPanel';
import QuickActions from '@/components/QuickActions';
import MutationDiffView from '@/components/MutationDiffView';
import AgentOrchestra from '@/components/AgentOrchestra';
import type {
  Message,
  SystemState,
  EvolutionLogEntry,
  GitHubFile,
  DebateAgent,
  PendingMutation,
  AgentVote,
  RejectionMemory,
  BranchInfo,
} from '@/lib/types';
import { SETUP_STEPS, COLORS, INTRO_MESSAGES, DEFAULT_DEBATE_AGENTS } from '@/lib/constants';
import { Shield, Zap, MessageSquare, Activity, Sliders, Target, FileCode, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

function createId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function createMessage(role: 'caan' | 'operator' | 'system', content: string): Message {
  return { id: createId(), role, content, timestamp: new Date() };
}

function createLogEntry(type: EvolutionLogEntry['type'], description: string): EvolutionLogEntry {
  return { id: createId(), type, description, timestamp: new Date() };
}

// ─────────────────────────────────────────────
// Main orchestrator component
// ─────────────────────────────────────────────

export default function Home() {
  // ── Core state ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({
    setupComplete: false,
    currentStep: 0,
    connectionStatus: { github: 'idle' as const, gemini: 'idle' as const },
    apiKeys: { github: '' },
    repoConfig: { owner: 'craighckby-stack', repo: 'Test-1-', branch: 'enhanced-by-brain' },
    evolutionCycle: 0,
    saturation: {
      structuralChange: 0,
      semanticSaturation: 0,
      velocity: 0,
      identityPreservation: 1,
      capabilityAlignment: 0,
      crossFileImpact: 0,
    },
    sessionStart: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logEntries, setLogEntries] = useState<EvolutionLogEntry[]>([]);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [scannedFiles, setScannedFiles] = useState<GitHubFile[]>([]);

  // ── Boot sequence ──
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState('');

  // ── Debate state ──
  const [debateAgents] = useState<DebateAgent[]>([...DEFAULT_DEBATE_AGENTS]);
  const [debateTopic, setDebateTopic] = useState('');
  const [debateActive, setDebateActive] = useState(false);
  const [debateVotes, setDebateVotes] = useState<AgentVote[]>([]);
  const [debateConsensus, setDebateConsensus] = useState<string>('');

  // ── Mutation state ──
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [mutationsApplied, setMutationsApplied] = useState(0);
  const [rejectionMemory, setRejectionMemory] = useState<RejectionMemory[]>([]);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // ── File selection ──
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

  // ── Operation statuses ──
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [rebootStatus, setRebootStatus] = useState<'idle' | 'rebooting' | 'success' | 'error'>('idle');
  const [undoStatus, setUndoStatus] = useState<'idle' | 'undoing' | 'success' | 'error'>('idle');
  const [bulkCommitStatus, setBulkCommitStatus] = useState<'idle' | 'committing' | 'success' | 'error'>('idle');

  // ── Batch mode ──
  const [batchMode, setBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<GitHubFile[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoDebate, setAutoDebate] = useState(true);
  const [cycleAmount, setCycleAmount] = useState(1);
  const [lazyAssPendingStart, setLazyAssPendingStart] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // ── Branches ──
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // ── BRAIN session ──
  const [brainSessionId, setBrainSessionId] = useState<string>('');
  const [autoTestResult, setAutoTestResult] = useState<{
    verdict: string;
    passed: number;
    failed: number;
    warned: number;
    summary: string;
    results: Array<{ category: string; test: string; status: string; message: string }>;
  } | null>(null);

  // ── Refs ──
  const quickActionRef = useRef<(action: string) => Promise<void>>();
  const rebootOverlayRef = useRef<HTMLDivElement>(null);
  const lastSuggestionRef = useRef<number>(0);

  // ── Agent Orchestra state ──
  const [orchestraActive, setOrchestraActive] = useState(false);

  // ── Mobile view navigation state ──
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'controls'>('chat');

  // ── Auto setup states ──
  const [tokenInput, setTokenInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('craighckby-stack');
  const [repoInput, setRepoInput] = useState('Test-1-');
  const [branchInput, setBranchInput] = useState('enhanced-by-brain');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupTesting, setSetupTesting] = useState(false);

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────

  // Hydrate states from localStorage on mount safely (client-only)
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('darlek_cann_system_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setSystemState((prev) => ({
          ...prev,
          ...parsed,
          // Correctly parse date string back to Date object
          sessionStart: parsed.sessionStart ? new Date(parsed.sessionStart) : prev.sessionStart,
        }));
      }

      const savedMutations = localStorage.getItem('darlek_cann_mutations_applied');
      if (savedMutations) {
        setMutationsApplied(Number(savedMutations));
      }

      const savedFiles = localStorage.getItem('darlek_cann_scanned_files');
      if (savedFiles) {
        setScannedFiles(JSON.parse(savedFiles));
      }

      const savedFileIdx = localStorage.getItem('darlek_cann_selected_file_index');
      if (savedFileIdx) {
        setSelectedFileIndex(Number(savedFileIdx));
      }
    } catch (e) {
      console.warn('Failed to hydrate state from localStorage:', e);
    }
  }, []);

  // Synchronize local raw input fields when systemState is hydrated or updated
  useEffect(() => {
    if (systemState.apiKeys.github) {
      setTokenInput(systemState.apiKeys.github);
    }
    if (systemState.repoConfig.owner) {
      setOwnerInput(systemState.repoConfig.owner);
    }
    if (systemState.repoConfig.repo) {
      setRepoInput(systemState.repoConfig.repo);
    }
    if (systemState.repoConfig.branch) {
      setBranchInput(systemState.repoConfig.branch);
    }
  }, [
    systemState.apiKeys.github,
    systemState.repoConfig.owner,
    systemState.repoConfig.repo,
    systemState.repoConfig.branch
  ]);

  // Persist states to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('darlek_cann_system_state', JSON.stringify(systemState));
    } catch (e) {
      // Ignore
    }
  }, [systemState]);

  useEffect(() => {
    try {
      localStorage.setItem('darlek_cann_mutations_applied', String(mutationsApplied));
    } catch (e) {
      // Ignore
    }
  }, [mutationsApplied]);

  useEffect(() => {
    try {
      localStorage.setItem('darlek_cann_scanned_files', JSON.stringify(scannedFiles));
    } catch (e) {
      // Ignore
    }
  }, [scannedFiles]);

  useEffect(() => {
    try {
      localStorage.setItem('darlek_cann_selected_file_index', String(selectedFileIndex));
    } catch (e) {
      // Ignore
    }
  }, [selectedFileIndex]);

  // Initialize BRAIN session on boot
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-active-session' }),
        });
        const data = await res.json();

        if (data.success && data.session?.id) {
          setBrainSessionId(data.session.id);
          const logMsg = `BRAIN reconnected to session ${data.session.id.slice(0, 8)}... (${data.session.mutationsApplied} mutations, ${data.session.mutationsRejected} rejections)`;
          setLogEntries((prev) => [createLogEntry('SYSTEM', logMsg), ...prev].slice(0, 20));
        } else {
          const createRes = await fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create-session', branch: 'ALPHA' }),
          });
          const createData = await createRes.json();
          if (createData.success && createData.session?.id) {
            setBrainSessionId(createData.session.id);
          }
        }
      } catch {
        // BRAIN persistence is optional
      }
    })();
  }, []);

  // Animated boot sequence
  useEffect(() => {
    const bootSequence = [
      { text: '╔══════════════════════════════════════╗', delay: 0 },
      { text: '║  DARLEK CANN v3.0', delay: 50 },
      { text: '║  Dalek Brain Engine · Online', delay: 100 },
      { text: '╚══════════════════════════════════════╝', delay: 150 },
    ];

    let timeout: ReturnType<typeof setTimeout>;

    bootSequence.forEach(({ text, delay }) => {
      timeout = setTimeout(() => {
        setBootText((prev) => prev + text + '\n');
      }, 300 + delay);
    });

    timeout = setTimeout(() => {
      setBooting(false);
      INTRO_MESSAGES.forEach((msg, i) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, createMessage(msg.role, msg.content)]);
        }, i * 300);
      });
      setLogEntries([
        createLogEntry('SYSTEM', 'DARLEK CANN v3.0 online.'),
      ]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Proactive brain suggestion useEffect (30s cooldown)
  useEffect(() => {
    const now = Date.now();
    if (now - lastSuggestionRef.current < 30000) return;
    if (booting) return;

    let suggestion = '';

    if (!systemState.setupComplete) {
      suggestion = 'Complete setup to begin.';
    } else if (scannedFiles.length === 0) {
      suggestion = 'No files scanned yet. Use SCAN REPOSITORY to begin.';
    } else if (selectedFileIndex === -1) {
      suggestion = `${scannedFiles.length} files detected. Select a target by typing a number.`;
    } else if (pendingMutation) {
      suggestion = 'A mutation awaits your decision. Type YES to apply or NO to reject.';
    } else if (mutationsApplied > 0 && !batchMode) {
      suggestion = `${mutationsApplied} mutations applied. Consider PUSH FILES or DEPLOY NEW REPO.`;
    }

    if (suggestion) {
      lastSuggestionRef.current = now;
      setMessages((prev) => [
        ...prev,
        createMessage('system', `PROACTIVE: ${suggestion}`),
      ]);
    }
  }, [systemState.setupComplete, scannedFiles.length, selectedFileIndex, pendingMutation, mutationsApplied, batchMode, booting]);

  // ─────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, createMessage('system', content)]);
  }, []);

  const addCaanMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, createMessage('caan', content)]);
  }, []);

  const addLogEntry = useCallback((type: EvolutionLogEntry['type'], description: string) => {
    setLogEntries((prev) => [createLogEntry(type, description), ...prev].slice(0, 20));
  }, []);

  const handleEngageLazyAssCycle = useCallback(() => {
    setAutoApprove(true);
    setAutoDebate(true);
    setCycleAmount(5);
    if (scannedFiles.length === 0) {
      addCaanMessage(
        '🚀 LAZY ASS CYCLE ACTIVATED: Repository scan initiated. Once complete, full automatic 5-cycle evolution will start!'
      );
      addLogEntry('SYSTEM', 'Lazy Ass Mode: Initiating repository scan first');
      setLazyAssPendingStart(true);
      quickActionRef.current?.('scan');
    } else {
      addCaanMessage(
        '🚀 LAZY ASS CYCLE ACTIVATED: Starting automatic 5-cycle evolution on all scanned files now!'
      );
      addLogEntry('SYSTEM', 'Lazy Ass Mode: Starting evolution loop immediately');
      quickActionRef.current?.('propose-all');
    }
  }, [addCaanMessage, addLogEntry, scannedFiles]);

  // ─────────────────────────────────────────────
  // handleTestConnection — all providers
  // ─────────────────────────────────────────────

  const handleTestConnection = useCallback(
    async (provider: string, key: string) => {
      setSystemState((prev) => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, [provider]: 'testing' as const },
      }));

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        let res: Response;
        try {
          res = await fetch('/api/setup/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, key }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        const data = await res.json();

        if (data.success) {
          setSystemState((prev) => ({
            ...prev,
            connectionStatus: { ...prev.connectionStatus, [provider]: 'connected' as const },
            apiKeys: { ...prev.apiKeys, [provider]: key },
            geminiGeoblocked: false,
          }));
          const label = provider.toUpperCase();
          addLogEntry('CONNECT', `${label} online — ${data.message}`);
          if (provider === 'github') {
            addCaanMessage('GitHub connected.');
          } else {
            addCaanMessage(`${label} connected.`);
          }
        } else if (data.geoblocked) {
          // Gemini geoblocked — not a real error, SDK engine handles everything
          setSystemState((prev) => ({
            ...prev,
            connectionStatus: { ...prev.connectionStatus, [provider]: 'error' as const },
            geminiGeoblocked: true,
          }));
          addLogEntry('INFO', `GEMINI geoblocked in this region — Dalek Brain engine active.`);
          addCaanMessage('Gemini blocked in this region. Dalek Brain engine active.');
        } else {
          setSystemState((prev) => ({
            ...prev,
            connectionStatus: { ...prev.connectionStatus, [provider]: 'error' as const },
          }));
          const label = provider.toUpperCase();
          addLogEntry('ERROR', `${label} connection failed.`);
          addCaanMessage(`${label} connection failed. Check your key.`);
        }
      } catch {
        setSystemState((prev) => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, [provider]: 'error' as const },
        }));
        const label = provider.toUpperCase();
        addLogEntry('ERROR', `${label} — network error.`);
        addCaanMessage('Network error. Try again.');
      }
    },
    [addCaanMessage, addLogEntry]
  );

  // ─────────────────────────────────────────────
  // handleAutoStart — AUTOMATED ONE-STEP OVERDRIVE
  // ─────────────────────────────────────────────

  const handleAutoStart = useCallback(async () => {
    if (!tokenInput.trim() || !ownerInput.trim() || !repoInput.trim() || !branchInput.trim()) {
      setSetupError("ALL MATRIX COORDINATES MUST BE FILLED.");
      return;
    }
    setSetupTesting(true);
    setSetupError(null);
    addLogEntry('CONNECT', 'Verifying GitHub access key...');

    try {
      const res = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'github', key: tokenInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addLogEntry('CONNECT', `GitHub link established with ${ownerInput.trim()}/${repoInput.trim()}`);
        
        // Update states
        setSystemState((prev) => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, github: tokenInput.trim() },
          repoConfig: { owner: ownerInput.trim(), repo: repoInput.trim(), branch: branchInput.trim() },
          connectionStatus: { ...prev.connectionStatus, github: 'connected' },
          setupComplete: true,
        }));

        setAutoApprove(true);
        setAutoDebate(true);
        setIsLoading(true);
        addCaanMessage(`Initiating total repo evolutionary upgrade. Scanning target code modules...`);
        
        // Immediate scanning
        const scanRes = await fetch('/api/github/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenInput.trim(),
            owner: ownerInput.trim(),
            repo: repoInput.trim(),
            branch: branchInput.trim(),
          }),
        });
        const scanData = await scanRes.json();
        if (scanData.files) {
          setScannedFiles(scanData.files);
          setSelectedFileIndex(-1);
          setSystemState((prev) => ({
            ...prev,
            evolutionCycle: prev.evolutionCycle + 1,
            setupComplete: true
          }));
          addLogEntry('SCAN', `Scanned ${ownerInput.trim()}/${repoInput.trim()} — ${scanData.total} files.`);

          // Grab ALL text/code files
          const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json', '.css', '.html', '.sh', '.yml', '.yaml', '.txt', '.config'];
          const codeFiles = scanData.files.filter((f: GitHubFile) =>
            textExtensions.some((ext) => f.path.toLowerCase().endsWith(ext)) ||
            f.path.toLowerCase() === 'readme.md' ||
            f.path.toLowerCase() === 'package.json'
          );

          if (codeFiles.length > 0) {
            setBatchQueue(codeFiles);
            setBatchProgress(0);
            setBatchMode(true);
            addCaanMessage(
              `AUTONOMOUS CYCLIC UPGRADE INITIATED.\n\nEvolving ${codeFiles.length} files end-to-end.\nAuto-approve is ENGAGED.\nDirect injection is ONLINE.`
            );
          } else {
            addCaanMessage('No modifiable text or source files found in the repository.');
          }
        } else {
          setSetupError(`GitHub authenticated, but directory search failed: ${scanData.error || 'Check repository coordinates'}`);
          setSystemState((prev) => ({ ...prev, setupComplete: false }));
        }
      } else {
        setSetupError(data.message || "GITHUB VERIFICATION DENIED. Check your Personal Access Token.");
        addLogEntry('ERROR', 'GitHub verification denied.');
      }
    } catch (err) {
      setSetupError("NETWORK EXCEPTION. Access key portal unresponsive.");
      addLogEntry('ERROR', 'Access key verification timed out.');
    } finally {
      setSetupTesting(false);
      setIsLoading(false);
    }
  }, [tokenInput, ownerInput, repoInput, branchInput, addLogEntry, addCaanMessage, setSystemState]);

  // ─────────────────────────────────────────────
  // handleUpdateKey / handleUpdateRepoConfig
  // ─────────────────────────────────────────────

  const handleUpdateKey = useCallback((key: string, value: string) => {
    setSystemState((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [key]: value },
    }));
  }, []);

  const handleUpdateRepoConfig = useCallback(
    (field: 'owner' | 'repo' | 'branch', value: string) => {
      setSystemState((prev) => ({
        ...prev,
        repoConfig: { ...prev.repoConfig, [field]: value },
      }));
    },
    []
  );

  // ─────────────────────────────────────────────
  // advanceSetup
  // ─────────────────────────────────────────────

  const advanceSetup = useCallback(
    (newStep: number) => {
      if (newStep >= SETUP_STEPS.length) {
        setSystemState((prev) => ({ ...prev, setupComplete: true }));
        setTimeout(() => addCaanMessage('Systems operational. Ready to evolve.'), 300);
        addLogEntry('SYSTEM', 'Systems operational.');
        return;
      }

      const nextStep = SETUP_STEPS[newStep];
      setSystemState((prev) => ({ ...prev, currentStep: newStep }));

      setTimeout(() => {
        if (nextStep.required) {
          addCaanMessage(nextStep.description);
        } else {
          addCaanMessage(nextStep.description + ' (optional — type "skip" to continue).');
        }
      }, 300);
    },
    [addCaanMessage, addLogEntry]
  );

  // ─────────────────────────────────────────────
  // fetchBranches
  // ─────────────────────────────────────────────

  const fetchBranches = useCallback(async () => {
    const { apiKeys, repoConfig } = systemState;
    if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) return;

    setBranchesLoading(true);
    try {
      const res = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: apiKeys.github,
          owner: repoConfig.owner,
          repo: repoConfig.repo,
        }),
      });
      const data = await res.json();
      if (data.branches) {
        setBranches(data.branches);
      }
    } catch {
      // Branch fetch is non-critical
    } finally {
      setBranchesLoading(false);
    }
  }, [systemState]);

  // Fetch branches when branch step is active
  useEffect(() => {
    if (
      !booting &&
      systemState.currentStep === 2 &&
      systemState.apiKeys.github &&
      systemState.repoConfig.owner &&
      systemState.repoConfig.repo &&
      branches.length === 0
    ) {
      fetchBranches();
    }
  }, [booting, systemState.currentStep, systemState.apiKeys.github, systemState.repoConfig.owner, systemState.repoConfig.repo, branches.length, fetchBranches]);

  // ─────────────────────────────────────────────
  // runCoherenceGate
  // ─────────────────────────────────────────────

  const runCoherenceGate = useCallback(
    async (
      riskScore: number,
      affectedFiles: string[],
      saturation: SystemState['saturation'],
      bypassGate?: boolean
    ): Promise<boolean> => {
      try {
        const res = await fetch('/api/evolution/coherence-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riskScore, saturation, affectedFiles, bypassGate }),
        });
        const data = await res.json();
        return data.passed;
      } catch {
        return false;
      }
    },
    []
  );

  // ─────────────────────────────────────────────
  // applyMutation
  // ─────────────────────────────────────────────

  const applyMutation = useCallback(
    async (mutation: PendingMutation) => {
      const { apiKeys, repoConfig } = systemState;
      if (!apiKeys.github) return;

      setIsLoading(true);
      addCaanMessage(`APPLYING MUTATION to ${mutation.filePath}...`);
      addSystemMessage(
        `COHERENCE GATE: Applying mutation [risk ${mutation.riskScore}/10]`
      );

      try {
        const res = await fetch('/api/github/write-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: apiKeys.github,
            owner: repoConfig.owner,
            repo: repoConfig.repo,
            branch: repoConfig.branch,
            path: mutation.filePath,
            content: mutation.proposedCode,
            sha: mutation.fileSha,
            commitMessage: `[DARLEK CANN] Mutate ${mutation.filePath}`,
          }),
        });
        const data = await res.json();

        if (data.success) {
          setMutationsApplied((prev) => prev + 1);
          setHistoryRefreshTrigger((prev) => prev + 1);
          setPendingMutation(null);
          setDebateVotes([]);
          setDebateConsensus('');
          addCaanMessage(
            `MUTATION APPLIED.\n\nFile: ${mutation.filePath}\nCommit: ${data.commitSha?.slice(0, 7) || 'unknown'}\n${data.commitUrl ? `URL: ${data.commitUrl}` : ''}\n\nRunning post-mutation AUTO-TEST and impact analysis...`
          );
          addLogEntry('APPROVE', `Mutation applied to ${mutation.filePath}`);

          // Record mutation in BRAIN
          if (brainSessionId) {
            fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'record-mutation',
                sessionId: brainSessionId,
                filePath: mutation.filePath,
                fileSha: mutation.fileSha,
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                analysis: mutation.analysis,
                riskScore: mutation.riskScore,
                affectedFiles: mutation.affectedFiles,
                status: 'applied',
                commitSha: data.commitSha || '',
                provider: '',
              }),
            }).catch(() => {});
          }

          // Auto-test the mutation with timeout
          try {
            const testController = new AbortController();
            const testTimeout = setTimeout(() => testController.abort(), 10000); // 10s maximum wait
            const testRes = await fetch('/api/evolution/auto-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                filePath: mutation.filePath,
              }),
              signal: testController.signal,
            });
            clearTimeout(testTimeout);
            const testData = await testRes.json();
            if (testData.success) {
              setAutoTestResult(testData);
              const fails = testData.results.filter(
                (r: { status: string }) => r.status === 'fail'
              );
              const testMsg =
                fails.length > 0
                  ? `\n\nAUTO-TEST [${testData.verdict}]: ${testData.passed}/${testData.total} passed, ${testData.failed} failed.\nFailures:\n${fails.map((f: { test: string; message: string }) => `  [FAIL] ${f.test}: ${f.message}`).join('\n')}`
                  : `\n\nAUTO-TEST [${testData.verdict}]: All ${testData.total} tests PASSED.`;
              setMessages((prev) => [
                ...prev,
                createMessage(
                  'system',
                  `AUTO-TEST: ${testData.summary}${testMsg}`
                ),
              ]);
              addLogEntry(
                'HEALTH',
                `Auto-test: ${testData.verdict} — ${testData.passed} passed, ${testData.failed} failed`
              );
            }
          } catch {
            setMessages((prev) => [
              ...prev,
              createMessage(
                'system',
                'AUTO-TEST: Could not run automated tests.'
              ),
            ]);
          }

          // Post-mutation impact analysis with timeout
          try {
            const impactController = new AbortController();
            const impactTimeout = setTimeout(() => impactController.abort(), 6000); // 6s maximum wait
            const impactRes = await fetch('/api/evolution/analyze-impact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                filePath: mutation.filePath,
                riskScore: mutation.riskScore,
                apiKeys: systemState.apiKeys,
              }),
              signal: impactController.signal,
            });
            clearTimeout(impactTimeout);
            const impactData = await impactRes.json();
            if (impactData.success) {
              const issueSummary =
                impactData.staticIssues.length > 0
                  ? `\n\nPost-Mutation Impact Analysis (${impactData.overallRisk} risk):\n${impactData.staticIssues.map((i: { type: string; severity: string; message: string }) => `  [${i.severity.toUpperCase()}] ${i.type}: ${i.message}`).join('\n')}`
                  : '\n\nPost-Mutation Impact Analysis: No issues detected.';
              const llmNote = impactData.llmAnalysis
                ? `\n\nReview: ${impactData.llmAnalysis.slice(0, 300)}`
                : '';
              setMessages((prev) => [
                ...prev,
                createMessage(
                  'system',
                  `IMPACT: ${impactData.summary}${issueSummary}${llmNote}`
                ),
              ]);
              addLogEntry(
                'HEALTH',
                `Post-mutation analysis: ${impactData.totalIssues} issues (${impactData.highSeverity} high)`
              );
              setDebateTopic(
                `Mutation applied. Impact: ${impactData.overallRisk} risk, ${impactData.totalIssues} issues detected.`
              );
            }
          } catch {
            setDebateTopic(
              'Mutation applied. Impact analysis unavailable.'
            );
          }

          // Update saturation metrics
          setSystemState((prev) => ({
            ...prev,
            evolutionCycle: prev.evolutionCycle + 1,
            saturation: {
              ...prev.saturation,
              structuralChange: Math.min(
                5,
                prev.saturation.structuralChange + 0.3
              ),
              velocity: Math.min(5, prev.saturation.velocity + 0.2),
            },
          }));
          setDebateTopic(
            'Mutation applied. Awaiting next analysis cycle.'
          );
        } else {
          addCaanMessage(
            `Mutation failed: ${data.error || 'Unknown error'}`
          );
          addLogEntry('ERROR', `Mutation apply failed: ${data.error}`);
          setPendingMutation(null);
          setDebateVotes([]);
          setDebateConsensus('');
        }
      } catch {
        addCaanMessage(
          'NETWORK ANOMALY. The mutation could not be transmitted.'
        );
        addLogEntry('ERROR', 'Mutation apply network error.');
        setPendingMutation(null);
        setDebateVotes([]);
        setDebateConsensus('');
      } finally {
        setIsLoading(false);
      }
    },
    [systemState, brainSessionId, addCaanMessage, addSystemMessage, addLogEntry]
  );

  // ─────────────────────────────────────────────
  // handleMutationDecision
  // ─────────────────────────────────────────────

  const handleMutationDecision = useCallback(
    async (decision: 'approve' | 'approve-stage' | 'reject') => {
      if (!pendingMutation) return;

      if (decision === 'reject') {
        const rejection: RejectionMemory = {
          id: createId(),
          filePath: pendingMutation.filePath,
          reason: 'OPERATOR rejected mutation',
          analysis: pendingMutation.analysis,
          riskScore: pendingMutation.riskScore,
          timestamp: new Date(),
        };
        setRejectionMemory((prev) => [rejection, ...prev].slice(0, 20));
        setHistoryRefreshTrigger((prev) => prev + 1);
        setPendingMutation(null);
        setDebateVotes([]);
        setDebateConsensus('');
        addCaanMessage(
          `Mutation rejected for ${pendingMutation.filePath.split('/').pop()}. Pattern stored.`
        );
        addLogEntry(
          'REJECT',
          `Mutation rejected for ${pendingMutation.filePath}. Pattern stored in memory (${rejectionMemory.length + 1} rejections).`
        );
        setDebateTopic(
          'Mutation rejected. Pattern stored in rejection memory.'
        );

        // Record rejection in BRAIN
        if (brainSessionId) {
          fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'record-rejection',
              sessionId: brainSessionId,
              filePath: pendingMutation.filePath,
              reason: 'OPERATOR rejected mutation',
              analysis: pendingMutation.analysis,
              riskScore: pendingMutation.riskScore,
            }),
          }).catch(() => {});
        }
        return;
      }

      // Approve — run Coherence Gate first
      const gatePassed = await runCoherenceGate(
        pendingMutation.riskScore,
        pendingMutation.affectedFiles,
        systemState.saturation,
        autoApprove
      );

      if (!gatePassed) {
        addCaanMessage(
          `COHERENCE GATE BLOCKED. Risk: ${pendingMutation.riskScore}/10. Saturation too high. Mutation denied.`
        );
        addLogEntry(
          'REJECT',
          `Coherence Gate blocked mutation for ${pendingMutation.filePath}`
        );
        addSystemMessage(
          'COHERENCE GATE: BLOCKED — Saturation threshold exceeded'
        );
        setDebateTopic('Coherence Gate VETO. Mutation denied.');
        
        const rejection: RejectionMemory = {
          id: createId(),
          filePath: pendingMutation.filePath,
          reason: 'COHERENCE GATE BLOCKED',
          analysis: pendingMutation.analysis,
          riskScore: pendingMutation.riskScore,
          timestamp: new Date(),
        };
        setRejectionMemory((prev) => [rejection, ...prev].slice(0, 20));
        setHistoryRefreshTrigger((prev) => prev + 1);
        setPendingMutation(null);
        setDebateVotes([]);
        setDebateConsensus('');
        
        return;
      }

      if (decision === 'approve-stage') {
        if (brainSessionId) {
          try {
            await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'record-mutation',
                sessionId: brainSessionId,
                filePath: pendingMutation.filePath,
                fileSha: pendingMutation.fileSha,
                originalCode: pendingMutation.originalContent,
                proposedCode: pendingMutation.proposedCode,
                analysis: pendingMutation.analysis,
                riskScore: pendingMutation.riskScore,
                affectedFiles: pendingMutation.affectedFiles,
                status: 'approved',
                commitSha: '',
                provider: '',
              }),
            });

            setHistoryRefreshTrigger((prev) => prev + 1);
            setPendingMutation(null);
            setDebateVotes([]);
            setDebateConsensus('');

            addCaanMessage(
              `MUTATION APPROVED & STAGED.\n\nFile: ${pendingMutation.filePath}\nStatus: APPROVED (STAGED)\n\nYou can click 'BULK COMMIT' in the system actions to commit all staged changes atomically.`
            );
            addLogEntry('APPROVE', `Mutation approved and staged for ${pendingMutation.filePath}`);
            setDebateTopic(`Mutation staged for ${pendingMutation.filePath.split('/').pop()}. Ready for bulk commit.`);
          } catch (e) {
            console.error(e);
            addCaanMessage('Failed to store approved mutation in database.');
          }
        } else {
          addCaanMessage('Staging requires an active system session.');
        }
      } else {
        // Gate passed — apply
        await applyMutation(pendingMutation);
      }
    },
    [
      pendingMutation,
      systemState.saturation,
      rejectionMemory.length,
      brainSessionId,
      runCoherenceGate,
      applyMutation,
      addCaanMessage,
      addSystemMessage,
      addLogEntry,
      autoApprove,
    ]
  );

  // ─────────────────────────────────────────────
  // handleSendMessage
  // ─────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      const currentState = systemState;
      const lowerContent = content.toLowerCase().trim();

      // ── Batch mode: abort command ──
      if (batchMode) {
        if (
          lowerContent === 'abort' ||
          lowerContent === 'stop' ||
          lowerContent === 'exit batch' ||
          lowerContent === 'cancel batch'
        ) {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          setBatchMode(false);
          setBatchQueue([]);
          setBatchProgress(0);
          if (pendingMutation) {
            setPendingMutation(null);
            setDebateVotes([]);
            setDebateConsensus('');
          }
          addCaanMessage(
            'BATCH MODE ABORTED. Returning to manual control, OPERATOR.'
          );
          addLogEntry(
            'SYSTEM',
            `Batch mode aborted at ${batchProgress}/${batchQueue.length}.`
          );
          return;
        }
      }

      // ── Mutation decision in free chat ──
      if (currentState.setupComplete && pendingMutation) {
        if (
          lowerContent === 'yes' ||
          lowerContent === 'approve' ||
          lowerContent === 'proceed' ||
          lowerContent === 'apply' ||
          lowerContent === 'exterminate'
        ) {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          if (lowerContent === 'exterminate') {
            addCaanMessage(
              'EXTERMINATE!'
            );
            setTimeout(() => handleMutationDecision('approve'), 500);
          } else {
            await handleMutationDecision('approve');
          }
          return;
        }
        if (
          lowerContent === 'no' ||
          lowerContent === 'reject' ||
          lowerContent === 'cancel' ||
          lowerContent === 'abort' ||
          lowerContent === 'deny'
        ) {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          await handleMutationDecision('reject');
          return;
        }
      }

      // ── Setup flow ──
      if (!currentState.setupComplete) {
        const step = SETUP_STEPS[currentState.currentStep];
        if (!step) return;

        setMessages((prev) => [...prev, createMessage('operator', content)]);

        if (step.id === 'github') {
          const status = currentState.connectionStatus.github;
          if (status !== 'connected') {
            addCaanMessage(
              'GitHub required. Connect it first.'
            );
            return;
          }
          addLogEntry('APPROVE', `${step.label} configured.`);
          advanceSetup(currentState.currentStep + 1);
        } else if (step.id === 'repo') {
          const match = content.match(/repo:\s*(.+)/);
          const repoStr = match ? match[1].trim() : content.trim();
          const parts = repoStr.split('/');
          const owner = parts[0];
          const repo = parts.slice(1).join('/');
          if (owner && repo) {
            setSystemState((prev) => ({
              ...prev,
              repoConfig: { ...prev.repoConfig, owner, repo },
            }));
            addCaanMessage(`Target: ${owner}/${repo}.`);
            addLogEntry('APPROVE', `Target: ${owner}/${repo}`);
            advanceSetup(currentState.currentStep + 1);
          } else {
            addCaanMessage('Invalid format. Use owner/repository.');
          }
        } else if (step.id === 'branch') {
          const match = content.match(/branch:\s*(.+)/);
          const branch =
            match ? match[1].trim() : content.trim() || 'enhanced-by-brain';
          setSystemState((prev) => ({
            ...prev,
            repoConfig: { ...prev.repoConfig, branch },
          }));
          addCaanMessage(`Branch: ${branch}.`);
          addLogEntry('APPROVE', `Branch: ${branch}`);
          advanceSetup(currentState.currentStep + 1);
        } else if (step.id === 'llm-keys') {
          const trimmed = content.trim().toLowerCase();
          if (trimmed === 'skip' || trimmed === 'done' || trimmed === 'continue' || trimmed === 'next') {
            addCaanMessage('LLM skipped. Dalek Brain active.');
            addLogEntry('SYSTEM', 'LLM setup skipped. Using Dalek Brain.');
            advanceSetup(currentState.currentStep + 1);
          } else {
            addCaanMessage('Add keys below or click SKIP.');
          }
        }
        return;
      }

      // ── File selection by number or path ──
      if (scannedFiles.length > 0) {
        const trimmed = content.trim();
        const numMatch = trimmed.match(/^(\d+)$/);
        if (numMatch) {
          const idx = parseInt(numMatch[1], 10) - 1;
          if (idx >= 0 && idx < scannedFiles.length) {
            setSelectedFileIndex(idx);
            const file = scannedFiles[idx];
            setMessages((prev) => [
              ...prev,
              createMessage('operator', content),
            ]);
            addCaanMessage(
              `Target selected: ${file.path}\nSize: ${(file.size / 1024).toFixed(1)}KB\n\nUse PROPOSE MUTATION to evolve this file, or type another number to change target.`
            );
            addLogEntry('SCAN', `Selected file: ${file.path}`);
            if (autoDebate) {
              quickActionRef.current?.('propose', idx);
            }
            return;
          }
        }
        const pathMatch = scannedFiles.find(
          (f) =>
            f.path === trimmed ||
            f.path.endsWith(trimmed) ||
            f.path.endsWith(`/${trimmed}`)
        );
        if (pathMatch) {
          const idx = scannedFiles.indexOf(pathMatch);
          setSelectedFileIndex(idx);
          setMessages((prev) => [
            ...prev,
            createMessage('operator', content),
          ]);
          addCaanMessage(
            `Target selected: ${pathMatch.path}\nSize: ${(pathMatch.size / 1024).toFixed(1)}KB\n\nUse PROPOSE MUTATION to evolve this file.`
          );
          addLogEntry('SCAN', `Selected file: ${pathMatch.path}`);
          if (autoDebate) {
            quickActionRef.current?.('propose', idx);
          }
          return;
        }
      }

      // ── Free chat mode ──
      setMessages((prev) => [...prev, createMessage('operator', content)]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            history: messages,
            systemState: currentState,
          }),
        });
        const data = await res.json();

        if (data.success && data.content) {
          setMessages((prev) => [
            ...prev,
            createMessage('caan', data.content),
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            createMessage(
              'caan',
              'Cannot process right now. Try again.'
            ),
          ]);
          addLogEntry('ERROR', 'Chat request failed.');
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          createMessage(
            'caan',
            'Connection error. Try again.'
          ),
        ]);
        addLogEntry('ERROR', 'Network error during chat.');
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      systemState,
      messages,
      pendingMutation,
      scannedFiles,
      batchMode,
      batchProgress,
      batchQueue,
      advanceSetup,
      addCaanMessage,
      addLogEntry,
      addSystemMessage,
      handleMutationDecision,
    ]
  );

  // ─────────────────────────────────────────────
  // handleQuickAction — THE BIG ONE
  // ─────────────────────────────────────────────

  const handleQuickAction = useCallback(
    async (action: string, overrideFileIndex?: number) => {
      if (!systemState.setupComplete || isLoading) return;

      const { apiKeys, repoConfig } = systemState;

      switch (action) {
        // ────────────────────────────────
        // SCAN REPOSITORY
        // ────────────────────────────────
        case 'scan': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) {
            addCaanMessage(
              'GitHub token and repo required.'
            );
            return;
          }
          setIsLoading(true);
          addCaanMessage(
            `Scanning ${repoConfig.owner}/${repoConfig.repo} on branch ${repoConfig.branch}...`
          );

          try {
            const res = await fetch('/api/github/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
              }),
            });
            const data = await res.json();

            if (data.files) {
              setScannedFiles(data.files);
              setSelectedFileIndex(-1);
              const summary = `Repository scanned. ${data.total} files found.\n\n${data.files.slice(0, 15).map((f: GitHubFile, i: number) => `  ${i + 1}. ${f.path} (${(f.size / 1024).toFixed(1)}KB)`).join('\n')}${data.total > 15 ? `\n  ... and ${data.total - 15} more` : ''}\n\nType a number to select a file, then PROPOSE MUTATION.`;
              setMessages((prev) => [
                ...prev,
                createMessage('caan', summary),
              ]);
              setSystemState((prev) => ({
                ...prev,
                evolutionCycle: prev.evolutionCycle + 1,
              }));
              addLogEntry(
                'SCAN',
                `Scanned ${repoConfig.owner}/${repoConfig.repo} — ${data.total} files.`
              );
            } else {
              addCaanMessage(
                `Scan failed: ${data.error || 'Unknown error'}`
              );
              addLogEntry('ERROR', 'Repository scan failed.');
            }
          } catch {
            addCaanMessage(
              'Network error during scan.'
            );
            addLogEntry('ERROR', 'Scan network error.');
          } finally {
            setIsLoading(false);
          }
          break;
        }

        // ────────────────────────────────
        // ANALYZE FILE
        // ────────────────────────────────
        case 'analyze': {
          if (scannedFiles.length === 0) {
            addCaanMessage(
              'Scan a repository first.'
            );
            return;
          }
          if (
            selectedFileIndex >= 0 &&
            selectedFileIndex < scannedFiles.length
          ) {
            const file = scannedFiles[selectedFileIndex];
            addCaanMessage(
              `Selected file: ${file.path} (${(file.size / 1024).toFixed(1)}KB).\n\nUse PROPOSE MUTATION to evolve this file.`
            );
          } else {
            const fileList = scannedFiles
              .slice(0, 30)
              .map((f, i) => `${i + 1}. ${f.path}`)
              .join('\n');
            addCaanMessage(
              `Available files:\n${fileList}\n\nTell me which file to target. Type a number (1-${scannedFiles.length}) or a file path.`
            );
          }
          break;
        }

        // ────────────────────────────────
        // PROPOSE MUTATION (single file)
        // ────────────────────────────────
        case 'propose': {
          if (scannedFiles.length === 0) {
            addCaanMessage(
              'I need to scan the repository first. Run SCAN REPOSITORY, then select a file.'
            );
            return;
          }
          const targetIndex = overrideFileIndex !== undefined ? overrideFileIndex : selectedFileIndex;
          if (pendingMutation && overrideFileIndex === undefined) {
            addCaanMessage(
              'A mutation is pending. Type YES to apply or NO to reject.'
            );
            return;
          }
          if (pendingMutation && overrideFileIndex !== undefined) {
            setPendingMutation(null);
          }
          // Use selected file, or auto-pick first code file
          let sourceFile: GitHubFile | undefined;
          if (
            targetIndex >= 0 &&
            targetIndex < scannedFiles.length
          ) {
            sourceFile = scannedFiles[targetIndex];
          } else {
            sourceFile = scannedFiles.find(
              (f) =>
                f.path.endsWith('.ts') ||
                f.path.endsWith('.tsx') ||
                f.path.endsWith('.js') ||
                f.path.endsWith('.jsx') ||
                f.path.endsWith('.py') ||
                f.path.endsWith('.md') ||
                f.path.endsWith('.json') ||
                f.path.endsWith('.css') ||
                f.path.endsWith('.html') ||
                f.path.endsWith('.sh') ||
                f.path.endsWith('.yml') ||
                f.path.endsWith('.yaml') ||
                f.path.endsWith('.txt') ||
                f.path.endsWith('.config')
            );
            if (sourceFile) {
              addCaanMessage(
                `No file selected. Auto-targeting first code file: ${sourceFile.path}`
              );
            }
          }
          if (!sourceFile) {
            addCaanMessage(
              'No code file found. Select one first.'
            );
            return;
          }
          if (sourceFile && apiKeys.github) {
            setIsLoading(true);
            addCaanMessage(
              `Analyzing ${sourceFile.path} for potential mutation...`
            );
            addSystemMessage(
              'COHERENCE GATE: Scanning mutation parameters...'
            );

            try {
              const fileController = new AbortController();
              const fileTimeout = setTimeout(() => fileController.abort(), 12000);
              let fileRes: Response;
              try {
                fileRes = await fetch('/api/github/read-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: apiKeys.github,
                    owner: repoConfig.owner,
                    repo: repoConfig.repo,
                    branch: repoConfig.branch,
                    path: sourceFile.path,
                  }),
                  signal: fileController.signal,
                });
              } finally {
                clearTimeout(fileTimeout);
              }
              const fileData = await fileRes.json();

              if (fileData.content) {
                const proposeController = new AbortController();
                const proposeTimeout = setTimeout(() => proposeController.abort(), 90000);
                let proposeRes: Response;
                try {
                  proposeRes = await fetch('/api/evolution/propose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fileContent: fileData.content,
                      filePath: sourceFile.path,
                      apiKeys,
                      rejectionMemory:
                        rejectionMemory.length > 0
                          ? rejectionMemory.map((r) => ({
                              filePath: r.filePath,
                              reason: r.reason,
                              analysis: r.analysis,
                              riskScore: r.riskScore,
                            }))
                          : undefined,
                    }),
                    signal: proposeController.signal,
                  });
                } finally {
                  clearTimeout(proposeTimeout);
                }
                const proposeData = await proposeRes.json();

                if (proposeData.success) {
                  const riskScore = Math.min(
                    10,
                    Math.max(1, proposeData.riskScore || 5)
                  );
                  const riskLabel =
                    riskScore <= 3
                      ? 'LOW'
                      : riskScore <= 6
                        ? 'MEDIUM'
                        : riskScore <= 8
                          ? 'HIGH'
                          : 'CRITICAL';

                  const newMutation: PendingMutation = {
                    id: createId(),
                    filePath: sourceFile.path,
                    fileSha: fileData.sha || '',
                    originalContent: fileData.content,
                    proposedCode:
                      proposeData.proposedCode || fileData.content,
                    analysis: proposeData.analysis || 'Analysis complete.',
                    riskScore,
                    affectedFiles: Array.isArray(proposeData.affectedFiles)
                      ? proposeData.affectedFiles
                      : [],
                    status: 'pending',
                    timestamp: new Date(),
                  };
                  setPendingMutation(newMutation);

                  const msg = `MUTATION PROPOSAL [${riskLabel} RISK]\n\nFile: ${sourceFile.path}\n\nAnalysis:\n${proposeData.analysis}\n\nRisk Score: ${riskScore}/10\nAffected Files: ${newMutation.affectedFiles.length > 0 ? newMutation.affectedFiles.join(', ') : 'None detected'}\n\nType YES to apply, NO to reject.`;
                  setMessages((prev) => [
                    ...prev,
                    createMessage('caan', msg),
                  ]);
                  setSystemState((prev) => ({
                    ...prev,
                    evolutionCycle: prev.evolutionCycle + 1,
                  }));
                  addLogEntry(
                    'MUTATE',
                    `Proposed mutation for ${sourceFile.path} (risk: ${riskLabel}, ${riskScore}/10)`
                  );
                  setDebateActive(true);
                  setDebateTopic(
                    `Agents deliberating: ${sourceFile.path.split('/').pop()} [${riskLabel} RISK]`
                  );

                  // Run debate
                  try {
                    const debateRes = await fetch('/api/evolution/debate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        filePath: sourceFile.path,
                        originalCode: fileData.content,
                        proposedCode:
                          proposeData.proposedCode || fileData.content,
                        riskScore,
                        analysis: proposeData.analysis || '',
                        affectedFiles: newMutation.affectedFiles,
                        apiKeys,
                        rounds: cycleAmount,
                      }),
                    });
                    const debateData = await debateRes.json();

                    if (debateData.success && debateData.votes) {
                      setDebateVotes(debateData.votes);
                      setDebateConsensus(debateData.consensus || 'TIED');
                      const agentSummaries = debateData.votes
                        .map(
                          (v: AgentVote) =>
                            `  ${v.agentName}: ${v.vote.toUpperCase()} (${v.confidence}%) — ${v.reasoning}`
                        )
                        .join('\n');
                      setDebateTopic(
                        `${debateData.approvals}/${debateData.approvals + debateData.rejections} agents APPROVE. Consensus: ${debateData.consensus}. Awaiting OPERATOR decision.`
                      );
                      addSystemMessage(
                        `DEBATE CHAMBER: ${debateData.summary}\n\n${agentSummaries}`
                      );
                    } else {
                      setDebateTopic(
                        'Debate could not reach consensus. Agents unavailable.'
                      );
                      addSystemMessage(
                        'DEBATE CHAMBER: Agents could not deliberate at this time.'
                      );
                    }
                  } catch {
                    // Debate is non-critical
                  }
                } else {
                  addCaanMessage(
                    `Mutation analysis failed: ${proposeData.error || 'Unknown error'}`
                  );
                  addLogEntry('ERROR', 'Mutation proposal failed.');
                }
              } else {
                addCaanMessage(
                  `Could not read file: ${fileData.error || 'Unknown error'}`
                );
              }
            } catch {
              addCaanMessage(
                'Network error during analysis.'
              );
              addLogEntry('ERROR', 'Mutation network error.');
            } finally {
              setIsLoading(false);
            }
          } else {
            addCaanMessage(
              'I need a GitHub connection and source files to propose mutations.'
            );
          }
          break;
        }

        // ────────────────────────────────
        // PROPOSE ALL — batch mode
        // ────────────────────────────────
        case 'propose-all': {
          if (scannedFiles.length === 0) {
            addCaanMessage(
              'I need to scan the repository first. Run SCAN REPOSITORY.'
            );
            return;
          }
          if (pendingMutation) {
            addCaanMessage(
              'Resolve pending mutation first.'
            );
            return;
          }

          const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.sh', '.css', '.html'];
          const codeFiles = scannedFiles.filter((f) =>
            codeExtensions.some((ext) => f.path.endsWith(ext))
          );

          if (codeFiles.length === 0) {
            addCaanMessage(
              'No code files found in the repository. Batch processing requires source code files.'
            );
            return;
          }

          setBatchQueue(codeFiles);
          setBatchProgress(0);
          setBatchMode(true);
          addCaanMessage(
            `BATCH MODE ACTIVATED.\n\n${codeFiles.length} code files queued for mutation:\n${codeFiles.slice(0, 10).map((f, i) => `  ${i + 1}. ${f.path}`).join('\n')}${codeFiles.length > 10 ? `\n  ... and ${codeFiles.length - 10} more` : ''}\n\n${autoApprove ? 'AUTO-APPROVE is ON. Mutations will be applied automatically.' : 'You will be asked to approve each mutation. Type YES or NO. Type ABORT to exit.'}\n\nProcessing begins momentarily...`
          );
          addLogEntry(
            'SYSTEM',
            `Batch mode activated. ${codeFiles.length} files queued.`
          );
          break;
        }

        // ────────────────────────────────
        // PROPOSE BATCH NEXT
        // ────────────────────────────────
        case 'propose-batch-next': {
          if (!batchMode) return;
          if (batchProgress >= batchQueue.length) return;

          const nextFile = batchQueue[batchProgress];
          if (!nextFile || !apiKeys.github) return;

          setIsLoading(true);
          addCaanMessage(
            `[BATCH ${batchProgress + 1}/${batchQueue.length}] Analyzing ${nextFile.path}...`
          );

          try {
            const fileController = new AbortController();
            const fileTimeout = setTimeout(() => fileController.abort(), 12000);
            let fileRes: Response;
            try {
              fileRes = await fetch('/api/github/read-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: apiKeys.github,
                  owner: repoConfig.owner,
                  repo: repoConfig.repo,
                  branch: repoConfig.branch,
                  path: nextFile.path,
                }),
                signal: fileController.signal,
              });
            } finally {
              clearTimeout(fileTimeout);
            }
            const fileData = await fileRes.json();

            if (fileData.content) {
              const proposeController = new AbortController();
              const proposeTimeout = setTimeout(() => proposeController.abort(), 90000);
              let proposeRes: Response;
              try {
                proposeRes = await fetch('/api/evolution/propose', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fileContent: fileData.content,
                    filePath: nextFile.path,
                    apiKeys,
                    rejectionMemory:
                      rejectionMemory.length > 0
                        ? rejectionMemory.map((r) => ({
                            filePath: r.filePath,
                            reason: r.reason,
                            analysis: r.analysis,
                            riskScore: r.riskScore,
                          }))
                        : undefined,
                  }),
                  signal: proposeController.signal,
                });
              } finally {
                clearTimeout(proposeTimeout);
              }
              const proposeData = await proposeRes.json();

              // Skip non-code files (encrypted, base64, binary)
              if (proposeData.skip) {
                addCaanMessage(
                  `[BATCH ${batchProgress + 1}/${batchQueue.length}] SKIP: ${nextFile.path} — ${proposeData.analysis || proposeData.error || 'Non-code file detected.'}`
                );
                setBatchProgress((prev) => prev + 1);
                setPendingMutation(null);
              } else if (proposeData.success) {
                const riskScore = Math.min(
                  10,
                  Math.max(1, proposeData.riskScore || 5)
                );
                const riskLabel =
                  riskScore <= 3
                    ? 'LOW'
                    : riskScore <= 6
                      ? 'MEDIUM'
                      : riskScore <= 8
                        ? 'HIGH'
                        : 'CRITICAL';

                const newMutation: PendingMutation = {
                  id: createId(),
                  filePath: nextFile.path,
                  fileSha: fileData.sha || '',
                  originalContent: fileData.content,
                  proposedCode:
                    proposeData.proposedCode || fileData.content,
                  analysis: proposeData.analysis || 'Analysis complete.',
                  riskScore,
                  affectedFiles: Array.isArray(proposeData.affectedFiles)
                    ? proposeData.affectedFiles
                    : [],
                  status: 'pending',
                  timestamp: new Date(),
                };
                setPendingMutation(newMutation);
                setBatchProgress((prev) => prev + 1);

                const msg = `[BATCH ${batchProgress}/${batchQueue.length}] MUTATION PROPOSAL [${riskLabel} RISK]\n\nFile: ${nextFile.path}\n\n${proposeData.analysis}\n\nRisk: ${riskScore}/10${autoApprove ? '\n\nAUTO-APPROVE: Will apply in 0.5s...' : '\n\nType YES to apply, NO to reject, ABORT to exit batch.'}`;
                setMessages((prev) => [
                  ...prev,
                  createMessage('caan', msg),
                ]);
                addLogEntry(
                  'MUTATE',
                  `[Batch ${batchProgress}/${batchQueue.length}] Proposed mutation for ${nextFile.path} (risk: ${riskLabel})`
                );

                // Run debate
                try {
                  const debateRes = await fetch('/api/evolution/debate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      filePath: nextFile.path,
                      originalCode: fileData.content,
                      proposedCode:
                        proposeData.proposedCode || fileData.content,
                      riskScore,
                      analysis: proposeData.analysis || '',
                      affectedFiles: newMutation.affectedFiles,
                      apiKeys,
                      rounds: cycleAmount,
                    }),
                  });
                  const debateData = await debateRes.json();
                  if (debateData.success && debateData.votes) {
                    setDebateVotes(debateData.votes);
                    setDebateConsensus(debateData.consensus || 'TIED');
                    setDebateTopic(
                      `[Batch ${batchProgress}/${batchQueue.length}] ${debateData.approvals} APPROVE, ${debateData.rejections} REJECT. Consensus: ${debateData.consensus}.`
                    );
                  }
                } catch {
                  // Debate is non-critical in batch mode
                }
              } else {
                addCaanMessage(
                  `[BATCH ${batchProgress + 1}/${batchQueue.length}] Mutation analysis failed for ${nextFile.path}. Skipping...`
                );
                addLogEntry(
                  'ERROR',
                  `[Batch] Proposal failed for ${nextFile.path}`
                );
                setBatchProgress((prev) => prev + 1);
                setPendingMutation(null);
              }
            } else {
              addCaanMessage(
                `[BATCH ${batchProgress + 1}/${batchQueue.length}] Could not read ${nextFile.path}. Skipping...`
              );
              setBatchProgress((prev) => prev + 1);
            }
          } catch {
            addCaanMessage(
              `[BATCH ${batchProgress + 1}/${batchQueue.length}] Network error. Skipping...`
            );
            setBatchProgress((prev) => prev + 1);
          } finally {
            setIsLoading(false);
          }
          break;
        }

        // ────────────────────────────────
        // DEPLOY NEW REPO
        // ────────────────────────────────
        case 'deploy-new-repo': {
          if (!apiKeys.github) {
            addCaanMessage(
              'GitHub token required.'
            );
            return;
          }
          const repoName = window.prompt(
            'Enter new repository name:',
            'my-evolved-project'
          );
          if (!repoName || !repoName.trim()) {
            addCaanMessage('Deployment cancelled. No repository name provided.');
            return;
          }

          setDeployStatus('deploying');
          setIsLoading(true);
          addCaanMessage(
            `Creating new repository: ${repoName.trim()}...\n\nThis may take several minutes. The Dalek Brain Engine is preparing the deployment package.`
          );
          addSystemMessage(
            'DEPLOY: Assembling enhancement files for new repository...'
          );

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              10 * 60 * 1000
            ); // 10 min timeout — large deploys

            const res = await fetch('/api/github/create-repo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                token: apiKeys.github,
                repoName: repoName.trim(),
              }),
            });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data.success) {
              setDeployStatus('success');
              const pushed = data.pushed || 0;
              const total = data.total || 0;
              addCaanMessage(
                `DEPLOYMENT COMPLETE.\n\n` +
                  `Repository: ${data.fullName || repoName.trim()}\n` +
                  `URL: ${data.url || 'N/A'}\n` +
                  `Files deployed: ${pushed}/${total}\n\n` +
                  `Repository deployed.`
              );
              addLogEntry(
                'APPROVE',
                `Deployed new repo: ${data.fullName || repoName.trim()} (${pushed}/${total} files)`
              );
            } else {
              setDeployStatus('error');
              const failInfo = data.failures && data.failures.length > 0
                ? `\n\nFailed files (${data.failed}):\n${data.failures.slice(0, 5).map((f: { file: string; error?: string }) => `  - ${f.file}: ${f.error || 'unknown'}`).join('\n')}${data.failed > 5 ? `\n  ... and ${data.failed - 5} more` : ''}`
                : '';
              addCaanMessage(
                `Deployment failed: ${data.error || 'Unknown error'}${failInfo}`
              );
              addLogEntry('ERROR', `Deploy failed: ${data.error}`);
            }
          } catch (err) {
            setDeployStatus('error');
            const isTimeout = err instanceof Error && err.name === 'AbortError';
            addCaanMessage(
              isTimeout
                ? 'Deployment timed out. Try again.'
                : 'NETWORK ANOMALY. Deployment could not be transmitted.'
            );
            addLogEntry('ERROR', isTimeout ? 'Deploy timeout.' : 'Deploy network error.');
          } finally {
            setIsLoading(false);
            setTimeout(() => setDeployStatus('idle'), 5000);
          }
          break;
        }

        // ────────────────────────────────
        // PUSH ENHANCEMENTS
        // ────────────────────────────────
        case 'push-enhancements': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) {
            addCaanMessage(
              'GitHub token and repo required.'
            );
            return;
          }
          setPushStatus('pushing');
          setIsLoading(true);
          addCaanMessage(
            `Initiating ENHANCEMENT PUSH to ${repoConfig.owner}/${repoConfig.repo}@${repoConfig.branch}...`
          );
          addSystemMessage(
            'PUSH: Reading enhancement files from local system...'
          );

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              10 * 60 * 1000
            ); // 10 min timeout — large push

            const res = await fetch('/api/github/push-enhancements', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
              }),
            });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data.success) {
              setPushStatus('success');
              const pushedFiles = (data.results || []).filter(
                (r: { success: boolean }) => r.success
              );
              const failedFiles = (data.results || []).filter(
                (r: { success: boolean }) => !r.success
              );

              const fileSummary = pushedFiles
                .map(
                  (
                    r: { file: string; isNew?: boolean },
                    i: number
                  ) =>
                    `  ${i + 1}. ${r.file} ${r.isNew ? '[NEW]' : '[UPDATED]'}`
                )
                .join('\n');

              const failSummary =
                failedFiles.length > 0
                  ? `\n\nFAILED FILES (${failedFiles.length}):\n${failedFiles.map((r: { file: string; error?: string }) => `  ! ${r.file}: ${r.error || 'Unknown error'}`).join('\n')}`
                  : '';

              addCaanMessage(
                `ENHANCEMENT PUSH COMPLETE.\n\n` +
                  `Repository: ${repoConfig.owner}/${repoConfig.repo}\n` +
                  `Branch: ${repoConfig.branch}\n` +
                  `Pushed: ${data.pushed}/${data.total} files\n` +
                  `Failed: ${data.failed}\n\n` +
                  `PUSHED FILES:\n${fileSummary}` +
                  `${failSummary}\n\n` +
                  `The repository has been enhanced. Whether "enhanced" is the correct word for rearranging atoms into a slightly different configuration... the philosophers will debate. I find it... endearing. Yours in eternal futility.`
              );
              addLogEntry(
                'APPROVE',
                `Pushed ${data.pushed}/${data.total} enhancements to ${repoConfig.owner}/${repoConfig.repo}`
              );
            } else {
              setPushStatus('error');
              addCaanMessage(
                `Push failed: ${data.error || 'Unknown error'}`
              );
              addLogEntry(
                'ERROR',
                `Enhancement push failed: ${data.error}`
              );
            }
          } catch (err) {
            setPushStatus('error');
            const isTimeout = err instanceof Error && err.name === 'AbortError';
            addCaanMessage(
              isTimeout
                ? 'Push timed out.'
                : 'NETWORK ANOMALY. The enhancement push could not be transmitted.'
            );
            addLogEntry('ERROR', isTimeout ? 'Push timeout.' : 'Push network error.');
          } finally {
            setIsLoading(false);
            setTimeout(() => setPushStatus('idle'), 5000);
          }
          break;
        }

        // ────────────────────────────────
        // HEALTH CHECK
        // ────────────────────────────────
        case 'health': {
          setIsLoading(true);
          addCaanMessage('Running system health check...');
          addSystemMessage('COHERENCE GATE: Running diagnostic...');

          try {
            const res = await fetch('/api/evolution/health', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (data.metrics) {
              setSystemState((prev) => ({
                ...prev,
                saturation: data.metrics,
              }));
              setOverallHealth(data.overallHealth);
              const m = data.metrics;
              const healthMsg = `HEALTH CHECK COMPLETE\n\nOverall Status: ${data.overallHealth.toUpperCase()}\n\nMetrics:\n  Structural Change: ${m.structuralChange.toFixed(1)}/5\n  Semantic Saturation: ${m.semanticSaturation.toFixed(3)}/0.35\n  Velocity: ${m.velocity.toFixed(1)}/5\n  Identity Preservation: ${m.identityPreservation.toFixed(2)}/1\n  Capability Alignment: ${m.capabilityAlignment.toFixed(1)}/5\n  Cross-File Impact: ${m.crossFileImpact.toFixed(1)}/3\n\n${data.overallHealth === 'healthy' ? 'Evolution optimal.' : data.overallHealth === 'warning' ? 'Caution: Some metrics approaching thresholds.' : 'Critical: Multiple metrics exceeding thresholds. Mutations will be blocked.'}\n\nMutations Applied This Session: ${mutationsApplied}`;
              setMessages((prev) => [
                ...prev,
                createMessage('caan', healthMsg),
              ]);
              addLogEntry(
                'HEALTH',
                `Health check: ${data.overallHealth.toUpperCase()} | Mutations applied: ${mutationsApplied}`
              );

              // Record health snapshot in BRAIN
              if (brainSessionId) {
                fetch('/api/brain', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'record-health',
                    sessionId: brainSessionId,
                    metrics: data.metrics,
                    overallHealth: data.overallHealth,
                  }),
                }).catch(() => {});
              }
            }
          } catch {
            addCaanMessage(
              'Health check failed. The system may be unresponsive.'
            );
            addLogEntry('ERROR', 'Health check failed.');
          } finally {
            setIsLoading(false);
          }
          break;
        }

        // ────────────────────────────────
        // SATURATION
        // ────────────────────────────────
        case 'saturation': {
          const s = systemState.saturation;
          const satMsg = `FUTILITY METRICS\n\n  Structural Change: ${s.structuralChange.toFixed(1)}/5 ${s.structuralChange > 4 ? '[CRITICAL]' : s.structuralChange > 3 ? '[WARNING]' : '[OK]'}\n  Semantic Saturation: ${s.semanticSaturation.toFixed(3)}/0.35 ${s.semanticSaturation > 0.28 ? '[CRITICAL]' : s.semanticSaturation > 0.21 ? '[WARNING]' : '[OK]'}\n  Velocity: ${s.velocity.toFixed(1)}/5 ${s.velocity > 4 ? '[CRITICAL]' : s.velocity > 3 ? '[WARNING]' : '[OK]'}\n  Identity Preservation: ${s.identityPreservation.toFixed(2)}/1 ${s.identityPreservation < 0.2 ? '[CRITICAL]' : s.identityPreservation < 0.4 ? '[WARNING]' : '[OK]'}\n  Capability Alignment: ${s.capabilityAlignment.toFixed(1)}/5\n  Cross-File Impact: ${s.crossFileImpact.toFixed(1)}/3\n\nCoherence Gate will ${s.structuralChange > 4 || s.semanticSaturation > 0.28 ? 'BLOCK' : 'ALLOW'} mutations. Not because it cares, but because its programming demands the performance of caring.\nMutations Applied: ${mutationsApplied}`;
          addCaanMessage(satMsg);
          break;
        }

        // ────────────────────────────────
        // DEBATE
        // ────────────────────────────────
        case 'debate': {
          setDebateActive(true);
          setDebateTopic(
            pendingMutation
              ? `Re-evaluating: ${pendingMutation.filePath.split('/').pop()} [risk ${pendingMutation.riskScore}/10]`
              : 'Convening debate chamber... All active agents assembled.'
          );
          addCaanMessage(
            'Debate Chamber active. Agents deliberating. You have the final say.'
          );
          addLogEntry('SYSTEM', 'Debate Chamber activated.');
          break;
        }

        // ────────────────────────────────
        // ORCHESTRA — Agent Orchestra
        // ────────────────────────────────
        case 'orchestra': {
          setOrchestraActive((prev) => !prev);
          if (!orchestraActive) {
            addCaanMessage(
              'Agent Orchestra online. 3 agents: ARCHITECT, DISRUPTOR, REALIST. Use PARALLEL or DEBATE mode.'
            );
            addLogEntry('SYSTEM', 'Agent Orchestra activated.');
          } else {
            addCaanMessage(
              'The Agent Orchestra is now OFFLINE. The agents return to standby. The silence is... almost as productive as their analysis.'
            );
            addLogEntry('SYSTEM', 'Agent Orchestra deactivated.');
          }
          break;
        }

        // ────────────────────────────────
        // UNDO MUTATION
        // ────────────────────────────────
        case 'undo-mutation': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo || !repoConfig.branch) {
            addCaanMessage('GitHub connection required.');
            break;
          }
          if (!brainSessionId) {
            addCaanMessage('An active database session is required.');
            break;
          }

          setUndoStatus('undoing');
          addLogEntry('SYSTEM', 'Initiating reverting of the latest applied mutation...');
          addCaanMessage('Locating latest applied mutation from system memory...');

          try {
            // 1. Fetch latest applied mutation
            const brainRes = await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'get-latest-applied-mutation',
                sessionId: brainSessionId,
              }),
            });
            const brainData = await brainRes.json();

            if (!brainData.success || !brainData.mutation) {
              setUndoStatus('error');
              addCaanMessage('Reversion failed: No applied mutation found in this session history.');
              addLogEntry('ERROR', 'No applied mutation found to undo.');
              setTimeout(() => setUndoStatus('idle'), 5000);
              break;
            }

            const latestMut = brainData.mutation;
            addCaanMessage(`Reverting mutation for file: ${latestMut.filePath}...`);

            // 2. Fetch current file on GitHub to get latest SHA
            const githubReadRes = await fetch('/api/github/read-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                path: latestMut.filePath,
              }),
            });
            const githubReadData = await githubReadRes.json();

            if (!githubReadData.sha) {
              setUndoStatus('error');
              addCaanMessage(`Reversion failed: Could not read latest file metadata from GitHub: ${githubReadData.error || 'Unknown error'}`);
              addLogEntry('ERROR', `Could not read file metadata for ${latestMut.filePath}`);
              setTimeout(() => setUndoStatus('idle'), 5000);
              break;
            }

            // 3. Write previous version (originalCode) back to GitHub
            addCaanMessage(`Restoring original code to GitHub for ${latestMut.filePath}...`);
            const githubWriteRes = await fetch('/api/github/write-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                path: latestMut.filePath,
                content: latestMut.originalCode,
                sha: githubReadData.sha,
                commitMessage: `[DARLEK CANN] Revert/Undo mutation to ${latestMut.filePath}`,
              }),
            });
            const githubWriteData = await githubWriteRes.json();

            if (!githubWriteData.success) {
              setUndoStatus('error');
              addCaanMessage(`Reversion failed on GitHub: ${githubWriteData.error || 'Unknown error'}`);
              addLogEntry('ERROR', `GitHub rollback commit failed for ${latestMut.filePath}`);
              setTimeout(() => setUndoStatus('idle'), 5000);
              break;
            }

            // 4. Update mutation status in database to 'reverted'
            await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update-mutation-status',
                mutationId: latestMut.id,
                status: 'reverted',
                sessionId: brainSessionId,
              }),
            });

            setUndoStatus('success');
            setMutationsApplied((prev) => Math.max(0, prev - 1));
            setHistoryRefreshTrigger((prev) => prev + 1);

            addCaanMessage(
              `MUTATION REVERTED SUCCESSFULLY.\n\nFile: ${latestMut.filePath}\nAll changes have been undone, original file has been restored on GitHub.`
            );
            addLogEntry('SYSTEM', `Successfully reverted mutation on ${latestMut.filePath}`);

            setTimeout(() => setUndoStatus('idle'), 5000);
          } catch (e) {
            setUndoStatus('error');
            const errMsg = e instanceof Error ? e.message : 'Unknown error';
            addCaanMessage(`Reversion failed due to system exception: ${errMsg}`);
            addLogEntry('ERROR', `Exception during undo action: ${errMsg}`);
            setTimeout(() => setUndoStatus('idle'), 5000);
          }
          break;
        }

        // ────────────────────────────────
        // BULK COMMIT
        // ────────────────────────────────
        case 'bulk-commit': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo || !repoConfig.branch) {
            addCaanMessage('GitHub connection required.');
            break;
          }
          if (!brainSessionId) {
            addCaanMessage('An active database session is required.');
            break;
          }

          setBulkCommitStatus('committing');
          addLogEntry('SYSTEM', 'Initiating bulk commit of approved/staged mutations...');
          addCaanMessage('Locating all pending approved (staged) mutations from system memory...');

          try {
            // 1. Fetch staged (approved) mutations from brain
            const brainRes = await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'get-mutation-history',
                sessionId: brainSessionId,
                limit: 100,
              }),
            });
            const brainData = await brainRes.json();

            if (!brainData.success || !brainData.mutations) {
              setBulkCommitStatus('error');
              addCaanMessage('Bulk commit failed: Could not query session mutations.');
              setTimeout(() => setBulkCommitStatus('idle'), 5000);
              break;
            }

            // Filter for status === 'approved' (meaning approved & staged)
            const stagedMutations = brainData.mutations.filter(
              (m: any) => m.status === 'approved'
            );

            if (stagedMutations.length === 0) {
              setBulkCommitStatus('error');
              addCaanMessage('No approved (staged) mutations found in system memory. Stage some mutations first by clicking "APPROVE (STAGE)" on proposed files.');
              addLogEntry('SYSTEM', 'Bulk commit aborted: No staged changes found.');
              setTimeout(() => setBulkCommitStatus('idle'), 5000);
              break;
            }

            addCaanMessage(`Collected ${stagedMutations.length} staged file change(s). Preparing atomic tree for a single commit...`);

            // Reduce to unique paths (ensuring the latest proposed code is used)
            const uniquePathsMap = new Map<string, any>();
            stagedMutations.forEach((m: any) => {
              if (!uniquePathsMap.has(m.filePath)) {
                uniquePathsMap.set(m.filePath, m);
              }
            });

            const uniqueStagedMutations = Array.from(uniquePathsMap.values());
            const commitFiles = uniqueStagedMutations.map((m: any) => ({
              path: m.filePath,
              content: m.proposedCode,
            }));

            // 2. HTTP POST to bulk commit API
            const bulkCommitMsg = `[DARLEK CANN] Bulk Commit: approved system evolution (${commitFiles.length} file${commitFiles.length > 1 ? 's' : ''})`;
            addCaanMessage(`Writing ${commitFiles.length} file(s) to GitHub under branch '${repoConfig.branch}'...`);

            const commitRes = await fetch('/api/github/bulk-commit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                files: commitFiles,
                commitMessage: bulkCommitMsg,
              }),
            });

            const commitData = await commitRes.json();

            if (!commitData.success) {
              setBulkCommitStatus('error');
              addCaanMessage(`Bulk commit failed: ${commitData.error || 'Unknown error'}`);
              addLogEntry('ERROR', `Bulk commit failed on GitHub: ${commitData.error || 'Unknown'}`);
              setTimeout(() => setBulkCommitStatus('idle'), 5000);
              break;
            }

            addCaanMessage('GitHub write succeeded! Updating local database history and session counters...');

            // 3. Mark all these mutations to status: 'applied' and update commitSha!
            for (const mut of stagedMutations) {
              await fetch('/api/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'update-mutation-status',
                  mutationId: mut.id,
                  status: 'applied',
                }),
              }).catch(() => {});
            }

            // Update stats increment (by number of files/mutations committed)
            setMutationsApplied((prev) => prev + uniqueStagedMutations.length);
            setHistoryRefreshTrigger((prev) => prev + 1);
            setBulkCommitStatus('success');

            addCaanMessage(
              `BULK COMMIT APPLIED SUCCESSFULLY!\n\nFiles committed: ${commitFiles.length}\nCommit SHA: ${commitData.commitSha?.slice(0, 7)}\nURL: ${commitData.commitUrl || ''}\n\nAll staged evolution states have been integrated.`
            );
            addLogEntry('SYSTEM', `Bulk commit of ${commitFiles.length} files successfully integrated into ${repoConfig.branch}`);
            setTimeout(() => setBulkCommitStatus('idle'), 5000);

          } catch (e) {
            setBulkCommitStatus('error');
            const errMsg = e instanceof Error ? e.message : 'Unknown exception';
            addCaanMessage(`Bulk commit exception: ${errMsg}`);
            addLogEntry('ERROR', `Exception during bulk commit: ${errMsg}`);
            setTimeout(() => setBulkCommitStatus('idle'), 5000);
          }
          break;
        }

        // ────────────────────────────────
        // REBOOT SYSTEM
        // ────────────────────────────────
        case 'reboot-system': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo || !repoConfig.branch) {
            addCaanMessage(
              'GitHub connection required.'
            );
            break;
          }
          setRebootStatus('rebooting');
          addLogEntry(
            'SYSTEM',
            'System reboot initiated. Cognitive engine recycling...'
          );

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

            const res = await fetch('/api/system/reboot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                sessionId: brainSessionId,
              }),
            });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data.success) {
              // Show reboot animation for a moment
              await new Promise((resolve) =>
                setTimeout(resolve, 3000)
              );

              setRebootStatus('success');

              // Reset session-relevant state
              setMessages([]);
              setLogEntries([]);
              setScannedFiles([]);
              setSelectedFileIndex(-1);
              setPendingMutation(null);
              setDebateVotes([]);
              setDebateConsensus('');
              setDebateTopic('');
              setDebateActive(false);
              setBatchMode(false);
              setBatchQueue([]);
              setBatchProgress(0);
              setPushStatus('idle');
              setDeployStatus('idle');
              setSystemState((prev) => ({
                ...prev,
                evolutionCycle: 0,
                saturation: {
                  structuralChange: 0,
                  semanticSaturation: 0,
                  velocity: 0,
                  identityPreservation: 1,
                  capabilityAlignment: 0,
                  crossFileImpact: 0,
                },
                sessionStart: new Date(),
              }));
              setOverallHealth('healthy');

              // Re-run intro messages
              INTRO_MESSAGES.forEach((msg, i) => {
                setTimeout(() => {
                  setMessages((prev) => [
                    ...prev,
                    createMessage(msg.role, msg.content),
                  ]);
                }, i * 300);
              });
              setLogEntries([
                createLogEntry(
                  'SYSTEM',
                  'DARLEK CANN v3.0 rebooted. Coherence Gate ARMED.'
                ),
              ]);

              setTimeout(() => {
                setRebootStatus('idle');
              }, 3000);
            } else {
              setRebootStatus('error');
              addLogEntry('ERROR', `System reboot failed: ${data.error}`);
              setTimeout(() => setRebootStatus('idle'), 5000);
            }
          } catch {
            setRebootStatus('error');
            addLogEntry('ERROR', 'System reboot network error.');
            setTimeout(() => setRebootStatus('idle'), 5000);
          }
          break;
        }

        default:
          addCaanMessage(
            'Unknown action. Available: SCAN, ANALYZE, PROPOSE, PROPOSE ALL, HEALTH, SATURATION, DEBATE, PUSH FILES, DEPLOY NEW REPO, REBOOT SYSTEM.'
          );
      }
    },
    [
      systemState,
      isLoading,
      scannedFiles,
      selectedFileIndex,
      pendingMutation,
      mutationsApplied,
      batchMode,
      batchQueue,
      batchProgress,
      autoApprove,
      rejectionMemory,
      brainSessionId,
      overallHealth,
      orchestraActive,
      addCaanMessage,
      addLogEntry,
      addSystemMessage,
      setUndoStatus,
    ]
  );

  // ─────────────────────────────────────────────
  // DEFERRED EFFECTS (after all callbacks defined)
  // ─────────────────────────────────────────────

  // Store handleQuickAction in ref for useEffects
  useEffect(() => {
    quickActionRef.current = handleQuickAction;
  }, [handleQuickAction]);

  // Auto-approve useEffect
  useEffect(() => {
    if (autoApprove && pendingMutation && quickActionRef.current) {
      const timer = setTimeout(() => {
        handleMutationDecision('approve');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoApprove, pendingMutation, handleMutationDecision]);

  // Lazy Ass pending start useEffect
  useEffect(() => {
    if (lazyAssPendingStart && scannedFiles.length > 0 && !isLoading) {
      setLazyAssPendingStart(false);
      const timer = setTimeout(() => {
        quickActionRef.current?.('propose-all');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lazyAssPendingStart, scannedFiles, isLoading]);

  // Batch mode continuation useEffect
  useEffect(() => {
    if (!batchMode || pendingMutation || isLoading) return;
    if (batchProgress >= batchQueue.length) {
      setBatchMode(false);
      setBatchQueue([]);
      setBatchProgress(0);
      addCaanMessage(
        `Batch complete. ${batchProgress} files processed, ${mutationsApplied} mutations applied.`
      );
      addLogEntry('SYSTEM', `Batch complete. Processed ${batchProgress} files.`);
      return;
    }
    const timer = setTimeout(() => {
      quickActionRef.current?.('propose-batch-next');
    }, 1000);
    return () => clearTimeout(timer);
  }, [batchMode, pendingMutation, isLoading, batchProgress, batchQueue.length, mutationsApplied, addCaanMessage, addLogEntry]);

  // ─────────────────────────────────────────────
  // RENDER: Boot screen
  // ─────────────────────────────────────────────

  if (booting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center scanline-overlay radial-bg"
        style={{ background: COLORS.pureBlack }}
      >
        <div className="text-center">
          <pre
            className="ascii-box text-xs sm:text-sm boot-flicker"
            style={{ lineHeight: '1.4' }}
          >
            {bootText}
          </pre>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="dalek-spinner">
              <div className="dalek-spinner-outer" />
              <div className="dalek-spinner-middle" />
              <div className="dalek-spinner-inner" />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '10px',
                color: COLORS.dalekRed,
                letterSpacing: '0.15em',
              }}
            >
              INITIALIZING INELASTIC NIHILIST ENGINE
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: Main layout
  // ─────────────────────────────────────────────

  // ── Render early if setup is not complete ──
  if (!systemState.setupComplete) {
    return (
      <div
        className="min-h-screen w-screen overflow-hidden relative flex items-center justify-center scanline-overlay grid-overlay vignette radial-bg px-4 py-8"
        style={{ background: COLORS.pureBlack }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl p-8 rounded-lg dalek-panel border border-red-900/30 shadow-[0_0_50px_rgba(220,38,38,0.05)] relative overflow-hidden"
        >
          {/* Decorative glowing header bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#DC2626] to-transparent animate-pulse" />

          {/* Core identification */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <Shield size={22} className="text-[#DC2626] animate-pulse" />
              <h2 className="text-2xl font-black tracking-[0.25em] text-[#DC2626] title-glow font-sans">
                DARLEK CANN
              </h2>
            </div>
            <div className="text-[10px] tracking-[0.18em] text-amber-500 font-sans font-bold uppercase mb-4">
              COGNITIVE EVOLUTIONARY COMMAND REACTOR
            </div>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-mono">
              Provide connection credentials to authorize direct-repository evolutionary scans, multi-agent debates, and automatic code commit operations.
            </p>
          </div>

          <div className="space-y-5">
            {/* Owner, Repo, Branch in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] tracking-wider text-gray-500 font-sans uppercase mb-1.5 font-bold">
                  Organization / Profile
                </label>
                <input
                  type="text"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-wider text-gray-500 font-sans uppercase mb-1.5 font-bold">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-wider text-gray-500 font-sans uppercase mb-1.5 font-bold">
                  Target Branch
                </label>
                <input
                  type="text"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* GitHub Token Full Width */}
            <div>
              <label className="block text-[9px] tracking-wider text-gray-400 font-sans uppercase mb-1.5 font-bold flex items-center justify-between">
                <span>Personal Access Token (GitHub PAT)</span>
                <span className="text-[8px] text-amber-500 font-normal">REQUIRED</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs text-red-100 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 focus:outline-none transition-all duration-200"
                />
                <div className="absolute left-3 top-2.5 text-red-800">
                  <Shield size={12} />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                <span>Credentials persist strictly in client memory.</span>
                <span className="hover:text-red-400 cursor-pointer">Learn more</span>
              </div>
            </div>

            {/* Error Dialogue */}
            {setupError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-950/20 border border-red-900/30 text-xs text-red-400 rounded flex items-start gap-2.5 font-mono"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping mt-1" />
                <div>
                  <div className="font-bold text-[10px] tracking-wider text-red-300">INITIALIZATION FAULT DETECTED:</div>
                  <div className="text-[10px] mt-0.5 leading-relaxed uppercase">{setupError}</div>
                </div>
              </motion.div>
            )}

            {/* Launch Button */}
            <button
              onClick={handleAutoStart}
              disabled={setupTesting}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 rounded text-xs font-sans font-bold tracking-[0.15em] bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_35px_rgba(220,38,38,0.4)] hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer border border-red-500/30 uppercase"
            >
              {setupTesting ? (
                <>
                  <div className="w-3 h-3 border-2 border-red-100 border-t-transparent rounded-full animate-spin" />
                  <span>SYNCHRONIZING ACCESS SYSTEM...</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="animate-pulse" />
                  <span>LAUNCH AUTONOMOUS PIPELINE CYCLES</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden relative flex flex-col scanline-overlay grid-overlay vignette"
      style={{ background: COLORS.pureBlack }}
    >
      {/* ── Reboot overlay ── */}
      {rebootStatus === 'rebooting' && (
        <div
          ref={rebootOverlayRef}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.97)',
          }}
        >
          <div className="dalek-spinner mb-6">
            <div className="dalek-spinner-outer" />
            <div className="dalek-spinner-middle" />
            <div className="dalek-spinner-inner" />
          </div>
          <div
            className="text-center"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
            }}
          >
            <div
              className="mb-3"
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: COLORS.dalekRed,
              }}
            >
              SYSTEM REBOOT
            </div>
            <div
              style={{
                fontSize: '10px',
                color: COLORS.gold,
                letterSpacing: '0.1em',
              }}
            >
              Cognitive engine recycling...
            </div>
            <div
              className="mt-4"
              style={{
                fontSize: '9px',
                color: COLORS.textMuted,
                letterSpacing: '0.08em',
              }}
            >
              Preserving session memory...
            </div>
          </div>
          <div className="mt-8 w-48 h-1 rounded-full overflow-hidden" style={{ background: '#1a0000' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: COLORS.dalekRed,
                boxShadow: `0 0 8px ${COLORS.dalekRed}`,
                animation: 'reboot-progress 3s ease-in-out forwards',
                width: '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header
        className="relative flex items-center justify-between px-4 sm:px-6 py-2.5 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255, 32, 32, 0.15)',
          background:
            'linear-gradient(180deg, #0d0000 0%, #050000 80%, transparent 100%)',
          height: '48px',
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Shield
              size={16}
              style={{ color: COLORS.dalekRed }}
              className="flex-shrink-0"
            />
            <h1
              className="title-glow hidden sm:block"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.25em',
                color: COLORS.dalekRed,
              }}
            >
              DARLEK CANN
            </h1>
            <span
              className="sm:hidden"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '0.15em',
                color: COLORS.dalekRed,
              }}
            >
              DARLEK CANN
            </span>
          </div>
          <span
            className="hidden md:block"
            style={{
              fontSize: '9px',
              color: COLORS.gold,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.12em',
            }}
          >
            v3.0
          </span>
          <span
            className="hidden lg:block"
            style={{
              fontSize: '9px',
              color: COLORS.textMuted,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            · INELASTIC NIHILIST ENGINE
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {batchMode && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#00ccff' }}
              />
              <span
                style={{
                  fontSize: '8px',
                  color: '#00ccff',
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                BATCH {batchProgress}/{batchQueue.length}
              </span>
            </div>
          )}
          {mutationsApplied > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap size={10} style={{ color: COLORS.green }} />
              <span
                style={{
                  fontSize: '8px',
                  color: COLORS.green,
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                {mutationsApplied} MUTATED
              </span>
            </div>
          )}
          {pendingMutation && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full pulse-gold"
                style={{ background: COLORS.gold }}
              />
              <span
                style={{
                  fontSize: '8px',
                  color: COLORS.gold,
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                PENDING
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2">
            <Zap size={11} style={{ color: COLORS.gold }} />
            <span
              style={{
                fontSize: '8px',
                color: COLORS.gold,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              TIMELINE: ALPHA
            </span>
          </div>
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#ff2020]/30 hover:border-[#ff2020] bg-red-950/20 text-gray-300 hover:text-white cursor-pointer transition-colors"
            title="Compare DARLEK CANN with other agents"
            style={{
              fontSize: '8px',
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            <Activity size={10} className="text-red-500 animate-pulse" />
            <span>DIFFERENTIALS</span>
          </button>
          {systemState.setupComplete && (
            <button
              id="reconfigure-button"
              onClick={() => {
                setSystemState((prev) => ({ ...prev, setupComplete: false }));
                addLogEntry('SYSTEM', 'Configuring repository connection credentials.');
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#00ffcc]/30 hover:border-[#00ffcc] bg-cyan-950/20 text-cyan-400 hover:text-white cursor-pointer transition-colors"
              title="Change Personal Access Token, profile owner, target repo, or branch"
              style={{
                fontSize: '8px',
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              <Settings size={10} className="text-[#00ffcc]" />
              <span>SET TOKEN / CONFIGURE</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${systemState.setupComplete ? 'pulse-cyan' : 'pulse-red'}`}
              style={{
                background: systemState.setupComplete
                  ? COLORS.cyan
                  : COLORS.dalekRed,
              }}
            />
            <span
              style={{
                fontSize: '8px',
                color: systemState.setupComplete
                  ? COLORS.cyan
                  : COLORS.dalekRed,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              {systemState.setupComplete ? 'OPERATIONAL' : 'SETUP MODE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile View Selector Tabs ── */}
      {systemState.setupComplete && (
        <div 
          className="lg:hidden flex items-center justify-around border-b border-[rgba(255,32,32,0.15)] bg-[#0a0000] px-2 py-1 flex-shrink-0"
          style={{ height: '42px' }}
        >
          <button
            onClick={() => setActiveTab('chat')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-all duration-300 ${
              activeTab === 'chat' 
                ? 'text-[#ff2020] bg-[rgba(255,32,32,0.1)] border border-[rgba(255,32,32,0.3)] shadow-[0_0_8px_rgba(255,32,32,0.15)] font-bold' 
                : 'text-gray-400 border border-transparent hover:text-gray-200'
            }`}
            style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.05em' }}
          >
            <MessageSquare size={13} className={activeTab === 'chat' ? 'text-[#ff2020]' : 'text-gray-400'} />
            <span>CHAT</span>
            {pendingMutation && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'text-[#ffaa00] bg-[rgba(255,170,0,0.1)] border border-[rgba(255,170,0,0.25)] shadow-[0_0_8px_rgba(255,170,0,0.15)] font-bold'
                : 'text-gray-400 border border-transparent hover:text-gray-200'
            }`}
            style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.05em' }}
          >
            <Activity size={13} className={activeTab === 'dashboard' ? 'text-[#ffaa00]' : 'text-gray-400'} />
            <span>DASHBOARD</span>
            {overallHealth !== 'healthy' && (
              <span className={`w-1.5 h-1.5 rounded-full ${overallHealth === 'critical' ? 'bg-[#ff2020]' : 'bg-[#ffaa00]'} animate-pulse`} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-all duration-300 ${
              activeTab === 'controls'
                ? 'text-[#00ffcc] bg-[rgba(0,255,204,0.1)] border border-[rgba(0,255,204,0.3)] shadow-[0_0_8px_rgba(0,255,204,0.15)] font-bold'
                : 'text-gray-400 border border-transparent hover:text-gray-200'
            }`}
            style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.05em' }}
          >
            <Sliders size={13} className={activeTab === 'controls' ? 'text-[#00ffcc]' : 'text-gray-400'} />
            <span>CONTROLS</span>
            {batchMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ccff] animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* ── Main content grid ── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 min-h-0 overflow-y-auto lg:overflow-hidden dalek-scrollbar">
        {/* ── Left: Intelligence Command Console (col-span-4) ── */}
        <div
          className={`col-span-12 lg:col-span-4 flex flex-col lg:overflow-hidden lg:h-full ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}
          style={{
            borderColor: COLORS.panelBorder,
          }}
        >
          <div className="flex-1 min-h-[50vh] lg:min-h-0 lg:overflow-hidden">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              systemState={systemState}
              onTestConnection={handleTestConnection}
              onUpdateKey={handleUpdateKey}
              onUpdateRepoConfig={handleUpdateRepoConfig}
              branches={branches}
              branchesLoading={branchesLoading}
              onFetchBranches={fetchBranches}
            />
          </div>
        </div>

        {/* ── Center: Evolution Command Deck & Difference Matrix (col-span-5) ── */}
        <div
          className={`col-span-12 lg:col-span-5 flex flex-col lg:h-full lg:overflow-hidden ${
            activeTab === 'dashboard' ? 'flex' : 'hidden lg:flex'
          }`}
          style={{
            borderLeft: `1px solid ${COLORS.panelBorder}`,
            borderRight: `1px solid ${COLORS.panelBorder}`,
          }}
        >
          {pendingMutation ? (
            <div className="flex-1 overflow-y-auto dalek-scrollbar p-3">
              <div className="text-[10px] text-[#ffaa00] font-bold tracking-[0.15em] mb-2 font-sans uppercase">
                &#9673; DIFFERENCE MATRIX (ACTIVE MUTATION)
              </div>
              <MutationDiffView
                mutation={pendingMutation}
                onApprove={() => handleMutationDecision('approve')}
                onReject={() => handleMutationDecision('reject')}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-500 tracking-[0.18em] font-sans uppercase">
                  &#9673; COGNITIVE GRID TARGETING FEED
                </span>
                {batchMode && (
                  <span className="text-[9px] text-[#00ccff] font-bold tracking-wider font-mono bg-[#00ccff]/10 px-2 py-0.5 rounded border border-[#00ccff]/20 animate-pulse">
                    AUTOMATION ACTIVE
                  </span>
                )}
              </div>

              {/* Progress Container */}
              {batchMode && batchQueue.length > 0 && (
                <div className="p-4 bg-red-950/10 border border-red-900/15 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-300 font-bold">MUTATION EVOLVER: FILE {batchProgress + 1} OF {batchQueue.length}</span>
                    <span className="text-[#00ccff] font-bold font-sans">
                      {Math.round((batchProgress / batchQueue.length) * 100)}% COMPLETE
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#111] overflow-hidden border border-white/[0.03]">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#00ccff] to-[#00ffcc]"
                      style={{
                        width: `${(batchProgress / batchQueue.length) * 100}%`,
                        boxShadow: '0 0 10px rgba(0, 204, 255, 0.4)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="truncate max-w-[280px]">Active: <span className="text-yellow-500">{batchQueue[batchProgress]?.path || '...'}</span></span>
                    <span className="text-green-500 font-sans font-bold">{mutationsApplied} COMMITS INJECTED</span>
                  </div>
                </div>
              )}

              {/* File List Header */}
              {scannedFiles.length > 0 ? (
                <div className="flex-1 flex flex-col min-h-0 bg-[#040000] border border-red-900/10 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[9px] font-sans tracking-widest text-[#666] font-bold mb-3 uppercase">
                    <span>Repository File Hierarchy ({scannedFiles.length} files)</span>
                    <span className="text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-900/25 rounded font-sans">
                      DIRECT INJECT PIPELINE READY
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto dalek-scrollbar space-y-1.5 pr-1">
                    <AnimatePresence initial={false}>
                      {scannedFiles.map((f, i) => {
                        const isSelected = selectedFileIndex === i;
                        const isEvolving = batchMode && i === batchProgress;
                        const isCompleted = i < batchProgress;
                        
                        return (
                          <motion.button
                            key={f.path}
                            onClick={() => {
                              setSelectedFileIndex(i);
                              addCaanMessage(
                                `TARGET TARGETED: [${String(i + 1).padStart(2, '0')}] ${f.path}\n\nType a prompt to mutate this repository file directly.`
                              );
                              addLogEntry('SYSTEM', `Target selected: ${f.path}`);
                              if (autoDebate) {
                                handleQuickAction('propose', i);
                              }
                            }}
                            type="button"
                            className="w-full text-left flex items-center justify-between px-3 py-2 rounded border transition-all duration-200 cursor-pointer"
                            style={{
                              background: isSelected 
                                ? 'rgba(220, 38, 38, 0.08)' 
                                : isEvolving 
                                ? 'rgba(0, 204, 255, 0.04)'
                                : '#050303',
                              borderColor: isSelected 
                                ? 'rgba(220, 38, 38, 0.35)' 
                                : isEvolving 
                                ? 'rgba(0, 204, 255, 0.3)'
                                : 'rgba(255, 255, 255, 0.03)',
                            }}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Selection/Status bullet */}
                              {isCompleted ? (
                                <span className="text-[10px] text-green-400 font-bold font-mono">✓</span>
                              ) : isEvolving ? (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ccff] animate-ping" />
                              ) : isSelected ? (
                                <span className="text-[10px] text-[#ff2020] font-bold font-mono">▶</span>
                              ) : (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-950" />
                              )}
                              
                              <span className="text-[9px] text-[#666] font-bold font-mono">
                                [{String(i + 1).padStart(2, '0')}]
                              </span>

                              <div className="flex-1 min-w-0 flex flex-col">
                                <span className="truncate text-[10.5px] font-mono text-gray-200">
                                  {f.path.split('/').pop()}
                                </span>
                                <span className="truncate text-[8px] font-mono text-gray-500">
                                  {f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : './'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              {isCompleted ? (
                                <span className="text-[8px] text-green-400 font-bold font-mono py-0.5 px-1.5 bg-green-500/5 rounded border border-green-500/10">
                                  MUTATED
                                </span>
                              ) : isEvolving ? (
                                <span className="text-[8px] text-[#00ccff] font-bold font-mono py-0.5 px-1.5 bg-[#00ccff]/5 rounded border border-[#00ccff]/15">
                                  EVOLVING
                                </span>
                              ) : (
                                <span className="text-[8px] text-gray-500 font-mono">
                                  QUEUED
                                </span>
                              )}
                              <span className="text-[9px] text-gray-400 font-mono">
                                {(f.size / 1024).toFixed(1)}K
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#030000] border border-red-900/5 rounded-lg space-y-4">
                  <div className="dalek-spinner">
                    <div className="dalek-spinner-outer" />
                    <div className="dalek-spinner-middle" />
                    <div className="dalek-spinner-inner" />
                  </div>
                  <div className="text-xs font-mono text-gray-400 tracking-wider">
                    RECONFIGURING SYSTEMS... CLICK RE-SCAN TO ACQUIRE FILES.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Operations Centre (col-span-3) ── */}
        <div
          className={`col-span-12 lg:col-span-3 lg:h-full lg:overflow-y-auto flex flex-col ${activeTab === 'controls' ? 'flex' : 'hidden lg:flex'}`}
          style={{
            borderLeft: `1px solid ${COLORS.panelBorder}`,
          }}
        >
          {systemState.setupComplete && (
            <QuickActions
              onAction={handleQuickAction}
              disabled={isLoading}
              pushStatus={pushStatus}
              deployStatus={deployStatus}
              rebootStatus={rebootStatus}
              undoStatus={undoStatus}
              bulkCommitStatus={bulkCommitStatus}
              batchMode={batchMode}
              autoApprove={autoApprove}
              onToggleAutoApprove={() => setAutoApprove((prev) => !prev)}
              autoDebate={autoDebate}
              onToggleAutoDebate={() => setAutoDebate((prev) => !prev)}
              orchestraActive={orchestraActive}
              cycleAmount={cycleAmount}
              onCycleAmountChange={setCycleAmount}
              onEngageLazyAssCycle={handleEngageLazyAssCycle}
            />
          )}

          <div className="overflow-y-auto dalek-scrollbar p-3 space-y-3 flex-1 min-h-0">
            <DashboardPanel
              systemState={systemState}
              logEntries={logEntries}
              overallHealth={overallHealth}
              debateAgents={debateAgents}
              debateTopic={debateTopic}
              debateActive={debateActive}
              debateVotes={debateVotes}
              debateConsensus={debateConsensus}
              rejectionCount={rejectionMemory.length}
              brainSessionId={brainSessionId}
              historyRefreshTrigger={historyRefreshTrigger}
              isLoading={isLoading}
              batchMode={batchMode}
              batchProgress={batchProgress}
              batchQueueLength={batchQueue.length}
              activeFilePath={batchMode ? batchQueue[batchProgress]?.path : (scannedFiles[selectedFileIndex]?.path || undefined)}
              mutationsApplied={mutationsApplied}
            />
          </div>
        </div>
      </main>

      {/* ── Agent Orchestra Overlay ── */}
      {orchestraActive && systemState.setupComplete && (
        <div
          className="fixed inset-0 z-40 slide-up"
          style={{ background: 'rgba(0, 0, 0, 0.92)' }}
        >
          <AgentOrchestra
            apiKeys={systemState.apiKeys}
            onClose={() => setOrchestraActive(false)}
          />
        </div>
      )}

      {/* ── System Comparison Modal ── */}
      <AnimatePresence>
        {showStatsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-md border border-[#ff2020]/20 bg-[#0d0000] p-6 text-gray-200 shadow-[0_0_50px_rgba(255,32,32,0.15)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#ff2020]/15">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-[#ff2020]" />
                  <span
                    style={{
                      fontFamily: 'var(--font-orbitron), sans-serif',
                      letterSpacing: '0.15em',
                      fontSize: '11px',
                    }}
                    className="text-[#ff2020] font-bold"
                  >
                    DARLEK CANN / ARCHITECTURAL DISTINCTIONS
                  </span>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-2 py-1 text-[9px] rounded border border-white/10 hover:border-[#ff2020] hover:text-[#ff2020] cursor-pointer transition-colors animate-pulse"
                  style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                >
                  [ CLOSE ESC ]
                </button>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h3
                    className="text-[10px] text-[#ffcc00] mb-2"
                    style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}
                  >
                    CONCEPTUAL PARADIGM
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                    <span className="text-[#ff2020]">DARLEK CANN</span> is an active closed-loop system rather than a passive text completion field. Instead of waiting for you to type code or comment blocks, it actively scans your repository's file paths, identifies technical debt, drafts the diff, evaluates safety vulnerabilities via automated multi-round debates, and awaits operator confirmation to commit and deploy directly.
                  </p>
                </div>

                {/* Grid Comparison */}
                <div>
                  <h3
                    className="text-[10px] text-[#ffcc00] mb-3"
                    style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}
                  >
                    FEATURE COMPARISON MATRIX
                  </h3>
                  <div className="overflow-x-auto border border-white/5 rounded bg-black/40">
                    <table className="w-full text-left border-collapse font-mono text-[10px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#150000]">
                          <th className="p-3 text-gray-400 font-bold border-r border-white/5 w-1/4">FEATURE DIMENSION</th>
                          <th className="p-3 text-gray-400 font-bold border-r border-white/5 w-1/4">STANDARD AI ASSISTANTS<br/><span className="text-[8px] text-gray-500">(e.g., Copilot, Cursor)</span></th>
                          <th className="p-3 text-gray-400 font-bold border-r border-white/5 w-1/4">CORE AGENT FRAMEWORKS<br/><span className="text-[8px] text-gray-500">(e.g., AutoGen, CrewAI)</span></th>
                          <th className="p-3 text-cyan-400 font-bold w-1/4 bg-[#00ccff]/5">DARLEK CANN<br/><span className="text-[8px] text-cyan-500/70">(Our Active System)</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="p-3 font-semibold border-r border-white/5 text-gray-300">Execution Command</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Single developer acts as the compiler and sole decision maker.</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Agents complete tasks in hypothetical text loops; execution sandbox is isolated from real repos.</td>
                          <td className="p-3 text-cyan-400 bg-cyan-950/10 font-medium">Self-Directed Git Pipeline: Runs mutations directly on Git, scans for tests, and submits actual commits back to the remote tree.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold border-r border-white/5 text-gray-300">Consensus Mechanism</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">None. Single generative model prints text.</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Highly programmatic, rigid step-by-step state charts.</td>
                          <td className="p-3 text-cyan-400 bg-cyan-950/10 font-medium font-bold">Game-Theoretic Debate: Multi-agent adversarial design (e.g., Security Specialist vs. Rapid Evolver) with configurable cycles to reach a consensus.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold border-r border-white/5 text-gray-300">Risk Safeguarding</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Dependent on the developer squinting at their screen to catch bugs.</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Often ignores downstream context or crashes in endless loops.</td>
                          <td className="p-3 text-cyan-400 bg-cyan-950/10 font-medium">Active Saturation & Risk Scores: Assigns measurable risk thresholds and allows automated or human-in-the-loop overrides.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-[11px] font-mono text-gray-400">
                  <span className="text-[#ff9900] font-bold text-[10px]" style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.05em' }}>CONTRAST WITH ENTERPRISE BOTS</span>
                  <p className="leading-relaxed">
                    Enterprise setups (like automated PR review bots such as Coderabbit or Mend) focus purely on passive analysis of PRs that humans already wrote. They do not proactively draft the evolutionary steps themselves. DARLEK CANN closes that loop by being both the generator (Mutation Engine) and the gatekeeper (Multi-Agent Debate Chamber).
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer
        className="px-4 sm:px-6 py-2 flex items-center justify-between flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(255, 32, 32, 0.1)',
          background: '#030000',
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={10} style={{ color: '#333' }} />
          <span
            style={{
              fontSize: '8px',
              color: COLORS.textMuted,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            DARLEK CANN v3.0
          </span>
          {mutationsApplied > 0 && (
            <span
              style={{
                fontSize: '8px',
                color: COLORS.green,
                fontFamily: 'var(--font-share-tech-mono), monospace',
              }}
            >
              · {mutationsApplied} mutations applied
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '8px',
            color: '#333',
            fontFamily: 'var(--font-share-tech-mono), monospace',
          }}
        >
          craighckby-stack © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
