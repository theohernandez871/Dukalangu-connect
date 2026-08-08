-- =====================================================================
-- PHASE 3 / Module 3B: Payment fulfillment.
-- ADDITIVE ONLY — one SECURITY DEFINER RPC called by the webhook Edge Function
-- (service role) after it has VERIFIED the Snippe signature. It runs with no
-- auth user, deriving company/package/router from the transaction row itself.
--
-- Idempotent by design: if the transaction is already 'completed' with a
-- voucher, it returns that voucher and does nothing else. This makes duplicate
-- webhook deliveries safe (Snippe may deliver the same event more than once).
--
-- Atomic: mark transaction -> create voucher -> enqueue MikroTik command all in
-- one transaction. A row lock (for update) prevents two concurrent webhooks
-- from double-issuing.
-- =====================================================================

create or replace function public.fulfill_payment(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fulfill$
declare
  _tx        public.payment_transactions%rowtype;
  _batch_id  uuid;
  _voucher   public.vouchers%rowtype;
  _code      text;
  _length    integer := 8;
  _attempts  integer := 0;
  _expires   timestamptz;
  _valid     integer;
begin
  -- Lock the transaction row so concurrent deliveries serialise here.
  select * into _tx from public.payment_transactions
   where id = p_transaction_id
   for update;

  if _tx.id is null then
    return jsonb_build_object('ok', false, 'error', 'transaction_not_found');
  end if;

  -- Idempotency: already fulfilled -> return the existing voucher.
  if _tx.status = 'completed' and _tx.voucher_id is not null then
    return jsonb_build_object('ok', true, 'already', true,
      'voucher_code', _tx.voucher_code, 'voucher_id', _tx.voucher_id);
  end if;

  -- Determine validity days from the package (if any).
  select validity_days into _valid from public.packages where id = _tx.package_id;
  if _valid is not null then
    _expires := now() + (_valid || ' days')::interval;
  end if;

  -- Create a single-voucher batch for this payment.
  insert into public.voucher_batches (company_id, branch_id, package_id, count, notes, created_by)
  values (_tx.company_id, _tx.branch_id, _tx.package_id, 1,
          'snippe:' || coalesce(_tx.snippe_reference, _tx.id::text), null)
  returning id into _batch_id;

  -- Generate one unique numeric code.
  loop
    _attempts := _attempts + 1;
    _code := lpad((floor(random() * (10::numeric ^ _length)))::bigint::text, _length, '0');
    begin
      insert into public.vouchers (company_id, batch_id, package_id, code, expires_at)
      values (_tx.company_id, _batch_id, _tx.package_id, _code, _expires)
      returning * into _voucher;
      exit;
    exception when unique_violation then
      if _attempts > 50 then
        return jsonb_build_object('ok', false, 'error', 'code_generation_failed');
      end if;
    end;
  end loop;

  -- Mark the transaction completed and link the voucher.
  update public.payment_transactions
     set status = 'completed',
         voucher_id = _voucher.id,
         voucher_code = _voucher.code,
         completed_at = now(),
         updated_at = now()
   where id = _tx.id;

  -- Enqueue the MikroTik create command (if a router was chosen at purchase).
  if _tx.router_id is not null then
    insert into public.router_commands (router_id, company_id, requested_by, command, params)
    values (_tx.router_id, _tx.company_id, null, 'hotspot.create_voucher',
      jsonb_build_object(
        'code', _voucher.code,
        'profile', coalesce(_tx.router_profile, 'default'),
        'comment', 'snippe:' || left(_tx.id::text, 8)
      ));
  end if;

  return jsonb_build_object('ok', true, 'already', false,
    'voucher_code', _voucher.code, 'voucher_id', _voucher.id,
    'expires_at', _expires);
end;
$fulfill$;

-- Mark a transaction failed/voided/expired (webhook for non-success events).
create or replace function public.mark_payment_status(p_transaction_id uuid, p_status text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $markstatus$
begin
  update public.payment_transactions
     set status = p_status,
         failure_reason = p_reason,
         updated_at = now()
   where id = p_transaction_id
     and status = 'pending';  -- never overwrite a completed payment
end;
$markstatus$;
