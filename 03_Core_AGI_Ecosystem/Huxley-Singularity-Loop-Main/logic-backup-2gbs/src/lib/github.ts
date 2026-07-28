
export interface GitHubRepo {
  owner: { login: string };
  name: string;
  default_branch: string;
}

export const ghFetch = async (url: string, token: string, options: RequestInit = {}) => {
  // Use Bearer for all modern tokens (github_pat or ghp_)
  // Most GitHub APIs now accept Bearer for all PAT types.
  const authHeader = `Bearer ${token.trim()}`;
  
  const headers: Record<string, string> = {
    'Authorization': authHeader,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers }).catch(e => {
    if (e.message.includes('Failed to fetch')) {
      throw new Error("Network Error: Failed to connect to GitHub. Verify your credentials and internet connection.");
    }
    throw e;
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || (errorData.errors ? JSON.stringify(errorData.errors) : response.statusText);
      if (response.status === 403 && errorMessage.toLowerCase().includes('protected branch')) {
        errorMessage = "Operation failed: The branch is PROTECTED. Please disable branch protection in repository settings to allow distillation.";
      }
    } catch (e) {
      // Not JSON
    }
    throw new Error(`GitHub API Error [${response.status}]: ${errorMessage}`);
  }
  return response;
};

export const getRepoTree = async (repoUrl: string, token: string, branch: string = 'main') => {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL structure');
  const [_, owner, name] = match;
  const cleanName = name.replace(/\.git$/, '').replace(/\/$/, '');
  
  // Branch names with slashes MUST be encoded
  const encodedBranch = encodeURIComponent(branch);
  const res = await ghFetch(`https://api.github.com/repos/${owner}/${cleanName}/git/trees/${encodedBranch}?recursive=1`, token);
  return res.json();
};

export const getFileContent = async (url: string, token: string) => {
  const res = await ghFetch(url, token);
  const data = await res.json();
  
  if (!data.content) return "";

  try {
    // Standard base64 decoding that handles UTF-8 correctly
    const binaryString = atob(data.content.replace(/\s/g, ''));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.warn(`[github] Failed to decode content for ${url}:`, e);
    return "/* [Error: Binary or malformed content could not be decoded] */";
  }
};

export const getBranches = async (owner: string, repo: string, token: string) => {
  const res = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/branches`, token);
  return res.json();
};

export const createBranch = async (owner: string, repo: string, newBranch: string, baseBranch: string, token: string) => {
  console.log(`[createBranch] Creating [${newBranch}] from [${baseBranch}]`);
  
  // Use encoded branch for commit lookup
  const encodedBase = encodeURIComponent(baseBranch);
  const baseRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/commits/${encodedBase}`, token);
  const baseData = await baseRes.json();
  const sha = baseData.sha;

  try {
    const res = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha
      })
    });
    return await res.json();
  } catch (e: any) {
    console.warn(`[createBranch] Fallback triggered:`, e.message);
    const fallbackName = `backup-${Math.random().toString(36).substring(2, 7)}`;
    const res = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${fallbackName}`,
        sha
      })
    });
    return await res.json();
  }
};

export const distillRepository = async (owner: string, repo: string, readmeContent: string, token: string, branch: string) => {
  console.log(`[distillRepository] Distilling [${branch}]`);
  
  const encodedBranch = encodeURIComponent(branch);
  const commitRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/commits/${encodedBranch}`, token);
  const commitData = await commitRes.json();
  const parentSha = commitData.sha;

  const blobRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, token, {
    method: 'POST',
    body: JSON.stringify({
      content: btoa(unescape(encodeURIComponent(readmeContent))),
      encoding: 'base64'
    })
  });
  const blobData = await blobRes.json();

  // 3. Create a new tree containing ONLY the README
  // Note: To delete all other files, we do NOT specify a base_tree.
  // This creates a "root" tree with only the provided elements.
  const treeRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({
      tree: [
        {
          path: 'README.md',
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        }
      ]
    })
  });
  const treeData = await treeRes.json();

  // 4. Create a new commit
  const finalCommitRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: 'chore: distill repository to logic manifest',
      tree: treeData.sha,
      parents: [parentSha]
    })
  });
  const finalCommitData = await finalCommitRes.json();

  // 5. Update the branch reference
  const encodedRef = encodeURIComponent(branch);
  const updateRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodedRef}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: finalCommitData.sha,
      force: true
    })
  });
  return updateRes.json();
};
