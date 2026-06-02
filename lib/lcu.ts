import fs from "fs";
import path from "path";
import https from "https";

export interface LCUCredentials {
  port: number;
  password: string;
  baseUrl: string;
  authHeader: string;
}

/**
 * Reads the League Client lockfile to extract port + auth token.
 * The lockfile is at: C:\Riot Games\League of Legends\lockfile  (Windows)
 *                  or  ~/Library/Application Support/LoL/...    (Mac)
 *
 * Format: <name>:<pid>:<port>:<password>:<protocol>
 */
function findLockfilePath(): string | null {
  const candidates = [
    // Windows default
    "C:\\Riot Games\\League of Legends\\lockfile",
    "C:\\Program Files\\Riot Games\\League of Legends\\lockfile",
    // Mac default
    path.join(
      process.env.HOME || "",
      "Library/Application Support/LoL/lockfile",
    ),
    path.join(
      process.env.HOME || "",
      "Applications/League of Legends.app/Contents/LoL/lockfile",
    ),
    // Environment variable override
    process.env.LCU_LOCKFILE_PATH || "",
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

export function getLCUCredentials(): LCUCredentials | null {
  const lockfilePath = findLockfilePath();
  if (!lockfilePath) return null;

  try {
    const content = fs.readFileSync(lockfilePath, "utf-8").trim();
    const parts = content.split(":");
    if (parts.length < 5) return null;

    const rawPort = parts[2]?.trim();
    const port = Number(rawPort);
    if (!port || Number.isNaN(port)) {
      console.error("Invalid LCU port from lockfile:", parts);
      return null;
    }
    const password = parts[3];
    const authHeader =
      "Basic " + Buffer.from(`riot:${password}`).toString("base64");

    return {
      port,
      password,
      baseUrl: `https://127.0.0.1:${port}`,
      authHeader,
    };
  } catch {
    return null;
  }
}

/** Shared HTTPS agent that ignores the LCU's self-signed cert */
export const lcuAgent = new https.Agent({ rejectUnauthorized: false });
