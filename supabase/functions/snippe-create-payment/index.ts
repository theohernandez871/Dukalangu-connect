// Edge Function: snippe-create-payment
// Public endpoint called by the captive portal when a customer taps "Nunua".
// Flow:
//   1. Resolve company from portal slug (only enabled portals).
//   2. Load the package server-side — PRICE IS TAKEN FROM THE DB, never from the
//      client, so a customer cannot pay less than the real price.
//   3. Create a pending payment_transactions row.
//   4. Call Snippe to create the mobile-money intent (USSD push).
//   5. Return the reference so the portal can poll/await the webhook.
//
// Secrets (Edge Function env): SNIPPE_API_KEY, PUBLIC_WEBHOOK_URL,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight, env } from '../_shared/http.ts';
import { snippeCreatePayment, normalizePhone } from '../_shared/snippe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const body = (await req.json()) as Record<string, unknown>;

    const slug = String(body.slug ?? '').trim();
    const packageId = String(body.packageId ?? '').trim();
    const phoneRaw = String(body.phone ?? '').trim();
    const routerId = body.routerId ? String(body.routerId) : null;

    if (!slug || !packageId || !phoneRaw) {
      return json({ error: 'slug, packageId na phone vinahitajika' }, 400);
    }
    const phone = normalizePhone(phoneRaw);
    if (!/^255\d{9}$/.test(phone)) {
      return json({ error: 'Namba ya simu si sahihi. Tumia mfano 0712345678.' }, 400);
    }

    // 1. Resolve company from the (enabled) portal slug.
    const { data: portal } = await admin
      .from('portal_settings')
      .select('company_id')
      .eq('slug', slug)
      .eq('is_enabled', true)
      .maybeSingle();
    if (!portal) return json({ error: 'Portal haipatikani' }, 404);
    const companyId = portal.company_id as string;

    // 2. Load package server-side (price + profile come from DB, not client).
    const { data: pkg } = await admin
      .from('packages')
      .select('id, price, branch_id, router_profile, is_active, name')
      .eq('id', packageId)
      .eq('company_id', companyId)
      .maybeSingle();
    if (!pkg || !pkg.is_active) return json({ error: 'Kifurushi hakipatikani' }, 404);

    const amount = Number(pkg.price);
    if (!Number.isInteger(amount) || amount < 500) {
      return json({ error: 'Bei ya kifurushi si sahihi (chini ya kiwango cha chini).' }, 400);
    }

    // 3. Create a pending transaction. The idempotency key must be <= 30 chars.
    const idempotencyKey = crypto.randomUUID().replace(/-/g, '').slice(0, 30);
    const { data: tx, error: txErr } = await admin
      .from('payment_transactions')
      .insert({
        company_id: companyId,
        branch_id: pkg.branch_id,
        package_id: pkg.id,
        idempotency_key: idempotencyKey,
        amount,
        currency: 'TZS',
        phone_number: phone,
        status: 'pending',
        router_id: routerId,
        router_profile: pkg.router_profile,
      })
      .select('id')
      .single();
    if (txErr || !tx) {
      return json({ error: 'Imeshindwa kuanzisha muamala' }, 500);
    }

    // 4. Call Snippe. metadata carries our transaction id so the webhook can
    //    match the payment back without a lookup table.
    let payment;
    try {
      payment = await snippeCreatePayment(env('SNIPPE_API_KEY'), {
        amount,
        phoneNumber: phone,
        customerName: 'Hotspot Customer',
        webhookUrl: env('PUBLIC_WEBHOOK_URL'),
        idempotencyKey,
        metadata: { transaction_id: tx.id, company_id: companyId },
      });
    } catch (e) {
      // Mark the transaction failed so it isn't left dangling as pending.
      await admin
        .from('payment_transactions')
        .update({ status: 'failed', failure_reason: String(e), updated_at: new Date().toISOString() })
        .eq('id', tx.id);
      return json({ error: `Malipo yameshindwa: ${String(e)}` }, 502);
    }

    // 5. Store the Snippe reference and return it.
    await admin
      .from('payment_transactions')
      .update({ snippe_reference: payment.reference, updated_at: new Date().toISOString() })
      .eq('id', tx.id);

    return json({
      ok: true,
      transactionId: tx.id,
      reference: payment.reference,
      status: payment.status,
      message: 'Utapokea ombi la USSD kwenye simu yako. Weka PIN kukamilisha malipo.',
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
