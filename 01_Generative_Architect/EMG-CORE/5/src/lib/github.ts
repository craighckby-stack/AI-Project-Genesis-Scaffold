import { CoreIdentity, ChatMessage, BackupData } from "../types";

export function jsonToBinary(jsonData: any): string {
  const jsonString = JSON.stringify(jsonData);
  let binaryString = "";
  for (let i = 0; i < jsonString.length; i++) {
    // Standard 8-bit representation requested by user architecture
    binaryString += jsonString.charCodeAt(i).toString(2).padStart(8, "0");
  }
  return binaryString;
}

export function binaryToJson(input: string): any {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid input: input must be a non-empty string.");
  }

  const rawInput = input.trim();

  // 1. RAW JSON CHECK
  if (rawInput.startsWith("{") || rawInput.startsWith("[")) {
    try {
      return JSON.parse(rawInput);
    } catch (e) {
      console.warn("Input looks like JSON but failed to parse. Attempting recovery...");
    }
  }

  // 2. DETECT INPUT TYPE (Bitstring vs Base64 vs Raw)
  const isBitstring = /^[01\s]+$/.test(rawInput);
  
  let bitSource = "";
  let textSource = "";

  if (isBitstring) {
    bitSource = rawInput.replace(/\s/g, "");
    if (bitSource.length % 8 !== 0) {
      console.warn("Bitstring length not divisible by 8, padding with zeros");
      bitSource = bitSource.padEnd(Math.ceil(bitSource.length / 8) * 8, '0');
    }
  } else {
    // Try Base64 transition (from previous version)
    try {
      const decoded = atob(rawInput.replace(/\s/g, ""));
      if (decoded.trim().startsWith("{") || decoded.trim().startsWith("[")) {
        try { return JSON.parse(decoded); } catch (e) { textSource = decoded; }
      }
      if (/^[01\s]+$/.test(decoded)) {
        bitSource = decoded.replace(/\s/g, "");
      } else {
        textSource = decoded;
      }
    } catch (e) {
      textSource = rawInput;
    }
  }

  if (bitSource) {
    const cleanBits = bitSource.replace(/[^01]/g, "");
    if (cleanBits.length % 8 !== 0) {
      throw new Error(`Invalid bitstring: length ${cleanBits.length} not divisible by 8`);
    }
    let decodedString = "";
    for (let i = 0; i < cleanBits.length; i += 8) {
      const byte = cleanBits.slice(i, i + 8);
      decodedString += String.fromCharCode(parseInt(byte, 2));
    }
    
    try {
      return JSON.parse(decodedString);
    } catch (e) {
      return attemptStructuralRescue(decodedString);
    }
  }

  // Final fallback to structural rescue
  try {
     return attemptStructuralRescue(textSource || rawInput);
  } catch (e) {
     throw new Error(`Critical Structure Loss: No valid patterns detected. Length: ${rawInput.length}`);
  }
}

/**
 * ATOMIC MUTATION ENGINE: Bypasses standard high-level file APIs to construct commits atomatically.
 */
export async function commitChangesAtomic(token: string, owner: string, repo: string, branchName: string, commitMessage: string, filesToUpdate: { path: string, newContent: string }[]) {
  const _fetch = async (url: string, opts: any = {}) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${url}`, {
      ...opts,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...opts.headers
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Git Pipeline Error: ${err.message}`);
    }
    return res.json();
  };

  const getRef = async (ref: string) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/${ref}`, {
      headers: { 'Authorization': `token ${token}` }
    });
    return res.json();
  };

  const toBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));

  const baseRef = await getRef(`heads/${branchName}`);
  const baseCommitSha = baseRef.object.sha;
  const baseCommit = await _fetch(`/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const newTreeEntries = await Promise.all(filesToUpdate.map(async file => {
    const blob = await _fetch('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: toBase64(file.newContent), encoding: 'base64' })
    });
    return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
  }));

  const newTree = await _fetch('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: newTreeEntries })
  });

  const newCommit = await _fetch('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [baseCommitSha] })
  });

  await _fetch(`/git/refs/heads/${branchName}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha })
  });

  return newCommit;
}


/**
 * Aggressive structural rescue for corrupted JSON
 */
function attemptStructuralRescue(input: string): any {
  let sanitized = input
    .replace(/\uFFFD/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  const firstBrace = sanitized.indexOf('{');
  const firstBracket = sanitized.indexOf('[');
  const lastBrace = sanitized.lastIndexOf('}');
  const lastBracket = sanitized.lastIndexOf(']');

  const start = (firstBrace !== -1 && (firstBracket === -1 || (firstBrace < firstBracket))) ? firstBrace : firstBracket;
  const end = Math.max(lastBrace, lastBracket);

  if (start === -1 || end === -1) {
    console.warn("No valid JSON structure found (no braces or brackets)");
    throw new Error(`Critical Structure Loss: No valid patterns detected. Length: ${input.length}`);
  }

  if (end > start) {
    sanitized = sanitized.substring(start, end + 1);
  }

  // Common JSON corruptions
  sanitized = sanitized
    .replace(/,(\s*[}\]])/g, "$1") // Trailing commas
    .replace(/:(?!\s*["{\[0-9tfn\-])/g, ': null') // Missing values
    .replace(/([{,]\s*)(?<![\d])([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3'); // Unquoted keys (excluding numeric prefix keys)

  try {
    return JSON.parse(sanitized);
  } catch (err) {
    let repaired = sanitized.trim();
    
    // Simple bracket balancer
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    if (openBraces > closeBraces) {
      if (!repaired.endsWith('"') && repaired.lastIndexOf('"') > Math.max(repaired.lastIndexOf(':'), repaired.lastIndexOf(','))) {
        repaired += '"';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
    }
    if (openBrackets > closeBrackets) {
      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
    }

    try {
      return JSON.parse(repaired);
    } catch (inner) {
      const match = repaired.match(/{.*}/s) || repaired.match(/\[.*\]/s);
      if (match) {
        try { return JSON.parse(match[0]); } catch (e) {}
      }
      throw inner;
    }
  }
}


// Duplicate interface removed
const REPO_OWNER = 'craighckby-stack';
const REPO_NAME = 'EMG-CORE';
const BACKUP_PATH = 'Tools/Binary State Backup/';

async function resolveOwner(token: string): Promise<string> {
  const res = await fetch(`https://api.github.com/user`, {
    headers: { 'Authorization': `token ${token}` }
  });
  if (res.ok) {
    const data = await res.json();
    return data.login;
  }
  return 'craighckby-stack'; // Fallback
}

export async function saveBinaryToGitHub(token: string, data: BackupData): Promise<{ success: boolean; message: string }> {
  try {
    const owner = await resolveOwner(token);
    const binaryData = jsonToBinary(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `emg-core-binary-${timestamp}.bin`;
    const path = `${BACKUP_PATH}${filename}`;

    const response = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `EMG Core binary state save ${timestamp}`,
        content: btoa(binaryData)
      })
    });

    if (response.ok) {
      return { success: true, message: `Successfully saved as ${filename}` };
    } else {
      const errorJson = await response.json();
      return { success: false, message: errorJson.message || "Failed to save state." };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Network error." };
  }
}

export function validateBackupData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.timestamp !== 'string') return false;
  if (!data.coreIdentity || typeof data.coreIdentity !== 'object') return false;
  if (!Array.isArray(data.coreIdentity.principles)) return false;
  if (!Array.isArray(data.coreIdentity.learningLog)) return false;
  if (!Array.isArray(data.conversationHistory)) return false;
  return true;
}

export async function loadLatestBinaryFromGitHub(token: string): Promise<{ success: boolean; data?: BackupData; message: string }> {
  try {
    const owner = await resolveOwner(token);
    const response = await fetch(`https://api.github.com/repos/${owner}/${REPO_NAME}/contents/${BACKUP_PATH}`, {
      headers: { 'Authorization': `token ${token}` }
    });

    if (!response.ok) {
      return { success: false, message: "Failed to access repository backup path." };
    }

    const files = await response.json();
    const binaryFiles = files
      .filter((file: any) => file.name.startsWith('emg-core-binary-') && file.name.endsWith('.bin'))
      .sort((a: any, b: any) => b.name.localeCompare(a.name));

    if (binaryFiles.length === 0) {
      return { success: false, message: "No backup files found." };
    }

    const latestFile = binaryFiles[0];
    
    // FETCH VIA API
    const fileResponse = await fetch(latestFile.url, {
      headers: { 'Authorization': `token ${token}` }
    });

    if (!fileResponse.ok) {
      return { success: false, message: "Failed to fetch file content via API." };
    }

    const fileData = await fileResponse.json();
    const base64Content = (fileData.content || '').replace(/\s/g, '');
    
    if (!base64Content) {
      return { success: false, message: "File content is empty." };
    }
    
    const jsonData = binaryToJson(base64Content);
    if (!validateBackupData(jsonData)) {
      return { success: false, message: "Corrupted backup file: Schema integrity validation failed." };
    }
    return { success: true, data: jsonData, message: `Loaded state from ${latestFile.name}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to load state." };
  }
}
