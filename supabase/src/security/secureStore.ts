// Secure local storage for the agent token and per-router credentials cache.
// The token is never written in plaintext: it is encrypted at rest with a
// key derived from a machine-specific secret + a passphrase.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname } from 'node:os';

// Config must live at a FIXED location that is identical whether the agent is
// run interactively (user "THEO") or as a Windows Service (user "SYSTEM").
// Using process.cwd() breaks under a service because LocalSystem's working
// directory is C:\Windows\System32, not the agent folder. We therefore anchor
// the store next to the installed code (dist/../.agent-data), overridable via
// AGENT_DATA_DIR for advanced setups.
const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); // dist/security
const APP_ROOT = join(MODULE_DIR, '..', '..'); // agent/
const STORE_DIR = process.env.AGENT_DATA_DIR ?? join(APP_ROOT, '.agent-data');
const STORE_FILE = join(STORE_DIR, 'secure.bin');
const ALGO = 'aes-256-gcm';

// Machine-bound passphrase. IMPORTANT: this must NOT depend on the OS username,
// because config is written by the interactive user but read by the LocalSystem
// service — a username-based key would fail to decrypt under the service. We
// bind to the hostname (stable across accounts on the same machine) plus an
// optional AGENT_SECRET.
function deriveKey(): Buffer {
  const material = `hotspot-agent::${hostname()}::${process.env.AGENT_SECRET ?? 'default'}`;
  return scryptSync(material, 'hotspot-agent-salt', 32);
}

interface Vault {
  token?: string;
  [k: string]: string | undefined;
}

export async function saveSecure(data: Vault): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: iv(12) | tag(16) | ciphertext
  await writeFile(STORE_FILE, Buffer.concat([iv, tag, enc]));
}

export async function loadSecure(): Promise<Vault> {
  try {
    const buf = await readFile(STORE_FILE);
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv(ALGO, deriveKey(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString('utf8')) as Vault;
  } catch {
    return {};
  }
}
