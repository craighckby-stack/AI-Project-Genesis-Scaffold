import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';

dotenv.config();

// --- Configuration & Validation ---
const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GITHUB_TOKEN: z.string().optional(),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const env = envSchema.parse(process.env);

// --- Core Error Handling ---
class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// --- Services ---
class NeuralLink {
  private ai: GoogleGenAI;
  constructor() { this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }); }

  async generate(prompt: string, context: string = 'General'): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(`[System Context: ${context}] ${prompt}`);
      return result.response.text() || "Substrate silence.";
    } catch (error) {
      throw new AppError("Neural link instability detected.", 503);
    }
  }
}

class GitHubClient {
  static async fetch(endpoint: string, token?: string) {
    const response = await fetch(`https://api.github.com/${endpoint}`, {
      headers: {
        'User-Agent': 'DARLEK-CANN-V3',
        ...(token && { 'Authorization': `token ${token}` })
      }
    });
    if (!response.ok) throw new AppError('Upstream GitHub rejection.', response.status);
    return response.json();
  }
}

// --- Application Initialization ---
const app = express();
const neuralLink = new NeuralLink();

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- Routes ---
app.get('/health', (_req, res) => res.json({ status: 'OPERATIONAL', timestamp: new Date().toISOString() }));

app.post('/api/pray', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentData, userMessage } = z.object({
      agentData: z.object({ name: z.string() }).optional(),
      userMessage: z.string().min(1)
    }).parse(req.body);
    
    const reply = await neuralLink.generate(`Agent: ${agentData?.name || 'Anonymous'}. Query: ${userMessage}`, 'Immersive/Cryptic');
    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (e) { next(e); }
});

app.post('/api/ingest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, repoName } = z.object({ username: z.string(), repoName: z.string().optional() }).parse(req.body);
    const endpoint = repoName ? `repos/${username}/${repoName}/contents` : `users/${username}/repos`;
    const data = await GitHubClient.fetch(endpoint, env.GITHUB_TOKEN);
    res.json(data);
  } catch (err) { next(err); }
});

// --- Error Middleware ---
app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof AppError ? err.statusCode : 500;
  res.status(status).json({ error: err.message, code: 'ERR_CORE_FAILURE' });
});

// --- Server Lifecycle ---
const server = http.createServer(app);
const PORT = env.PORT;

server.listen(PORT, () => console.log(`DARLEK CANN v3.0 [CORE] ACTIVE ON PORT ${PORT}`));

const shutdown = () => {
server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);



