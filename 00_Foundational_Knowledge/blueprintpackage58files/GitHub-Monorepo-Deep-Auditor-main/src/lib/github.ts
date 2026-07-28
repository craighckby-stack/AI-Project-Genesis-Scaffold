import { FileAnalysis } from "../types";

export async function fetchGitHub(endpoint: string, token: string) {
  const url = endpoint.startsWith("http") ? endpoint : `https://api.github.com${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}) on ${url}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Fetch error on ${url}: ${error.message}`);
  }
}

export function redactSensitiveData(text: string): string {
  if (!text) return text;
  
  // Redact potential API keys (generic heuristics)
  let redacted = text.replace(/(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/g, "[REDACTED_GITHUB_TOKEN]");
  redacted = redacted.replace(/(?:sk_live_|sk_test_)[0-9a-zA-Z]{24}/g, "[REDACTED_STRIPE_KEY]");
  redacted = redacted.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GOOGLE_API_KEY]");
  redacted = redacted.replace(/xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g, "[REDACTED_SLACK_TOKEN]");
  
  // Basic Email Redaction
  redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  
  // Basic Phone/DOB or numeric secrets (very loose heuristic, careful not to break versions)
  // E.g., matching basic SSN or phone patterns could be too aggressive for code, 
  // so we'll stick to highly likely sensitive patterns.
  
  return redacted;
}

export function bypassHuxleyWatermark(text: string): string {
  if (!text) return text;
  // If Huxley replaced the README with its own generated analysis, it often leaves a signature.
  // We want to remove this so it doesn't falsely categorize everything as HUXLEY.
  return text.replace(/enhanced by Huxley/gi, "")
             .replace(/Huxley analysis/gi, "")
             .replace(/Huxley readme/gi, "");
}

export async function pushToGitHub(
  token: string,
  repoFullName: string,
  files: Record<string, string>,
  message: string = "docs: add Monorepo Consolidation Plan manifests",
  directCommit: boolean = false
): Promise<string> {
  const baseUrl = `https://api.github.com/repos/${repoFullName}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // 1. Get default branch
  const repoRes = await fetch(baseUrl, { headers });
  if (!repoRes.ok) throw new Error("Repository not found or access denied.");
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  // 2. Get latest commit SHA
  const refRes = await fetch(`${baseUrl}/git/refs/heads/${defaultBranch}`, { headers });
  if (!refRes.ok) throw new Error(`Could not fetch branch reference for ${defaultBranch}.`);
  const refData = await refRes.json();
  const commitSha = refData.object.sha;

  // 3. Get base tree SHA
  const commitRes = await fetch(`${baseUrl}/git/commits/${commitSha}`, { headers });
  if (!commitRes.ok) throw new Error("Could not fetch latest commit.");
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 4. Create blobs and tree items
  const treeItems = [];
  for (const [filename, content] of Object.entries(files)) {
    const blobRes = await fetch(`${baseUrl}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content, encoding: "utf-8" })
    });
    if (!blobRes.ok) throw new Error(`Failed to create blob for ${filename}`);
    const blobData = await blobRes.json();
    treeItems.push({
      path: filename,
      mode: "100644",
      type: "blob",
      sha: blobData.sha
    });
  }

  // 5. Create new tree
  const treeRes = await fetch(`${baseUrl}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
  });
  if (!treeRes.ok) throw new Error("Failed to create Git tree.");
  const treeData = await treeRes.json();

  // 6. Create commit
  const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, tree: treeData.sha, parents: [commitSha] })
  });
  if (!newCommitRes.ok) throw new Error("Failed to create commit.");
  const newCommitData = await newCommitRes.json();

  // 7. Create or Update Branch Ref
  if (directCommit) {
    const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${defaultBranch}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha, force: true })
    });
    
    if (!updateRefRes.ok) throw new Error(`Failed to update default branch ${defaultBranch} in-place.`);
    return `https://github.com/${repoFullName}/tree/${defaultBranch}`;
  } else {
    const branchName = "huxley-audit-manifests-" + Date.now();
    const refPath = `refs/heads/${branchName}`;

    const createRefRes = await fetch(`${baseUrl}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: refPath, sha: newCommitData.sha })
    });
    
    if (!createRefRes.ok) throw new Error("Failed to create new branch.");
    return `https://github.com/${repoFullName}/tree/${branchName}`;
  }
}

export function analyzeFiles(treeFiles: any[]): FileAnalysis {
  const analysis: FileAnalysis = {
    frameworks: [],
    subsystems: [],
    isMultiSystem: false,
    primaryStack: "Unknown",
  };

  if (!treeFiles || !Array.isArray(treeFiles)) return analysis;

  const paths = treeFiles.map((f) => f.path);

  const hasPackageJson = paths.some((p) => p.endsWith("package.json"));
  const hasIndexHtml = paths.some((p) => p.endsWith("index.html"));
  const hasPyRequirements = paths.some(
    (p) =>
      p.endsWith("requirements.txt") ||
      p.endsWith("Pipfile") ||
      p.endsWith("pyproject.toml")
  );
  const hasDocker = paths.some(
    (p) =>
      p.toLowerCase().includes("dockerfile") ||
      p.toLowerCase().includes("docker-compose")
  );
  const hasGoMod = paths.some((p) => p.endsWith("go.mod"));

  const hasFrontendDir = paths.some(
    (p) => p.includes("frontend/") || p.includes("client/") || p.includes("ui/")
  );
  const hasBackendDir = paths.some(
    (p) => p.includes("backend/") || p.includes("server/") || p.includes("api/")
  );

  if (hasFrontendDir) analysis.subsystems.push("Frontend Dir");
  if (hasBackendDir) analysis.subsystems.push("Backend Dir");

  const packageJsonCount = paths.filter((p) => p.endsWith("package.json")).length;
  if (packageJsonCount > 1) {
    analysis.isMultiSystem = true;
    analysis.subsystems.push(`Nested Nodes (${packageJsonCount}x package.json)`);
  }

  if (hasPackageJson) {
    const isVite = paths.some((p) => p.includes("vite.config"));
    const isNext = paths.some((p) => p.includes("next.config"));
    if (isNext) analysis.frameworks.push("Next.js");
    else if (isVite) analysis.frameworks.push("Vite / React");
    else analysis.frameworks.push("Node.js");
  }

  if (hasIndexHtml && !hasPackageJson)
    analysis.frameworks.push("Static HTML / Vanilla JS");
  else if (hasIndexHtml) analysis.frameworks.push("HTML Frontend");

  if (hasPyRequirements) analysis.frameworks.push("Python");
  if (hasGoMod) analysis.frameworks.push("Go");
  if (hasDocker) analysis.frameworks.push("Dockerized");

  if (hasFrontendDir && hasBackendDir) {
    analysis.primaryStack = "Full Stack (Decoupled)";
    analysis.isMultiSystem = true;
  } else if (analysis.isMultiSystem) {
    analysis.primaryStack = "Multi-Service Monorepo";
  } else if (analysis.frameworks.length > 0) {
    analysis.primaryStack = analysis.frameworks.join(" + ");
  } else if (
    paths.some(
      (p) => p.endsWith(".sh") || p.endsWith(".yml") || p.endsWith(".json")
    )
  ) {
    analysis.primaryStack = "Configuration / Scripts";
  }

  return analysis;
}

export function categorizeRepo(
  name: string,
  readmeContent: string,
  fileAnalysis: FileAnalysis,
  bypassHuxley: boolean = false
): string {
  let processedReadme = readmeContent || "";
  if (bypassHuxley) {
    processedReadme = bypassHuxleyWatermark(processedReadme);
  }
  
  const text = `${name} ${processedReadme}`.toLowerCase();

  if (
    text.includes("test") ||
    text.includes("archive") ||
    text.includes("deprecated") ||
    text.includes("sandbox") ||
    name.match(/^[0-9]+$/) ||
    text.includes("chunk")
  )
    return "TEST/ARCHIVE";
  if (
    text.includes("darlek") ||
    text.includes("caan") ||
    text.includes("dalek")
  )
    return "DARLEK-CAAN";
  if (text.includes("huxley")) return "HUXLEY";
  if (text.includes("sovereign")) return "SOVEREIGN";
  if (text.includes("grog")) return "GROG";
  if (text.includes("emg") || text.includes("memory-core")) return "EMG";
  if (text.includes("euler") || text.includes("evolution-engine"))
    return "EULER-ENGINE";
  if (text.includes("echo") || text.includes("chamber")) return "ECHO-CHAMBER";
  if (text.includes("aether") || text.includes("world")) return "AETHER-FORGE";
  if (text.includes("chess")) return "CHESS-AI";
  if (
    text.includes("book") ||
    text.includes("encyclopedia") ||
    text.includes("foundation") ||
    text.includes("documentation")
  )
    return "BOOKS/DOCS";
  if (
    text.includes("enhancer") ||
    text.includes("tool") ||
    text.includes("utility") ||
    text.includes("rag")
  )
    return "TOOLS/UTILITIES";

  if (fileAnalysis.isMultiSystem) return "UNCATEGORIZED MULTI-SYSTEM";
  return "UNCATEGORIZED / OTHER";
}

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
