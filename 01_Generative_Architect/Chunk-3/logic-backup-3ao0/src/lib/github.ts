export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

export class GitHubService {
  private token: string;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  private async fetchAPI(endpoint: string, retries = 3, backoff = 1000, method = 'GET', body?: any) {
    const path = endpoint ? `/${endpoint}` : '';
    const url = `https://api.github.com/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}${path}`;
    
    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const options: RequestInit = {
          method,
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (response.status === 403 || response.status === 429) {
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          const waitTime = rateLimitReset 
            ? Math.max(0, (parseInt(rateLimitReset) * 1000) - Date.now()) + 1000
            : backoff * Math.pow(2, i);
          
          if (i < retries - 1) {
            console.warn(`GitHub Rate Limit hit. Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (!response.ok) {
          let errorMsg = response.statusText;
          try {
            const errorBody = await response.json();
            errorMsg = errorBody.message || errorMsg;
          } catch (e) {}
          throw new Error(`GitHub API Error: ${errorMsg} (${response.status})`);
        }
        
        // DELETE often returns 204 No Content
        if (response.status === 204) return true;
        
        return response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
            continue;
          }
          throw new Error(`GitHub API Request Timeout: ${url}`);
        }
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
          continue;
        }
        throw err;
      }
    }
  }

  async listUserRepos(): Promise<any[]> {
    const url = `https://api.github.com/user/repos?sort=updated&per_page=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async getContents(path: string = ''): Promise<GitHubFile[]> {
    return this.fetchAPI(`contents/${path}`);
  }

  async getFile(path: string): Promise<GitHubFile> {
    return this.fetchAPI(`contents/${path}`);
  }

  async getAllFiles(branch: string = 'main'): Promise<GitHubFile[]> {
    console.log(`GitHubService: Fetching recursive tree for branch ${branch}...`);
    const tree = await this.fetchAPI(`git/trees/${encodeURIComponent(branch)}?recursive=1`);
    if (!tree.tree) {
      console.log(`GitHubService: No tree found for branch ${branch}.`);
      return [];
    }
    
    console.log(`GitHubService: Tree fetched with ${tree.tree.length} items.`);
    return tree.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({
        name: item.path.split('/').pop() || '',
        path: item.path,
        sha: item.sha,
        size: item.size || 0,
        url: item.url,
        html_url: `https://github.com/${this.owner}/${this.repo}/blob/${branch}/${item.path}`,
        git_url: item.url,
        download_url: `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${branch}/${item.path}`,
        type: 'file'
      }))
      .filter((item: any) => {
        const isNodeModule = item.path.includes('node_modules');
        const isDist = item.path.includes('dist/') || item.path.includes('build/');
        return !isNodeModule && !isDist;
      });
  }

  async getFileContent(sha: string): Promise<string> {
    const data = await this.fetchAPI(`git/blobs/${sha}`);
    if (data.content) {
      // GitHub API returns base64 with newlines
      const base64 = data.content.replace(/\n/g, '');
      // Decode base64 to string (handling UTF-8)
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    throw new Error(`No content found for blob ${sha}`);
  }

  async getFileCommits(path: string): Promise<any[]> {
    return this.fetchAPI(`commits?path=${encodeURIComponent(path)}`);
  }

  async getDefaultBranch(): Promise<string> {
    const repoInfo = await this.fetchAPI('');
    return repoInfo.default_branch || 'main';
  }

  async listBranches(): Promise<any[]> {
    return this.fetchAPI('branches');
  }

  async deleteBranch(branchName: string) {
    const endpoint = `git/refs/heads/${encodeURIComponent(branchName)}`;
    await this.fetchAPI(endpoint, 3, 1000, 'DELETE');
    return true;
  }

  async updateFile(path: string, content: string, message: string, branch: string, sha?: string) {
    // Robust Base64 encoding for Unicode characters
    const bytes = new TextEncoder().encode(content);
    const base64 = btoa(String.fromCharCode(...bytes));

    return this.updateFileRaw(path, base64, message, branch, sha);
  }

  async updateFileRaw(path: string, base64Content: string, message: string, branch: string, sha?: string) {
    const endpoint = `contents/${encodeURIComponent(path)}`;
    const body: any = {
      message,
      content: base64Content,
      branch,
    };
    if (sha) {
      body.sha = sha;
    }

    return this.fetchAPI(endpoint, 3, 1000, 'PUT', body);
  }

  async createBranch(branchName: string, baseBranch: string = 'main') {
    const baseRef = await this.fetchAPI(`git/refs/heads/${baseBranch}`);
    const sha = baseRef.object.sha;
    
    const body = {
      ref: `refs/heads/${branchName}`,
      sha,
    };

    // Note: createBranch uses /git/refs which is slightly different from the standard repo endpoint
    // But fetchAPI handles the base repo URL, so we just need the relative path
    return this.fetchAPI('git/refs', 3, 1000, 'POST', body);
  }
}
