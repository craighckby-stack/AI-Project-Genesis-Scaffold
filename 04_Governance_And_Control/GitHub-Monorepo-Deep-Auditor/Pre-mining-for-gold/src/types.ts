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
