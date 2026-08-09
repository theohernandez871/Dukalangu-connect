-- =====================================================================
-- PHASE 3 / Module 6 + 7: Webhook event log + idempotency.
-- ADDITIVE ONLY — new table. Stores every processed Snippe webhook event id so
-- duplicate deliveries are ignored (unique event_id). Doubles as a payment log.
-- =====================================================================

create table if not exists public.payment_webhook_events (
  id             uuid primary key default gen_random_uuid(),
  event_id       text unique not null,           -- Snippe event id (dedupe key)
  transaction_id uuid references public.payment_transactions(id) on delete set null,
  event_type     text,
  received_at    timestamptz not null default now()
);

create index if not exists idx_webhook_events_tx on public.payment_webhook_events(transaction_id);

-- Written only by the webhook Edge Function (service role). No client access.
alter table public.payment_webhook_events enable row level security;
