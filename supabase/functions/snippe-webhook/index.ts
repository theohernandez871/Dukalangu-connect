// Edge Function: snippe-webhook
// Receives Snippe payment callbacks. Security (Module 7):
//   1. Verify HMAC-SHA256 signature over "{timestamp}.{rawBody}".
//   2. Reject stale timestamps (replay protection, in verifyWebhookSignature).
//   3. Deduplicate by event id (idempotency) so repeated deliveries are safe.
// On payment.completed -> fulfill_payment (generate voucher + enqueue MikroTik).
// On failed/voided/expired -> mark_payment_status.
//
// Secrets: SNIPPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// IMPORTANT: we read the RAW body for signature verification — parsing first
// would change the bytes and break the HMAC.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, env } from '../_shared/http.ts';
import { verifyWebhookSignature } from '../_shared/snippe.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const rawBody = await req.text();
  const timestamp = req.headers.get('X-Webhook-Timestamp') ?? '';
  const signature = req.headers.get('X-Webhook-Signature') ?? '';

  // 1 + 2. Verify signature and freshness before trusting anything.
  const valid = await verifyWebhookSignature(
    env('SNIPPE_WEBHOOK_SECRET'),
    rawBody,
    timestamp,
    signature,
  ).catch(() => false);
  if (!valid) {
    return json({ error: 'Invalid signature' }, 401);
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

  const eventId = String(event.id ?? '');
  const eventType = String(event.type ?? event.event ?? '');
  const data = (event.data ?? {}) as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const transactionId = String(metadata.transaction_id ?? '');

  if (!transactionId) {
    // Nothing we can correlate — acknowledge so Snippe stops retrying.
    return json({ ok: true, ignored: 'no transaction_id' });
  }

  // 3. Idempotency: record the event id; if seen before, skip processing.
  if (eventId) {
    const { error: dupErr } = await admin
      .from('payment_webhook_events')
      .insert({ event_id: eventId, transaction_id: transactionId, event_type: eventType });
    if (dupErr) {
      // Unique violation = already processed. Acknowledge and stop.
      return json({ ok: true, duplicate: true });
    }
  }

  try {
    if (eventType === 'payment.completed') {
      const { data: result, error } = await admin.rpc('fulfill_payment', {
        p_transaction_id: transactionId,
      });
      if (error) return json({ error: String(error.message) }, 500);
      return json({ ok: true, result });
    }

    if (['payment.failed', 'payment.voided', 'payment.expired'].includes(eventType)) {
      const status = eventType.split('.')[1]; // failed | voided | expired
      await admin.rpc('mark_payment_status', {
        p_transaction_id: transactionId,
        p_status: status,
        p_reason: String(data.failure_reason ?? eventType),
      });
      return json({ ok: true, status });
    }

    // Unknown event type — acknowledge without action.
    return json({ ok: true, ignored: eventType });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
