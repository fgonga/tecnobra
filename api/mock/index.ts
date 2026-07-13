import { config as loadEnv } from "dotenv";
import { resolve } from "path";
loadEnv({ path: resolve(import.meta.dir, "../.env") });
import express from "express";
import { appypayRouter } from "./routes/appypay.js";
import { thinkificRouter } from "./routes/thinkific.js";
import { smsRouter } from "./routes/sms.js";
import { whatsappRouter } from "./routes/whatsapp.js";
import { store } from "./store.js";

const app = express();
app.use(express.json());

const PORT = process.env.MOCK_APP_PORT;
const WEBHOOK_URL = process.env.MOCK_WEBHOOK_URL;

// ── Rotas de serviços ──────────────────────────────────────
app.use("/appypay", appypayRouter);
app.use("/thinkific/api/public/v1", thinkificRouter);
app.use("/sms", smsRouter);
app.use("/whatsapp", whatsappRouter);

// ── API de estado para o dashboard ────────────────────────
app.get("/mock/state", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json(store.snapshot());
});

// ── Dashboard ──────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.send(DASHBOARD_HTML);
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║       Mock Server iniciado               ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Dashboard:  http://127.0.0.1:${PORT}      ║`);
  console.log(`║  AppyPay:    /appypay/v2.0/*             ║`);
  console.log(`║  Thinkific:  /thinkific/api/public/v1/*  ║`);
  console.log(`║  SMS:        /sms/api/v2/send_message    ║`);
  console.log(`║  WhatsApp:   /whatsapp/send/message      ║`);
  console.log(`║  Webhook →   ${WEBHOOK_URL}`);
  console.log(`╚══════════════════════════════════════════╝\n`);
  console.log(`Configure o .env com:`);
  console.log(`  APPYPAY_API_URL=http://127.0.0.1:${PORT}/appypay`);
  console.log(
    `  APPYPAY_AUTH_URL=http://127.0.0.1:${PORT}/appypay/oauth2/token`,
  );
  console.log(
    `  THINKIFIC_BASE_URL=http://127.0.0.1:${PORT}/thinkific/api/public/v1`,
  );
  console.log(
    `  SMS_API_URL=http://127.0.0.1:${PORT}/sms/api/v2/send_message\n`,
  );
});

// ── Dashboard HTML ─────────────────────────────────────────
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mock Server — Treesix Dev</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }
  header { background: #1a1d2e; border-bottom: 1px solid #2d3748; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  header h1 { font-size: 18px; font-weight: 600; color: #fff; }
  header .badge { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; padding: 2px 10px; border-radius: 99px; font-size: 12px; }
  .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px; }
  .card { background: #1a1d2e; border: 1px solid #2d3748; border-radius: 12px; overflow: hidden; }
  .card.full { grid-column: 1 / -1; }
  .card-header { padding: 14px 18px; border-bottom: 1px solid #2d3748; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .card-body { padding: 16px 18px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.green { background: #22c55e; }
  .dot.yellow { background: #f59e0b; }
  .dot.red { background: #ef4444; }
  .dot.blue { background: #3b82f6; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 10px; color: #94a3b8; font-weight: 500; border-bottom: 1px solid #2d3748; }
  td { padding: 10px 10px; border-bottom: 1px solid #1e2433; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #ffffff08; }
  .status { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .status.pending { background: #f59e0b22; color: #f59e0b; }
  .status.paid { background: #22c55e22; color: #22c55e; }
  .status.failed { background: #ef444422; color: #ef4444; }
  .status.refunded { background: #8b5cf622; color: #8b5cf6; }
  .btn { border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity .15s; }
  .btn:hover { opacity: .8; }
  .btn-green { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; }
  .btn-yellow { background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; }
  .btn-red { background: #ef444422; color: #ef4444; border: 1px solid #ef444444; }
  .actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .empty { color: #4a5568; font-size: 13px; padding: 20px 0; text-align: center; }
  .sms-item { padding: 10px; background: #0f1117; border-radius: 8px; margin-bottom: 8px; }
  .sms-to { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
  .sms-body { font-size: 13px; }
  .sms-time { font-size: 10px; color: #4a5568; margin-top: 4px; }
  .counter { background: #2d374888; padding: 2px 8px; border-radius: 99px; font-size: 11px; color: #94a3b8; margin-left: auto; }
  .toast { position: fixed; bottom: 24px; right: 24px; background: #1a1d2e; border: 1px solid #2d3748; border-radius: 10px; padding: 12px 18px; font-size: 13px; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 999; }
  .toast.show { opacity: 1; }
  .toast.ok { border-color: #22c55e44; color: #22c55e; }
  .toast.err { border-color: #ef444444; color: #ef4444; }
  .form-row { display: flex; gap: 8px; align-items: center; padding: 12px 18px 14px; border-bottom: 1px solid #2d3748; flex-wrap: wrap; }
  .form-row label { font-size: 11px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px; }
  .form-row input { background: #0f1117; border: 1px solid #2d3748; color: #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 13px; font-family: inherit; min-width: 130px; }
  .form-row input:focus { outline: none; border-color: #3b82f6; }
  .form-row .btn-primary { background: #3b82f622; color: #3b82f6; border: 1px solid #3b82f644; padding: 7px 14px; align-self: flex-end; }
  .hint { font-size: 11px; color: #4a5568; margin-left: auto; align-self: flex-end; }
</style>
</head>
<body>
<header>
  <div class="dot green"></div>
  <h1>Mock Server</h1>
  <span class="badge">DEV</span>
  <span style="margin-left:auto;font-size:12px;color:#4a5568" id="last-update"></span>
</header>

<div class="layout">
  <!-- AppyPay Charges -->
  <div class="card full">
    <div class="card-header">
      <div class="dot yellow"></div>
      AppyPay — Pagamentos
      <span class="counter" id="charge-count">0</span>
    </div>
    <div class="card-body">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>merchantTransactionId</th>
            <th>Valor</th>
            <th>Método</th>
            <th>Info</th>
            <th>Estado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="charges-body">
          <tr><td colspan="7" class="empty">Sem pagamentos pendentes</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- AppyPay References -->
  <div class="card full">
    <div class="card-header">
      <div class="dot blue"></div>
      AppyPay — Referências registadas
      <span class="counter" id="ref-count">0</span>
    </div>
    <div class="form-row">
      <label>Entidade
        <input id="adhoc-entity" placeholder="00123" maxlength="5">
      </label>
      <label>Referência
        <input id="adhoc-ref" placeholder="123456789" inputmode="numeric" pattern="\\d{9,15}">
      </label>
      <label>Valor (AOA)
        <input id="adhoc-amount" type="number" step="any" placeholder="2500">
      </label>
      <button class="btn btn-primary" onclick="payAdhoc()">💸 Disparar pagamento</button>
      <span class="hint">Cliente paga a referência no Multicaixa → webhook</span>
    </div>
    <div class="card-body">
      <table>
        <thead>
          <tr>
            <th>Entidade</th>
            <th>Referência</th>
            <th>Min / Max</th>
            <th>Validade</th>
            <th>Estado</th>
            <th>Criada por</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="refs-body">
          <tr><td colspan="7" class="empty">Sem referências registadas</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Thinkific Users -->
  <div class="card">
    <div class="card-header">
      <div class="dot blue"></div>
      Thinkific — Utilizadores
      <span class="counter" id="user-count">0</span>
    </div>
    <div class="card-body">
      <table>
        <thead>
          <tr><th>ID</th><th>Nome</th><th>Email</th><th>Criado</th></tr>
        </thead>
        <tbody id="users-body">
          <tr><td colspan="4" class="empty">Nenhum utilizador criado</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Thinkific Enrollments -->
  <div class="card">
    <div class="card-header">
      <div class="dot blue"></div>
      Thinkific — Matrículas
      <span class="counter" id="enroll-count">0</span>
    </div>
    <div class="card-body">
      <table>
        <thead>
          <tr><th>ID</th><th>User</th><th>Tipo</th><th>Curso/Bundle</th><th>Expira</th></tr>
        </thead>
        <tbody id="enrollments-body">
          <tr><td colspan="5" class="empty">Sem matrículas</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- SMS Inbox -->
  <div class="card">
    <div class="card-header">
      <div class="dot green"></div>
      SMS Inbox
      <span class="counter" id="sms-count">0</span>
    </div>
    <div class="card-body" id="sms-inbox">
      <div class="empty">Nenhum SMS enviado</div>
    </div>
  </div>

  <!-- WhatsApp Inbox -->
  <div class="card">
    <div class="card-header">
      <div class="dot green"></div>
      WhatsApp Inbox
      <span class="counter" id="wa-count">0</span>
    </div>
    <div class="card-body" id="wa-inbox">
      <div class="empty">Nenhuma mensagem enviada</div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  function toast(msg, ok = true) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show ' + (ok ? 'ok' : 'err');
    setTimeout(() => el.className = 'toast', 3000);
  }

  async function action(chargeId, act) {
    try {
      const r = await fetch('/appypay/mock/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeId, action: act }),
      });
      const data = await r.json();
      if (r.ok) toast('Webhook disparado: ' + act);
      else toast('Erro: ' + (data.error || 'desconhecido'), false);
    } catch (e) {
      toast('Falha na ligação ao mock server', false);
    }
  }

  async function dispatchRefPayment(body, label) {
    try {
      const r = await fetch('/appypay/mock/ref-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok) {
        toast((label || 'Pagamento') + ' disparado: ' + body.amount + ' AOA');
        return true;
      }
      toast('Erro: ' + (data.error || 'desconhecido'), false);
      return false;
    } catch (e) {
      toast('Falha na ligação ao mock server', false);
      return false;
    }
  }

  async function payReference(referenceNumber, suggested) {
    const input = prompt('Valor a pagar para a referência ' + referenceNumber + ' (AOA):', String(suggested ?? ''));
    if (input === null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) return toast('Valor inválido', false);
    await dispatchRefPayment({ referenceNumber, amount }, 'Pagamento');
  }

  async function payAdhoc() {
    const refEl = document.getElementById('adhoc-ref');
    const amtEl = document.getElementById('adhoc-amount');
    const entEl = document.getElementById('adhoc-entity');
    const referenceNumber = refEl.value.trim();
    const amount = Number(amtEl.value);
    const entity = entEl.value.trim() || undefined;

    if (!/^\\d{9,15}$/.test(referenceNumber)) return toast('Referência inválida (9-15 dígitos)', false);
    if (!Number.isFinite(amount) || amount <= 0) return toast('Valor inválido', false);

    const ok = await dispatchRefPayment({ referenceNumber, amount, entity }, 'Pagamento ad-hoc');
    if (ok) { refEl.value = ''; amtEl.value = ''; }
  }

  function statusBadge(s) {
    const map = { pending: 'Pendente', paid: 'Pago', failed: 'Falhou', refunded: 'Devolvido' };
    return \`<span class="status \${s}">\${map[s] || s}</span>\`;
  }

  function paymentInfo(charge) {
    const info = charge.paymentInfo;
    if (!info) return '—';
    if (info.phoneNumber) return '📱 ' + info.phoneNumber;
    if (info.referenceNumber) return '🏦 ' + info.referenceNumber;
    if (info.posCode) return '🖥 ' + info.posCode;
    return JSON.stringify(info);
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
  }

  function refState(r) {
    if (!r.isActive) return 'failed';
    return new Date(r.expirationDate).getTime() > Date.now() ? 'paid' : 'failed';
  }

  function refStateLabel(r) {
    if (!r.isActive) return 'Cancelada';
    return new Date(r.expirationDate).getTime() > Date.now() ? 'Activa' : 'Expirada';
  }

  async function refresh() {
    try {
      const r = await fetch('/mock/state', { cache: 'no-store' });
      const { charges, references, users, enrollments, smsInbox, whatsappInbox } = await r.json();

      document.getElementById('charge-count').textContent = charges.length;
      document.getElementById('ref-count').textContent = references?.length ?? 0;
      document.getElementById('user-count').textContent = users.length;
      document.getElementById('enroll-count').textContent = enrollments.length;
      document.getElementById('sms-count').textContent = smsInbox.length;
      document.getElementById('wa-count').textContent = whatsappInbox.length;
      document.getElementById('last-update').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('pt-PT');

      // Charges
      const cb = document.getElementById('charges-body');
      if (charges.length === 0) {
        cb.innerHTML = '<tr><td colspan="7" class="empty">Sem pagamentos</td></tr>';
      } else {
        cb.innerHTML = charges.map(c => \`
          <tr>
            <td style="font-family:monospace;font-size:11px;color:#94a3b8">\${c.id.substring(0,8)}…</td>
            <td style="font-family:monospace;font-size:12px">\${c.merchantTransactionId}</td>
            <td>\${(c.amount / 100).toFixed(2)} AOA</td>
            <td>\${c.paymentMethod}</td>
            <td>\${paymentInfo(c)}</td>
            <td>\${statusBadge(c.status)}</td>
            <td>
              \${c.status === 'pending' ? \`
              <div class="actions">
                <button class="btn btn-green" onclick="action('\${c.id}','approve')">✓ Aprovar</button>
                <button class="btn btn-yellow" onclick="action('\${c.id}','refuse_expired')">⏱ Expirou</button>
                <button class="btn btn-red" onclick="action('\${c.id}','refuse_unauthorized')">✗ Cancelou</button>
                <button class="btn btn-red" onclick="action('\${c.id}','refuse_phone_inactive')">📵 Nº inativo</button>
              </div>\` : '—'}
            </td>
          </tr>
        \`).join('');
      }

      // References
      const rb = document.getElementById('refs-body');
      const refs = references ?? [];
      if (refs.length === 0) {
        rb.innerHTML = '<tr><td colspan="7" class="empty">Sem referências registadas</td></tr>';
      } else {
        rb.innerHTML = refs.map(ref => \`
          <tr>
            <td style="font-family:monospace;font-size:12px">\${ref.entity}</td>
            <td style="font-family:monospace;font-size:12px">\${ref.referenceNumber}</td>
            <td style="font-size:12px;color:#94a3b8">\${ref.minAmount ?? '—'} / \${ref.maxAmount ?? '—'}</td>
            <td style="font-size:11px;color:#94a3b8">até \${fmtDate(ref.expirationDate)}</td>
            <td><span class="status \${refState(ref)}">\${refStateLabel(ref)}</span></td>
            <td style="font-size:11px;color:#94a3b8">\${ref.createdBy}</td>
            <td>
              \${ref.isActive ? \`
              <div class="actions">
                <button class="btn btn-green" onclick="payReference('\${ref.referenceNumber}', \${ref.minAmount ?? 100})">💸 Simular pagamento</button>
              </div>\` : '—'}
            </td>
          </tr>
        \`).join('');
      }

      // Users
      const ub = document.getElementById('users-body');
      if (users.length === 0) {
        ub.innerHTML = '<tr><td colspan="4" class="empty">Nenhum utilizador</td></tr>';
      } else {
        ub.innerHTML = users.map(u => \`
          <tr>
            <td>#\${u.id}</td>
            <td>\${u.first_name} \${u.last_name}</td>
            <td>\${u.email}</td>
            <td>\${fmtDate(u.created_at)}</td>
          </tr>
        \`).join('');
      }

      // Enrollments
      const eb = document.getElementById('enrollments-body');
      if (enrollments.length === 0) {
        eb.innerHTML = '<tr><td colspan="5" class="empty">Sem matrículas</td></tr>';
      } else {
        eb.innerHTML = enrollments.map(e => \`
          <tr>
            <td>#\${e.id}</td>
            <td>#\${e.user_id}</td>
            <td>\${e.type}</td>
            <td>#\${e.course_id || e.bundle_id}</td>
            <td>\${fmtDate(e.expiry_date)}</td>
          </tr>
        \`).join('');
      }

      // SMS
      const si = document.getElementById('sms-inbox');
      if (smsInbox.length === 0) {
        si.innerHTML = '<div class="empty">Nenhum SMS enviado</div>';
      } else {
        si.innerHTML = [...smsInbox].reverse().map(s => \`
          <div class="sms-item">
            <div class="sms-to">📱 \${s.to}</div>
            <div class="sms-body">\${s.message}</div>
            <div class="sms-time">\${fmtDate(s.sentAt)}</div>
          </div>
        \`).join('');
      }

      // WhatsApp
      const wi = document.getElementById('wa-inbox');
      if (whatsappInbox.length === 0) {
        wi.innerHTML = '<div class="empty">Nenhuma mensagem enviada</div>';
      } else {
        wi.innerHTML = [...whatsappInbox].reverse().map(m => \`
          <div class="sms-item">
            <div class="sms-to">💬 \${m.phone} <span style="color:#4a5568;margin-left:8px;font-size:10px">device: \${m.device}</span></div>
            <div class="sms-body" style="white-space:pre-wrap">\${m.message}</div>
            <div class="sms-time">\${fmtDate(m.sentAt)}</div>
          </div>
        \`).join('');
      }
    } catch (e) {
      console.error('Refresh failed', e);
    }
  }

  refresh();
  setInterval(refresh, 3000);
</script>
</body>
</html>`;
