// Telegram AI Assistant · "segretario" del titolare (Fase 2)
//
// Webhook Telegram → GPT-4o-mini con tool-calling che interroga il
// gestionale e risponde in italiano. Solo il titolare (e chat extra
// autorizzate in salon_settings) può usarlo.
//
// Domande supportate, es.:
//  - "che appuntamenti ho oggi?"
//  - "quanti appuntamenti ha prenotato Marco Rossi?"
//  - "quanto ha speso da noi Luca?"
//  - "quanti pezzi di Slick Gorilla sono rimasti?"
//  - "chi deve ritirare un prodotto la settimana prossima?"
//  - "quanto ho incassato questo mese?"
//
// Requisiti runtime (Edge Function secrets):
//   TELEGRAM_BOT_TOKEN        (già usato dal notifications-router)
//   OPENAI_API_KEY
//   TELEGRAM_WEBHOOK_SECRET   (consigliato: validato sull'header Telegram)
// Skill-flag gated: skills_config.telegram_assistant deve essere enabled.
// Deploy con --no-verify-jwt (Telegram non invia JWT; la sicurezza è data
// dal secret_token dell'header + whitelist chat id).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const MODEL = 'gpt-4o-mini';
const TZ = 'Europe/Rome';
const MAX_TOOL_ROUNDS = 4;

// ── Telegram helpers ───────────────────────────────────────────────────────
async function tg(method: string, payload: Record<string, unknown>) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    /* best-effort */
  }
}

function reply(chatId: number | string, text: string) {
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true });
}

// ── Time helpers (Europe/Rome) ─────────────────────────────────────────────
function tzOffsetMs(at: Date): number {
  const utc = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }));
  const loc = new Date(at.toLocaleString('en-US', { timeZone: TZ }));
  return loc.getTime() - utc.getTime();
}
function romeTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
}
function romeDayRange(dateStr: string): { startISO: string; endISO: string } {
  const off = tzOffsetMs(new Date(`${dateStr}T12:00:00Z`));
  const startUTC = new Date(new Date(`${dateStr}T00:00:00Z`).getTime() - off);
  const endUTC = new Date(startUTC.getTime() + 24 * 3600 * 1000);
  return { startISO: startUTC.toISOString(), endISO: endUTC.toISOString() };
}
function eur(cents: number | null | undefined): string {
  return `€${(((cents ?? 0) as number) / 100).toFixed(2).replace('.', ',')}`;
}
function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}
function dmy(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Tools (DB queries via service-role client) ─────────────────────────────
type SB = ReturnType<typeof getSupabase>;

async function getTodayAppointments(sb: SB, args: { date?: string }) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const { startISO, endISO } = romeDayRange(date);
  const { data, error } = await sb
    .from('appointments')
    .select(
      `start_at, end_at, status, total_cents,
       customer:customer_id ( first_name, last_name, phone ),
       staff:staff_id ( name ),
       appointment_services ( service:service_id ( name ) )`,
    )
    .gte('start_at', startISO)
    .lt('start_at', endISO)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true });
  if (error) return { error: error.message };
  const items = (data ?? []).map((r: any) => ({
    ora: hhmm(r.start_at),
    cliente: [r.customer?.first_name, r.customer?.last_name].filter(Boolean).join(' ') || '—',
    telefono: r.customer?.phone ?? null,
    servizio: r.appointment_services?.[0]?.service?.name ?? 'Servizio',
    operatore: r.staff?.name ?? 'Da assegnare',
    stato: r.status,
  }));
  return { date, count: items.length, appointments: items };
}

async function getCustomerSummary(sb: SB, args: { name: string }) {
  const q = (args.name ?? '').trim();
  if (!q) return { error: 'nome mancante' };
  const { data: customers, error } = await sb
    .from('customers')
    .select('id, first_name, last_name, phone, email, birthdate, created_at')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(5);
  if (error) return { error: error.message };
  if (!customers || customers.length === 0) return { found: 0, note: `Nessun cliente trovato per "${q}"` };

  const results = [];
  for (const c of customers.slice(0, 3)) {
    const { data: appts } = await sb
      .from('appointments')
      .select('status, total_cents, start_at')
      .eq('customer_id', c.id);
    const rows = appts ?? [];
    const completed = rows.filter((a: any) => a.status === 'completed');
    const upcoming = rows
      .filter((a: any) => ['booked', 'confirmed'].includes(a.status) && new Date(a.start_at).getTime() > Date.now())
      .sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    const noShow = rows.filter((a: any) => a.status === 'no_show').length;
    const spentCents = completed.reduce((s: number, a: any) => s + (a.total_cents ?? 0), 0);
    const lastVisit = completed
      .map((a: any) => a.start_at)
      .sort()
      .at(-1);
    const { data: pkgs } = await sb
      .from('customer_packages')
      .select('credits_remaining, expires_at')
      .eq('customer_id', c.id)
      .eq('status', 'active');
    const credits = (pkgs ?? []).reduce((s: number, p: any) => s + (p.credits_remaining ?? 0), 0);

    results.push({
      cliente: [c.first_name, c.last_name].filter(Boolean).join(' '),
      telefono: c.phone ?? null,
      appuntamenti_totali: rows.length,
      completati: completed.length,
      no_show: noShow,
      speso_totale: eur(spentCents),
      ultima_visita: lastVisit ? dmy(lastVisit) : null,
      prossimo_appuntamento: upcoming[0] ? `${dmy(upcoming[0].start_at)} ${hhmm(upcoming[0].start_at)}` : null,
      crediti_pacchetto_attivi: credits,
      cliente_dal: c.created_at ? dmy(c.created_at) : null,
    });
  }
  return { found: customers.length, customers: results };
}

async function getProductStock(sb: SB, args: { name?: string }) {
  let query = sb.from('products').select('name, brand, stock, price_cents, is_active').eq('is_active', true);
  if (args.name && args.name.trim()) query = query.ilike('name', `%${args.name.trim()}%`);
  const { data, error } = await query.order('stock', { ascending: true }).limit(40);
  if (error) return { error: error.message };
  const items = (data ?? []).map((p: any) => ({
    prodotto: p.brand ? `${p.brand} ${p.name}` : p.name,
    stock: p.stock,
    prezzo: eur(p.price_cents),
  }));
  return { count: items.length, products: items };
}

async function getPickups(sb: SB, args: { days_ahead?: number }) {
  const days = Number.isFinite(args.days_ahead) ? Number(args.days_ahead) : 14;
  const until = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  const { data, error } = await sb
    .from('orders')
    .select('short_code, customer_first_name, customer_last_name, customer_phone, status, pickup_deadline, total_cents, order_items ( product_name, quantity )')
    .in('status', ['pending', 'ready'])
    .lte('pickup_deadline', until)
    .order('pickup_deadline', { ascending: true })
    .limit(40);
  if (error) return { error: error.message };
  const items = (data ?? []).map((o: any) => ({
    codice: o.short_code,
    cliente: [o.customer_first_name, o.customer_last_name].filter(Boolean).join(' '),
    telefono: o.customer_phone,
    stato: o.status === 'ready' ? 'pronto' : 'in preparazione',
    scadenza_ritiro: o.pickup_deadline ? dmy(o.pickup_deadline) : null,
    prodotti: (o.order_items ?? []).map((i: any) => `${i.quantity}× ${i.product_name}`),
    totale: eur(o.total_cents),
  }));
  return { count: items.length, window_days: days, pickups: items };
}

async function getStats(sb: SB, args: { period?: string }) {
  const today = romeTodayStr();
  const now = new Date(`${today}T12:00:00Z`);
  let from = today;
  const to = today;
  const period = args.period ?? 'month';
  if (period === 'today') {
    from = today;
  } else if (period === 'week') {
    const d = new Date(now);
    const dow = (d.getUTCDay() + 6) % 7; // Mon=0
    d.setUTCDate(d.getUTCDate() - dow);
    from = d.toISOString().slice(0, 10);
  } else if (period === 'month') {
    from = `${today.slice(0, 7)}-01`;
  } else if (period === 'last_month') {
    const d = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    from = d.toISOString().slice(0, 10);
    const end = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
    end.setUTCDate(0);
    return runStats(sb, from, end.toISOString().slice(0, 10), period);
  }
  return runStats(sb, from, to, period);
}
async function runStats(sb: SB, from: string, to: string, period: string) {
  const { data, error } = await sb.rpc('fn_admin_stats_range', { p_from: from, p_to: to });
  if (error) return { error: error.message };
  const s = (data ?? {}) as any;
  return {
    periodo: period,
    dal: from,
    al: to,
    incasso: eur(s.total_revenue_cents),
    appuntamenti_completati: s.total_completed ?? 0,
    no_show: s.total_noshow ?? 0,
    tasso_no_show_pct: s.no_show_rate_pct ?? 0,
    nuovi_clienti: s.new_customers ?? 0,
    top_servizi: s.top_services ?? [],
    top_operatori: s.top_staff ?? [],
  };
}

async function getCustomersAtRisk(sb: SB) {
  const { data, error } = await sb.rpc('fn_customers_at_risk', { p_min_visits: 2, p_days_silent: 90 });
  if (error) return { error: error.message };
  const items = (data ?? []).slice(0, 25).map((c: any) => ({
    cliente: [c.first_name, c.last_name].filter(Boolean).join(' '),
    telefono: c.phone,
    visite: c.completed_count,
    giorni_silenzio: c.days_since_last,
    valore_storico: eur(c.lifetime_value_cents),
  }));
  return { count: items.length, customers: items };
}

async function getExpiringPackages(sb: SB, args: { days_ahead?: number }) {
  const days = Number.isFinite(args.days_ahead) ? Number(args.days_ahead) : 30;
  const until = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  const { data, error } = await sb
    .from('customer_packages')
    .select('credits_remaining, expires_at, customer:customer_id ( first_name, last_name, phone ), package:package_id ( name )')
    .eq('status', 'active')
    .gt('credits_remaining', 0)
    .lte('expires_at', until)
    .order('expires_at', { ascending: true })
    .limit(40);
  if (error) return { error: error.message };
  const items = (data ?? []).map((p: any) => ({
    cliente: [p.customer?.first_name, p.customer?.last_name].filter(Boolean).join(' '),
    telefono: p.customer?.phone ?? null,
    pacchetto: p.package?.name ?? '—',
    crediti_rimasti: p.credits_remaining,
    scade_il: p.expires_at ? dmy(p.expires_at) : null,
  }));
  return { count: items.length, window_days: days, packages: items };
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_today_appointments',
      description: "Elenco appuntamenti di un giorno (default oggi). Ora, cliente, servizio, operatore, stato.",
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'Data YYYY-MM-DD, default oggi' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_summary',
      description: 'Scheda di un cliente per nome/telefono: numero appuntamenti, completati, no-show, totale speso, ultima visita, prossimo appuntamento, crediti pacchetto.',
      parameters: { type: 'object', properties: { name: { type: 'string', description: 'Nome, cognome o telefono del cliente' } }, required: ['name'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_stock',
      description: 'Giacenze prodotti. Senza nome: tutti i prodotti ordinati per stock crescente (utile per scorte basse). Con nome: filtra.',
      parameters: { type: 'object', properties: { name: { type: 'string', description: 'Nome prodotto (parziale), opzionale' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pickups',
      description: 'Ordini prodotti da ritirare in salone (click & collect) in stato pronto/in preparazione, con scadenza ritiro entro N giorni.',
      parameters: { type: 'object', properties: { days_ahead: { type: 'integer', description: 'Finestra giorni, default 14' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Statistiche del salone su un periodo: incasso, appuntamenti completati, no-show, nuovi clienti, top servizi/operatori.',
      parameters: { type: 'object', properties: { period: { type: 'string', enum: ['today', 'week', 'month', 'last_month'] } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customers_at_risk',
      description: 'Clienti a rischio: almeno 2 visite ma fermi da oltre 90 giorni, senza appuntamenti futuri.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expiring_packages',
      description: 'Pacchetti prepagati attivi con crediti residui in scadenza entro N giorni.',
      parameters: { type: 'object', properties: { days_ahead: { type: 'integer', description: 'Finestra giorni, default 30' } } },
    },
  },
];

async function execTool(sb: SB, name: string, args: any) {
  switch (name) {
    case 'get_today_appointments': return getTodayAppointments(sb, args);
    case 'get_customer_summary': return getCustomerSummary(sb, args);
    case 'get_product_stock': return getProductStock(sb, args);
    case 'get_pickups': return getPickups(sb, args);
    case 'get_stats': return getStats(sb, args);
    case 'get_customers_at_risk': return getCustomersAtRisk(sb);
    case 'get_expiring_packages': return getExpiringPackages(sb, args);
    default: return { error: `tool sconosciuto: ${name}` };
  }
}

const SYSTEM_PROMPT = `Sei il segretario digitale di "Hair Rich Olbia", una barberia.
Rispondi SOLO al titolare, in italiano, in modo conciso e diretto, con formattazione Telegram Markdown leggera (grassetto con *asterischi*, elenchi con trattini).
Usa SEMPRE i tool per ottenere dati reali: non inventare numeri, nomi, prezzi o giacenze.
La data di oggi è ${'${TODAY}'} (fuso ${TZ}). Gli importi sono in euro.
Se un cliente non viene trovato o un dato manca, dillo chiaramente.
Se la domanda è ambigua (es. più clienti con lo stesso nome), elenca le opzioni e chiedi di precisare.
Mantieni le risposte brevi: vai dritto al punto, niente preamboli.`;

interface OpenAIMsg {
  role: string;
  content: string | null;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
}

async function askOpenAI(messages: OpenAIMsg[]) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, temperature: 0.2, max_tokens: 900 }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}`);
  return (await res.json()) as { choices: Array<{ message: OpenAIMsg }> };
}

async function authorizedChatIds(sb: SB): Promise<Set<string>> {
  const { data } = await sb
    .from('salon_settings')
    .select('owner_telegram_chat_id, owner_telegram_extra_chat_ids')
    .limit(1)
    .maybeSingle();
  const ids = new Set<string>();
  const main = (data as any)?.owner_telegram_chat_id;
  if (main) ids.add(String(main).trim());
  for (const x of ((data as any)?.owner_telegram_extra_chat_ids ?? [])) ids.add(String(x).trim());
  return ids;
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  // Secret token check (impostato con setWebhook). Se configurato, è obbligatorio.
  const expectedSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (expectedSecret) {
    const got = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (got !== expectedSecret) return new Response('unauthorized', { status: 401 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response('ok', { status: 200 });
  }

  const message = update?.message ?? update?.edited_message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string = (message?.text ?? '').trim();
  if (!chatId || !text) return new Response('ok', { status: 200 });

  const sb = getSupabase();

  // Autorizzazione: solo titolare / chat extra.
  const allowed = await authorizedChatIds(sb);
  if (!allowed.has(String(chatId))) {
    await reply(chatId, '⛔️ Questo assistente è riservato al titolare di Hair Rich.');
    return new Response('ok', { status: 200 });
  }

  // Skill gate.
  const { data: skill } = await sb.from('skills_config').select('enabled').eq('skill_key', 'telegram_assistant').maybeSingle();
  if (!skill?.enabled) {
    await reply(chatId, "🔒 L'assistente Telegram è disattivato. Attivalo da /admin/funzionalità.");
    return new Response('ok', { status: 200 });
  }

  if (!Deno.env.get('OPENAI_API_KEY')) {
    await reply(chatId, '⚠️ Manca la chiave OpenAI lato server: avvisa lo sviluppatore.');
    return new Response('ok', { status: 200 });
  }

  if (text === '/start' || text === '/aiuto' || text === '/help') {
    await reply(
      chatId,
      '👋 *Sono il tuo segretario Hair Rich.*\nChiedimi pure, ad esempio:\n\n' +
        '• _Che appuntamenti ho oggi?_\n' +
        '• _Quanto ha speso Marco Rossi da noi?_\n' +
        '• _Quanti Slick Gorilla sono rimasti?_\n' +
        '• _Chi deve ritirare un prodotto la prossima settimana?_\n' +
        '• _Quanto ho incassato questo mese?_\n' +
        '• _Quali clienti sono a rischio?_',
    );
    return new Response('ok', { status: 200 });
  }

  await tg('sendChatAction', { chat_id: chatId, action: 'typing' });

  try {
    const messages: OpenAIMsg[] = [
      { role: 'system', content: SYSTEM_PROMPT.replace('${TODAY}', romeTodayStr()) },
      { role: 'user', content: text },
    ];

    let answer = '';
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await askOpenAI(messages);
      const msg = data.choices?.[0]?.message;
      if (!msg) break;
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg);
        for (const tc of msg.tool_calls) {
          let parsed: any = {};
          try {
            parsed = JSON.parse(tc.function.arguments || '{}');
          } catch {
            /* keep {} */
          }
          const result = await execTool(sb, tc.function.name, parsed);
          messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify(result) });
        }
        continue;
      }
      answer = msg.content ?? '';
      break;
    }

    await reply(chatId, answer || 'Non sono riuscito a rispondere, riprova a riformulare la domanda.');
  } catch (err) {
    await reply(chatId, '⚠️ Errore temporaneo. Riprova tra poco.');
    console.error('telegram-assistant error', (err as Error).message);
  }

  return new Response('ok', { status: 200 });
});
