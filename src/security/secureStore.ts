// Secure local storage for the agent token and per-router credentials cache.
// The token is never written in plaintext: it is encrypted at rest with a
// key derived from a machine-specific secret + a passphrase.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { hostname, userInfo } from 'node:os';

const STORE_DIR = process.env.AGENT_DATA_DIR ?? join(process.cwd(), '.agent-data');
const STORE_FILE = join(STORE_DIR, 'secure.bin');
const ALGO = 'aes-256-gcm';

// Machine-bound passphrase: combines a fixed app salt, hostname and username.
// Not a hardware root of trust, but ensures the file is not portable as-is.
function deriveKey(): Buffer {
  const material = `hotspot-agent::${hostname()}::${userInfo().username}::${process.env.AGENT_SECRET ?? 'default'}`;
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
