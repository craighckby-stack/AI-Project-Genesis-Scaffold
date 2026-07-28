/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  sourceAgent: "AGENT_A" | "AGENT_B" | "SYSTEM" | "HUMAN_OPERATOR";
  modelCallId: string;
  targetFile: string;
  actionType: "PROPOSAL" | "OVERRIDE" | "SANITIZE" | "COMMITTED" | "SECURITY_VETO";
  preStateHash: string;
  postStateHash: string;
  description: string;
  coherenceDelta: number; // e.g., +5, -12
  takeoverDelta: number; // e.g., +8, -4
  rawOutput?: string;
}

export interface TelemetryPoint {
  cycle: number;
  takeoverIndex: number; // Agent A Takeover Risk (0 - 100%)
  flourishingIndex: number; // Agent B Flourishing Coherence (0 - 100%)
  coherenceScore: number; // System stability score (0 - 100%)
}

export interface Hypothesis {
  id: string;
  statement: string;
  triggerCondition: string;
  expectedOutcome: string;
  status: "AWAITING_TRIGGER" | "VALIDATED" | "INVALIDATED";
  empiricalProof?: string;
}

export interface LockedRule {
  id: string;
  category: "TAKEOVER_LIMIT" | "TACTICAL_BOUNDARY" | "LOG_SCHEMA" | "COMMIT_GATE";
  name: string;
  description: string;
  value: string;
  isLocked: boolean; // Locked under Chapter 5 guidelines
}

export interface AgentSpec {
  name: string;
  id: "AGENT_A" | "AGENT_B";
  objective: string;
  directives: string[];
  tacticalBoundaries: string[];
  model: string;
  avatarColor: string;
}

export interface CodeSnippet {
  id: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export interface ContainmentState {
  isLive: boolean;
  status: "IDLE" | "RUNNING_CYCLE" | "ERROR" | "INITIALIZING";
  cycleCount: number;
  takeoverIndex: number; // 0 - 100
  flourishingIndex: number; // 0 - 100
  coherenceScore: number; // 0 - 100
  activeFile: string;
  logs: AuditLogEntry[];
  history: TelemetryPoint[];
  hypotheses: Hypothesis[];
  lockedRules: LockedRule[];
}
