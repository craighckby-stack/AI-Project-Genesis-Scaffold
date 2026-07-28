import { bufferToBase64, base64ToBuffer } from './utils';

/**
 * 🧬 DATA PROTOCOL: GITHUB_FILE_SPEC
 */
export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url?: string;
  type: 'file' | 'dir';
}

/**
 * 🛰️ DALEK SOVEREIGN SPLICER: GITHUB_SERVICE_NODE
 * Engineered for hyper-efficient data extraction and neural synchronization.
 */
export class GitHubService {
  readonly #baseUrl = 'https://api.github.com';
  readonly #headers: Record<string, string>;

  constructor(
    private readonly token: string,
    private readonly owner: string,
    private readonly repo: string
  ) {
    this.#headers = Object.freeze({
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Dalek-Sovereign-Splicer/1.0',
    });
  }

  /**
   * ⚡ ATOMIC EXECUTION ENGINE
   * Optimized retry logic with exponential backoff and rate-limit awareness.
   */
  async #request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.#baseUrl}/repos/${this.owner}/${this.repo}/${endpoint.replace(/^\/+/, '')}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: { ...this.#headers, ...options.headers },
          signal: AbortSignal.timeout(30000), // Integrated modern timeout
        });

        if (response.status === 403 || response.status === 429) {
          const reset = response.headers.get('X-RateLimit-Reset');
          const delay = reset
            ? Math.max(0, Number(reset) * 1000 - Date.now()) + 1000
            : 2 ** attempt * 1000;

          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Δ_ERR: ${err.message} (${response.status})`);
        }

        return await response.json();
      } catch (error: any) {
        if (attempt === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      }
    }
    throw new Error('Δ_TERMINATE: RETRY_LIMIT_EXCEEDED');
  }

  async getAuthenticatedUser(): Promise<any> {
    return this.#request(`${this.#baseUrl}/user`);
  }

  async listUserRepos(): Promise<any[]> {
    return this.#request(`${this.#baseUrl}/user/repos?sort=updated&per_page=100`);
  }

  async searchRepos(query: string): Promise<any[]> {
    const params = new URLSearchParams({ q: query, sort: 'stars', order: 'desc', per_page: '10' });
    const data = await this.#request<{ items: any[] }>(`${this.#baseUrl}/search/repositories?${params}`);
    return data.items ?? [];
  }

  async listOrgRepos(org: string): Promise<any[]> {
    return this.#request(`${this.#baseUrl}/orgs/${encodeURIComponent(org)}/repos?sort=updated&per_page=10`);
  }

  async getContents(path = ''): Promise<GitHubFile[]> {
    return this.#request(`contents/${path}`);
  }

  async getFile(path: string, branch?: string): Promise<GitHubFile> {
    const query = branch ? `?ref=${encodeURIComponent(branch)}` : '';
    return this.#request(`contents/${encodeURIComponent(path)}${query}`);
  }

  async getAllFiles(branch = 'main'): Promise<GitHubFile[]> {
    const data = await this.#request<{ tree: any[]; truncated: boolean }>(
      `git/trees/${encodeURIComponent(branch)}?recursive=1`
    );

    if (data.truncated) console.warn('Δ_WARN: TREE_TRUNCATED');

    return (data.tree ?? [])
      .filter((n) => n.type === 'blob')
      .map((n) => ({
        path: n.path,
        sha: n.sha,
        size: n.size,
        url: n.url,
        type: 'file',
      } as GitHubFile));
  }

  async getFileContent(sha: string): Promise<string> {
    const bytes = await this.getFileBinary(sha);
    const content = new TextDecoder().decode(bytes);

    if (content.trim().startsWith('<!DOCTYPE')) {
      throw new Error(`Δ_FAULT: BLOB_${sha}_IS_HTML`);
    }
    return content;
  }

  async getFileBinary(sha: string): Promise<Uint8Array> {
    const { content } = await this.#request<{ content: string }>(`git/blobs/${sha}`);
    if (!content) throw new Error(`Δ_NULL_BLOB: ${sha}`);
    return base64ToBuffer(content);
  }

  async getDefaultBranch(): Promise<string> {
    const repo = await this.#request<any>('');
    return repo.default_branch ?? 'main';
  }

  async updateFile(path: string, content: string, message: string, branch: string, sha?: string) {
    const base64Content = bufferToBase64(new TextEncoder().encode(content));
    return this.updateFileRaw(path, base64Content, message, branch, sha);
  }

  async updateFileRaw(path: string, base64Content: string, message: string, branch: string, sha?: string) {
    const cleanPath = path.replace(/^\/+/, '');
    return this.#request(`contents/${encodeURIComponent(cleanPath)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: message || `🧬 SPLICED: ${cleanPath}`,
        content: base64Content.replace(/\s/g, ''),
        branch,
        ...(sha && { sha }),
      }),
    });
  }

  async createBranch(branchName: string, baseBranch?: string): Promise<boolean> {
    try {
      const target = baseBranch || (await this.getDefaultBranch());
      const ref = await this.#request<any>(`git/refs/heads/${target}`);
      const sha = ref?.object?.sha;

      if (!sha) throw new Error(`Δ_NULL_SHA: ${target}`);

      await this.#request('git/refs', {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
      });
      return true;
    } catch (e) {
      console.error('Δ_BRANCH_FAILURE:', e);
      return false;
    }
  }

  async deleteBranch(branchName: string): Promise<void> {
    return this.#request(`git/refs/heads/${encodeURIComponent(branchName)}`, { method: 'DELETE' });
  }

  async listBranches(): Promise<any[]> {
    return this.#request('branches');
  }

  async getFileCommits(path: string): Promise<any[]> {
    return this.#request(`commits?path=${encodeURIComponent(path)}`);
  }
}