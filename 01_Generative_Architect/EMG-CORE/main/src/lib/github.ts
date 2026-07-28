import { BackupData } from '../types';

/**
 * GitHub Integration Controller - Evolved v3.0
 * Implements atomic commit patterns and secure binary serialization.
 */

class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(`GitHub API Error [${status}]: ${message}`);
    this.name = 'GitHubError';
  }
}

const GITHUB_API = 'https://api.github.com';

async function executeGitHubRequest(token: string, endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!response.ok) throw new GitHubError(response.status, response.statusText);
  return response.json();
}

export class BinaryCodec {
  static encode(data: BackupData): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  static decode(encoded: string): BackupData {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  }
}

export async function commitChangesAtomic(token: string, owner: string, repo: string, branch: string, message: string, files: { path: string, newContent: string }[]) {
  const baseRef = await executeGitHubRequest(token, `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const baseCommit = await executeGitHubRequest(token, `/repos/${owner}/${repo}/git/commits/${baseRef.object.sha}`);
  
  const tree = await Promise.all(files.map(async f => {
    const blob = await executeGitHubRequest(token, `/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: f.newContent, encoding: 'utf-8' })
    });
    return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
  }));

  const newTree = await executeGitHubRequest(token, `/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree })
  });

  const newCommit = await executeGitHubRequest(token, `/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseCommit.sha] })
  });

  return executeGitHubRequest(token, `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha })
  });
}

export async function saveBinaryToGitHub(token: string, data: BackupData, repo: string, owner: string): Promise<{ success: boolean; message: string }> {
  try {
    const path = `backups/emg-${Date.now()}.bin`;
    await executeGitHubRequest(token, `/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({ message: 'State Backup', content: BinaryCodec.encode(data) })
    });
    return { success: true, message: 'Backup stored.' };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function loadLatestBinaryFromGitHub(token: string, repo: string, owner: string): Promise<{ success: boolean; data?: BackupData; message: string }> {
  try {
    const files = await executeGitHubRequest(token, `/repos/${owner}/${repo}/contents/backups`);
    const latest = files.sort((a: any, b: any) => b.name.localeCompare(a.name))[0];
    const content = await executeGitHubRequest(token, `/repos/${owner}/${repo}/git/blobs/${latest.sha}`);
    return { success: true, data: BinaryCodec.decode(content.content), message: 'Loaded.' };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}
























