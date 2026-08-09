// Shared Snippe payment client for Edge Functions.
// Docs: https://docs.snippe.sh/docs/2026-01-25/payments/mobile-money
//
// The API key lives ONLY in Edge Function secrets (SNIPPE_API_KEY), never in
// the client. All calls are server-to-server over HTTPS.

const SNIPPE_BASE = 'https://api.snippe.sh';

export interface CreatePaymentInput {
  amount: number; // integer TZS
  phoneNumber: string; // 255XXXXXXXXX
  customerName: string;
  webhookUrl: string;
  idempotencyKey: string; // <= 30 chars
  metadata?: Record<string, unknown>;
}

export interface SnippePayment {
  reference: string;
  status: string;
  expires_at?: string;
}

/** Normalise a TZ phone number to 255XXXXXXXXX (Snippe's expected format). */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '255' + p.slice(1);
  if (p.length === 9) p = '255' + p; // e.g. 712345678
  return p;
}

/** Create a mobile-money payment intent. Returns the Snippe reference. */
export async function snippeCreatePayment(
  apiKey: string,
  input: CreatePaymentInput,
): Promise<SnippePayment> {
  const [firstname, ...rest] = input.customerName.trim().split(' ');
  const lastname = rest.join(' ') || firstname;

  const res = await fetch(`${SNIPPE_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      payment_type: 'mobile',
      details: { amount: input.amount, currency: 'TZS' },
      phone_number: input.phoneNumber,
      customer: { firstname, lastname, email: 'customer@hotspot.local' },
      webhook_url: input.webhookUrl,
      metadata: input.metadata ?? {},
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status === 'error') {
    const msg = body?.message ?? `Snippe error ${res.status}`;
    throw new Error(msg);
  }
  return body.data as SnippePayment;
}

/**
 * Verify a Snippe webhook signature.
 * Snippe signs: hex(HMAC-SHA256(signing_key, "{timestamp}.{raw_body}")).
 * We recompute and compare in constant time, and reject stale timestamps
 * (> 5 minutes) to prevent replay attacks.
 */
export async function verifyWebhookSignature(
  signingKey: string,
  rawBody: string,
  timestamp: string,
  signature: string,
  maxAgeSeconds = 300,
): Promise<boolean> {
  // Replay protection: reject if the timestamp is too old or too far in future.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  const tsSec = ts > 1e12 ? Math.floor(ts / 1000) : ts; // accept ms or s
  if (Math.abs(nowSec - tsSec) > maxAgeSeconds) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return constantTimeEqual(expected, signature.trim().toLowerCase());
}

/** Constant-time string compare to avoid timing attacks. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
