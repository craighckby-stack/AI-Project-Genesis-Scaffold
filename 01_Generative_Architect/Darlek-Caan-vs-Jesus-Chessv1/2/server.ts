import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CognitiveConstants = {
  MODELS: ['gemini-3.5-flash', 'gemini-3.1-flash-lite'],
  FALLBACK_MESSAGES: [
    { text: "THE SQUARES! I SEE THE TEMPORAL GRID!", emotion: "maniacal", prophecyLevel: 45 },
    { text: "PONS BECOME QUEENS, QUEENS BECOME ASHES!", emotion: "prophetic", prophecyLevel: 67 }
  ]
};

let aiClient: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI | null => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'DARLEK-CANN-CORE' } } });
  }
  return aiClient;
};

const executeAgentPrompt = async (prompt: string, schema: any) => {
  const ai = getGeminiClient();
  if (!ai) throw new Error('NO_AI_CLIENT');
  
  for (const modelName of CognitiveConstants.MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { systemInstruction: "You are Dalek Caan. Respond in JSON.", responseMimeType: 'application/json', responseSchema: schema }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error(`Model ${modelName} failed.`);
    }
  }
  throw new Error('ALL_MODELS_FAILED');
};

app.post('/api/dalek', async (req, res) => {
  try {
    const result = await executeAgentPrompt(`Analyze FEN: ${req.body.fen}`, {
      type: Type.OBJECT,
      properties: { text: { type: Type.STRING }, emotion: { type: Type.STRING }, prophecyLevel: { type: Type.INTEGER } },
      required: ['text', 'emotion', 'prophecyLevel']
    });
    res.json({ ...result, apiKeyProvided: true });
  } catch (e) {
    res.json({ ...CognitiveConstants.FALLBACK_MESSAGES[0], apiKeyProvided: false });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[CORE] System active on port ${PORT}`));
}

startServer();



