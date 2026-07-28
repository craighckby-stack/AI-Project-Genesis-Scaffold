export interface RepoInfo {
  name: string;
  url: string;
  description: string;
  category: string;
  language: string;
  default_branch: string;
  branches_count: number;
  branches: string[];
  primary_stack: string;
  is_multi_system: boolean;
  subsystems: string[];
  updated_at: string;
  code_snippets?: Record<string, string>;
}

export interface FileAnalysis {
  frameworks: string[];
  subsystems: string[];
  isMultiSystem: boolean;
  primaryStack: string;
}

export interface LogMessage {
  id: string;
  text: string;
  type: "info" | "success" | "warning" | "error";
}

export interface ReconBranchInfo {
  name: string;
  lastCommitDate: string;
  lastCommitAuthor: string;
  isDormant: boolean;
  isDefault: boolean;
}

export interface ReconPRWorkflow {
  name: string;
  status: string;
  conclusion: string;
}

export interface ReconPRInfo {
  number: number;
  title: string;
  state: string;
  author: string;
  createdAt: string;
  hasWorkflows: boolean;
  workflows: ReconPRWorkflow[];
}

export interface ReconRepoData {
  name: string;
  owner: string;
  interDependencies: string[];
  externalDependencies: string[];
  branches: ReconBranchInfo[];
  pullRequests: ReconPRInfo[];
}
