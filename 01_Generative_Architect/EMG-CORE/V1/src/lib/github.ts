import { CoreIdentity, ChatMessage, BackupData } from "../types";

export function jsonToBinary(jsonData: any): string {
  // Use UTF-8 to ensure EVERY character (including emojis) is consistently 8-bit encoded
  const jsonString = JSON.stringify(jsonData);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonString);
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += bytes[i].toString(2).padStart(8, "0");
  }
  return binaryString;
}

export function binaryToJson(binaryString: string): any {
  if (!binaryString || typeof binaryString !== "string") {
    throw new Error("Invalid input: binaryString must be a non-empty string.");
  }

  const rawInput = binaryString.trim();

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
  let base64Fallback = "";

  if (isBitstring) {
    bitSource = rawInput.replace(/\s/g, "");
  } else {
    try {
      const decoded = atob(rawInput.replace(/\s/g, ""));
      if (decoded.trim().startsWith("{") || decoded.trim().startsWith("[")) {
        try { return JSON.parse(decoded); } catch (e) { base64Fallback = decoded; }
      }
      if (/^[01\s]+$/.test(decoded)) {
        bitSource = decoded.replace(/\s/g, "");
      } else {
        base64Fallback = decoded;
      }
    } catch (e) {
      base64Fallback = rawInput;
    }
  }

  const cleanBits = bitSource.replace(/[^01]/g, "");
  
  if (cleanBits.length >= 16) {
    const candidates: { decoded: string; shift: number; score: number }[] = [];
    
    for (let shift = 0; shift < 8; shift++) {
      const shiftedBits = cleanBits.substring(shift);
      const byteCount = Math.floor(shiftedBits.length / 8);
      if (byteCount < 1) continue;

      const bytes = new Uint8Array(byteCount);
      for (let i = 0; i < byteCount; i++) {
        bytes[i] = parseInt(shiftedBits.substr(i * 8, 8), 2);
      }

      let decodedStr = "";
      try {
        decodedStr = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      } catch (e) {
        // Fallback for non-UTF8 noise
        continue;
      }
      
      const structuralMatches = decodedStr.match(/"(coreIdentity|conversationHistory|rejectionMemory|mutationRegistry|params|principles|learningLog|evolutionHistory)"/g);
      if (structuralMatches && structuralMatches.length >= 2) {
        const tokens = (decodedStr.match(/[":{},[\]]/g) || []).length;
        const score = (structuralMatches.length * 5000) + tokens;
        candidates.push({ decoded: decodedStr, shift, score });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      
      for (const cand of candidates) {
        try {
          return attemptStructuralRescue(cand.decoded);
        } catch (e) {
          // Try next candidate
        }
      }
    }
  }

  // Fallback to structural rescue ONLY if it looks JSON-ish and is NOT a bitstring
  if (base64Fallback && (base64Fallback.includes('{') || base64Fallback.includes('['))) {
    return attemptStructuralRescue(base64Fallback);
  }

  throw new Error("Critical Structure Loss: No valid JSON patterns detected in the substrate.");
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

  if (start !== -1 && end !== -1 && end > start) {
    sanitized = sanitized.substring(start, end + 1);
  }

  // Common JSON corruptions
  sanitized = sanitized
    .replace(/,(\s*[}\]])/g, "$1") // Trailing commas
    .replace(/:(?!\s*["{\[0-9tfn\-])/g, ': null') // Missing values
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3'); // Unquoted keys (numeric keys covered too)

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
    
    // FETCH VIA API INSTEAD OF DOWNLOAD_URL TO PREVENT ENCODING ISSUES
    const fileResponse = await fetch(latestFile.url, {
      headers: { 'Authorization': `token ${token}` }
    });

    if (!fileResponse.ok) {
      return { success: false, message: "Failed to fetch file content via API." };
    }

    const fileData = await fileResponse.json();
    // GitHub API returns content as base64-encoded string (possibly with newlines)
    const base64Content = (fileData.content || '').replace(/\s/g, '');
    
    if (!base64Content) {
      return { success: false, message: "File content is empty." };
    }

    let binaryContent;
    try {
      binaryContent = atob(base64Content);
    } catch (e) {
      console.error("Base64 decode failed, trying raw text fallback");
      // If it wasn't base64 for some reason, maybe it was raw 0/1
      const rawTextResponse = await fetch(latestFile.download_url);
      binaryContent = (await rawTextResponse.text()).trim();
    }

    const jsonData = binaryToJson(binaryContent);
    return { success: true, data: jsonData, message: `Loaded state from ${latestFile.name}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to load state." };
  }
}
