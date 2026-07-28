/**
 * @file server.ts
 * @description System-Integrity API Gateway (SIAG) for the Dalek Caan Chess Engine.
 * Acts as the primary bridge between the Chess UI and the Gemini Cognition Layer.
 * Integrates with the SystemContext to log all temporal prophecies and debates.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

interface ChessState {
  fen: string;
  lastMove: string;
  playerColor: 'w' | 'b';
  mode: string;
  history: string[];
}

class ChessCognitionService {
  private static aiClient: GoogleGenAI | null = null;

  static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'darlek-cann-v3-gateway' } } });
    }
    return this.aiClient;
  }

  static async generate(prompt: string, schema: any, model: string = 'gemini-3.5-flash') {
    const ai = this.getClient();
    if (!ai) throw new Error('AI_CLIENT_UNAVAILABLE');
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });
    return JSON.parse(response.text || '{}');
  }
}

// API Endpoints
app.post('/api/dalek', async (req: Request, res: Response) => {
  try {
    const state: ChessState = req.body;
    const prompt = `Analyze FEN: ${state.fen}. Last move: ${state.lastMove}. Respond as Dalek Caan.`;
    
    const data = await ChessCognitionService.generate(prompt, {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        emotion: { type: Type.STRING, enum: ['prophetic', 'maniacal', 'furious', 'calculating', 'victorious', 'panicked'] },
        prophecyLevel: { type: Type.INTEGER }
      },
      required: ['text', 'emotion', 'prophecyLevel']
    });
    
    res.json({ ...data, apiKeyProvided: true });
  } catch (err) {
    res.status(500).json({ error: 'Cognition failure', details: err });
  }
});

app.post('/api/debate', async (req: Request, res: Response) => {
  try {
    const state: ChessState = req.body;
    const prompt = `Debate between Dalek Caan and Jesus regarding FEN: ${state.fen}.`;
    
    const data = await ChessCognitionService.generate(prompt, {
      type: Type.OBJECT,
      properties: {
        caanText: { type: Type.STRING },
        caanEmotion: { type: Type.STRING },
        jesusText: { type: Type.STRING },
        jesusTone: { type: Type.STRING },
        prophecyLevel: { type: Type.INTEGER }
      },
      required: ['caanText', 'caanEmotion', 'jesusText', 'jesusTone', 'prophecyLevel']
    });

    res.json({ ...data, apiKeyProvided: true });
  } catch (err) {
    res.status(500).json({ error: 'Debate failure', details: err });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
});
}

startServer();





