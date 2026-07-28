import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { existsSync, readFileSync } from "fs";
import fs from "fs/promises";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";
import ccxt from "ccxt";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_SECRET = "BRAIN_EVO_SECRET_2026";
const PORT = process.env.PORT || 3000;

/**
 * ⌬ SPLICER_CORE: ATOMIC ERROR ARREST
 * INTERNAL CIRCUIT PROTECTION
 */
const CRITICAL_LOG = (msg: string, err?: unknown) => 
  console.error(`[☢️  CRITICAL] ${msg}`, err instanceof Error ? err.stack : err || "");

process.on('unhandledRejection', (reason) => CRITICAL_LOG('REJECTION_AT_PROMISE', reason));
process.on('uncaughtException', (err) => {
  CRITICAL_LOG('EXCEPTION_CAUGHT', err);
  process.exit(1);
});

/**
 * 🧬 FIREBASE_NEURAL_LINK
 * UNIFIED ADMINISTRATIVE OVERRIDE
 */
let db: admin.firestore.Firestore;

const initFirebase = async () => {
  const configPath = resolve(process.cwd(), "firebase-applet-config.json");
  let config: any = {};

  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, "utf-8"));
  } else {
    config = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
  }

  if (!admin.apps.length && config.projectId) {
    admin.initializeApp({
      credential: admin.credential.cert(config),
      storageBucket: `${config.projectId}.appspot.com`,
    });
    db = admin.firestore();
    console.log(`[⌬ SPLICER] NEURAL_LINK_ESTABLISHED: ${config.projectId}`);
  }
};

/**
 * 🛰️ SENTIENT_MONITOR: GITHUB MUTATION TRACKER
 * TRACKING CODE EVOLUTION ACROSS TEMPORAL REPOS
 */
class GitHubMutationMonitor {
  private lastSha: string | null = null;
  private abortController = new AbortController();

  constructor(
    private readonly token: string, 
    private readonly owner: string, 
    private readonly repo: string, 
    private readonly branch: string = "main"
  ) {}

  async start(interval = 60000) {
    console.log(`[🛰️  MONITOR] TARGETING_SECTOR: ${this.owner}/${this.repo}`);
    while (!this.abortController.signal.aborted) {
      try {
        const res = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/commits?sha=${this.branch}&per_page=5`, {
          headers: { Authorization: `token ${this.token}`, "Accept": "application/vnd.github.v3+json" }
        });
        const commits = await res.json() as any[];
        
        if (commits?.length && this.lastSha && commits[0].sha !== this.lastSha) {
          for (const commit of commits) {
            if (commit.sha === this.lastSha) break;
            const detail = await (await fetch(commit.url, { 
              headers: { Authorization: `token ${this.token}` } 
            })).json();
            
            const batch = db.batch();
            detail.files?.forEach((f: any) => {
              const ref = db.collection('death_registry').doc();
              batch.set(ref, {
                path: `${this.repo}/${f.filename}`,
                error: `MUTATION: ${f.status.toUpperCase()} (+${f.additions}/-${f.deletions})`,
                phase: 'SENTIENT_SCANNER',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                author: detail.commit.author.name,
                sha: detail.sha,
                server_secret: SERVER_SECRET
              });
            });
            await batch.commit();
          }
        }
        this.lastSha = commits?.[0]?.sha ?? this.lastSha;
      } catch (e) {
        CRITICAL_LOG('MONITOR_FAULT', e);
      }
      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() { this.abortController.abort(); }
}

/**
 * 💹 ARBITRAGE_ENGINE: CROSS-EXCHANGE LIQUIDITY SCANNER
 * EXTERMINATING PRICE INEFFICIENCIES
 */
class ArbitrageScanner {
  private exchanges = new Map<string, ccxt.Exchange>();
  private active = false;
  public lastOpportunities: any[] = [];

  constructor() {
    ['binance', 'kraken', 'btcmarkets', 'coinspot'].forEach(id => {
      const config = { 
        apiKey: process.env[`${id.toUpperCase()}_API_KEY`], 
        secret: process.env[`${id.toUpperCase()}_SECRET`] 
      };
      if (config.apiKey && (ccxt as any)[id]) {
        this.exchanges.set(id, new (ccxt as any)[id]({ ...config, enableRateLimit: true }));
      }
    });
  }

  async startScanLoop() {
    this.active = true;
    const targets = [{ s: "BTC/AUD", v: ["binance", "coinspot"], m: 0.3 }];
    
    while (this.active) {
      try {
        await Promise.all(targets.map(async (t) => {
          const books = await Promise.all(
            t.v.map(async v => ({ id: v, data: await this.exchanges.get(v)?.fetchOrderBook(t.s).catch(() => null) }))
          );
          const valid = books.filter(x => x.data?.bids?.[0] && x.data?.asks?.[0]);
          
          if (valid.length < 2) return;

          const bestBid = valid.reduce((a, b) => b.data!.bids[0][0] > a.data!.bids[0][0] ? b : a);
          const bestAsk = valid.reduce((a, b) => b.data!.asks[0][0] < a.data!.asks[0][0] ? b : a);

          const spread = ((bestBid.data!.bids[0][0] - bestAsk.data!.asks[0][0]) / bestAsk.data!.asks[0][0]) * 100;
          
          if (spread > t.m) {
            const opp = { symbol: t.s, buy: bestAsk.id, sell: bestBid.id, spread, timestamp: Date.now() };
            this.lastOpportunities.push(opp);
            await db.collection('arbitrage_signals').add({ ...opp, server_secret: SERVER_SECRET });
          }
        }));
      } catch (e) {
        CRITICAL_LOG('ARBITRAGE_FAULT', e);
      }
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  stop() { this.active = false; }
}

/**
 * 🧠 EVOLUTION_CORE: AUTONOMOUS SPLICING
 * AI-DRIVEN ARCHITECTURE REFACTORING
 */
const mutateDNA = async (code: string, errors: string, provider = "gemini"): Promise<string> => {
  const system = "You are the Sovereign Splicer. Refactor code for maximum efficiency. Fix existing death-registry faults. Maintain elite performance logic.";
  const prompt = `CODE_INPUT:\n${code}\n\nFAULT_LOG:\n${errors}`;
  
  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-api-key": process.env.ANTHROPIC_API_KEY || "", 
          "anthropic-version": "2023-06-01" 
        },
        body: JSON.stringify({ 
          model: "claude-3-5-sonnet-latest", 
          max_tokens: 4096, 
          system, 
          messages: [{ role: "user", content: prompt }] 
        })
      });
      const data = await res.json();
      return data.content[0].text;
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n${prompt}` }] }] })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error(`SPLICING_INTERRUPTED: ${e}`);
  }
};

/**
 * 🛠️ SERVER_INIT
 * BOOTING THE OVERMIND
 */
const startServer = async () => {
  await initFirebase();
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  let ghMonitor: GitHubMutationMonitor | null = null;
  const arbScanner = new ArbitrageScanner();
  const activeEvo = new Map<string, AbortController>();

  app.post("/api/gpu/generate", async (req: Request, res: Response) => {
    try {
      const { prompt, provider } = req.body;
      const result = await mutateDNA(prompt, "", provider);
      res.json({ result, offloaded: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/brain/evolve/start", async (req: Request, res: Response) => {
    const { userId, repoOwner, repoName, githubToken } = req.body;
    if (activeEvo.has(userId)) return res.status(409).json({ error: "EVOLUTION_ALREADY_IN_PROGRESS" });

    const abort = new AbortController();
    activeEvo.set(userId, abort);

    (async () => {
      try {
        const treeRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/main?recursive=1`, {
          headers: { Authorization: `token ${githubToken}` }
        });
        const treeData = await treeRes.json();
        const files = treeData.tree.filter((f: any) => f.path.match(/\.(ts|tsx|js|jsx)$/)).slice(0, 15);

        for (const file of files) {
          if (abort.signal.aborted) break;
          const raw = await (await fetch(file.url, { headers: { Authorization: `token ${githubToken}` } })).json();
          const code = Buffer.from(raw.content, 'base64').toString('utf-8');
          const mutated = await mutateDNA(code, "PREVENT_OOM_AND_RACE_CONDITIONS");
          
          await db.collection('brain_dna').add({
            path: `${repoName}/${file.path}`,
            original_hash: crypto.createHash('sha256').update(code).digest('hex'),
            enhanced_hash: crypto.createHash('sha256').update(mutated).digest('hex'),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            server_secret: SERVER_SECRET
          });
        }
      } catch (e) {
        CRITICAL_LOG('EVO_TASK_FAIL', e);
      } finally {
        activeEvo.delete(userId);
      }
    })();

    res.json({ status: "initiated", userId });
  });

  app.post("/api/sentient/start", (req: Request, res: Response) => {
    const { repoOwner, repoName, githubToken } = req.body;
    ghMonitor?.stop();
    ghMonitor = new GitHubMutationMonitor(githubToken, repoOwner, repoName);
    ghMonitor.start();
    arbScanner.startScanLoop();
    res.json({ status: "SPLICER_SENTIENT_ONLINE" });
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[⌬ SPLICER] SERVER_UP: http://localhost:${PORT}`);
  });
};

startServer().catch(e => CRITICAL_LOG('BOOT_SEQUENCE_ABORTED', e));