// Self-contained Setup Wizard page (HTML + CSS + JS in one string). Served by
// wizardServer on 127.0.0.1. Kiswahili UI, no external assets, no framework.

export const WIZARD_HTML = `<!DOCTYPE html>
<html lang="sw">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Usanidi wa Agent — Hotspot Billing</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         background:#0f172a; color:#e2e8f0; }
  .wrap { max-width:560px; margin:0 auto; padding:24px 16px 48px; }
  h1 { font-size:22px; margin:8px 0 4px; }
  .sub { color:#94a3b8; font-size:14px; margin-bottom:20px; }
  .card { background:#1e293b; border:1px solid #334155; border-radius:16px; padding:20px; margin-bottom:16px; }
  label { display:block; font-size:13px; font-weight:600; margin:12px 0 6px; }
  input { width:100%; padding:11px 12px; border-radius:10px; border:1px solid #334155;
          background:#0f172a; color:#e2e8f0; font-size:15px; }
  input:focus { outline:none; border-color:#10b981; }
  .row { display:flex; gap:10px; }
  .row > div { flex:1; }
  button { width:100%; padding:13px; border:none; border-radius:10px; font-size:15px;
           font-weight:600; cursor:pointer; margin-top:16px; }
  .primary { background:#10b981; color:#052e1a; }
  .secondary { background:#334155; color:#e2e8f0; }
  .primary:disabled { opacity:.6; cursor:not-allowed; }
  .checks { margin-top:16px; }
  .check { display:flex; align-items:center; gap:10px; padding:10px 0; border-top:1px solid #334155; font-size:14px; }
  .dot { width:10px; height:10px; border-radius:50%; background:#64748b; flex-shrink:0; }
  .dot.ok { background:#10b981; } .dot.err { background:#ef4444; } .dot.run { background:#f59e0b; }
  .msg { color:#94a3b8; font-size:13px; }
  .banner { padding:12px; border-radius:10px; font-size:14px; margin-top:12px; }
  .banner.ok { background:#052e1a; color:#6ee7b7; } .banner.err { background:#3f1d1d; color:#fca5a5; }
  .hint { font-size:12px; color:#64748b; margin-top:4px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Usanidi wa Agent</h1>
  <div class="sub">Jaza taarifa hizi mara moja. Agent itaunganisha MikroTik yako na mfumo.</div>

  <div class="card">
    <label>Jina la Agent</label>
    <input id="agentName" placeholder="Agent ya Ofisi" />

    <label>MikroTik IP</label>
    <div class="row">
      <div style="flex:2"><input id="routerHost" placeholder="192.168.88.1" /></div>
      <div><input id="routerPort" placeholder="8728" value="8728" /></div>
    </div>
    <div class="hint">IP ya MikroTik na port ya API (kawaida 8728)</div>

    <label>Jina la mtumiaji la MikroTik (API)</label>
    <input id="routerUser" placeholder="admin" />

    <label>Nenosiri la MikroTik (API)</label>
    <input id="routerPassword" type="password" placeholder="••••••••" />
    <div class="hint" id="pwHint"></div>

    <label>Token ya Agent (License)</label>
    <input id="agentToken" type="password" placeholder="Bandika token kutoka dashboard" />
    <div class="hint" id="tokenHint">Unaipata: Dashboard → Routers → Agents → Tengeneza agent</div>

    <label>System URL</label>
    <input id="supabaseUrl" placeholder="https://xxxx.supabase.co" />

    <label>System Key (Anon Key)</label>
    <input id="supabaseAnonKey" type="password" placeholder="Anon key" />

    <button class="secondary" id="testBtn" onclick="runTest()">Jaribu Muunganisho</button>

    <div class="checks" id="checks" style="display:none">
      <div class="check"><span class="dot" id="d-internet"></span><div><b>Intaneti</b><div class="msg" id="m-internet"></div></div></div>
      <div class="check"><span class="dot" id="d-backend"></span><div><b>Backend</b><div class="msg" id="m-backend"></div></div></div>
      <div class="check"><span class="dot" id="d-mikrotik"></span><div><b>MikroTik</b><div class="msg" id="m-mikrotik"></div></div></div>
      <div class="check"><span class="dot" id="d-token"></span><div><b>Token</b><div class="msg" id="m-token"></div></div></div>
    </div>

    <button class="primary" id="saveBtn" onclick="save()">Hifadhi na Anzisha Agent</button>
    <div id="banner"></div>
  </div>
</div>

<script>
  const $ = (id) => document.getElementById(id);
  const fields = ['agentName','routerHost','routerPort','routerUser','routerPassword','agentToken','supabaseUrl','supabaseAnonKey'];

  async function loadCfg() {
    try {
      const r = await fetch('/api/config'); const c = await r.json();
      $('agentName').value = c.agentName || '';
      $('routerHost').value = c.routerHost || '';
      $('routerPort').value = c.routerPort || 8728;
      $('routerUser').value = c.routerUser || '';
      $('supabaseUrl').value = c.supabaseUrl || '';
      $('supabaseAnonKey').value = c.supabaseAnonKey || '';
      if (c.hasPassword) $('pwHint').textContent = 'Nenosiri limehifadhiwa. Acha wazi kubaki lile lile.';
      if (c.hasToken) { $('tokenHint').textContent = 'Token imehifadhiwa. Acha wazi kubaki ile ile.'; }
    } catch (e) {}
  }

  function collect() {
    const o = {};
    for (const f of fields) { const v = $(f).value.trim(); if (v) o[f] = v; }
    if (o.routerPort) o.routerPort = Number(o.routerPort);
    return o;
  }

  function setCheck(name, res) {
    const dot = $('d-'+name), msg = $('m-'+name);
    dot.className = 'dot ' + (res.ok ? 'ok' : 'err');
    msg.textContent = res.message;
  }

  async function runTest() {
    $('checks').style.display = 'block';
    for (const n of ['internet','backend','mikrotik','token']) { $('d-'+n).className='dot run'; $('m-'+n).textContent='Inajaribu...'; }
    $('testBtn').disabled = true;
    try {
      const r = await fetch('/api/test', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(collect()) });
      const res = await r.json();
      setCheck('internet', res.internet); setCheck('backend', res.backend);
      setCheck('mikrotik', res.mikrotik); setCheck('token', res.token);
    } catch (e) {
      banner(false, 'Imeshindwa kujaribu: ' + e);
    }
    $('testBtn').disabled = false;
  }

  function banner(ok, text) {
    $('banner').innerHTML = '<div class="banner '+(ok?'ok':'err')+'">'+text+'</div>';
  }

  async function save() {
    $('saveBtn').disabled = true;
    try {
      const r = await fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(collect()) });
      const res = await r.json();
      if (res.ok) banner(true, res.message || 'Imehifadhiwa!');
      else banner(false, res.error || 'Imeshindwa kuhifadhi.');
    } catch (e) {
      banner(false, 'Hitilafu: ' + e);
    }
    $('saveBtn').disabled = false;
  }

  loadCfg();
</script>
</body>
</html>`;
