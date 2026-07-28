import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// --- DIAGNOSTIC ENGINE ---
const DiagnosticLogger = {
  log: async (level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: any) => {
    const entry = `[${new Date().toISOString()}] [${level}] ${message} ${context ? JSON.stringify(context) : ''}\n`;
    try {
      await fs.appendFile(path.join(process.cwd(), 'system-evolution.log'), entry, 'utf8');
    } catch (err) {
      console.error('CRITICAL: Logger failure', err);
    }
  }
};

// --- MIDDLEWARE ---
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// --- SERVICES ---
class LLMOrchestrator {
  private static genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  static async generate(model: string, contents: any, config: any) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.genAI.models.generateContent({ model, contents, config });
      } catch (err: any) {
        if (i === maxRetries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
}

// --- ROUTES ---
app.get('/health', (req, res) => res.status(200).json({ status: 'OPERATIONAL', timestamp: new Date().toISOString() }));

app.post('/api/log-error', async (req, res) => {
  await DiagnosticLogger.log('ERROR', 'Client-side error', req.body);
  res.status(200).json({ status: 'ACKNOWLEDGED' });
});

app.post('/api/ai/gemini', async (req, res) => {
  try {
    const result = await LLMOrchestrator.generate(req.body.model, req.body.contents, req.body.config);
    res.json({ success: true, data: result });
  } catch (e: any) {
    await DiagnosticLogger.log('ERROR', 'LLM_GATEWAY_FAILURE', { error: e.message });
    res.status(502).json({ error: 'LLM_GATEWAY_FAILURE' });
  }
});

// --- BOOTSTRAP ---
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  const server = app.listen(PORT, () => DiagnosticLogger.log('INFO', `Engine active on port ${PORT}`));
  
  const shutdown = async () => {
    await DiagnosticLogger.log('INFO', 'Shutdown signal received. Teardown initiated.');
    server.close(() => process.exit(0));
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => console.error('Bootstrap failure', err));