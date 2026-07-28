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
  fileAnalysis: FileAnalysis
): string {
  const text = `${name} ${readmeContent || ""}`.toLowerCase();

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
