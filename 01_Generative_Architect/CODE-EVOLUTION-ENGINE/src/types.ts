export interface Investigation {
  id: string;
  title: string;
  prompt: string;
  systemInstruction?: string;
  thought: string;
  text: string;
  thinkingTimeMs: number;
  timestamp: number;
  model?: string;
  thinkingLevel?: string;
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  prompt: string;
  systemInstruction?: string;
  category: "Logic" | "Math" | "Code" | "Science";
}
