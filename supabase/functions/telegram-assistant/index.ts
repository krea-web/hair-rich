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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const getSupabase = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

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

// ── Tool di SCRITTURA (DML diretto: service-role bypassa RLS) ───────────────
const EXPENSE_CATEGORIES = [
  'attrezzatura', 'pulizia_detergenti', 'merce_rivendita', 'abbigliamento_personalizzato',
  'stipendio_dipendente', 'utenze', 'affitto', 'marketing', 'straordinaria', 'altro',
];
const toCents = (eurVal: unknown): number | null => {
  const n = Number(String(eurVal).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

async function recordExpense(sb: SB, args: any) {
  const cents = toCents(args.amount_eur);
  if (cents === null || cents <= 0) return { error: 'importo non valido' };
  const cat = EXPENSE_CATEGORIES.includes(args.category) ? args.category : 'altro';
  const { error } = await sb.from('expenses').insert({
    amount_cents: cents,
    category: cat,
    description: args.description ?? null,
    payment_method: args.payment_method ?? null,
    is_extraordinary: cat === 'straordinaria' || !!args.is_extraordinary,
    source: 'telegram',
  });
  if (error) return { error: error.message };
  return { ok: true, registrato: `${eur(cents)} · ${cat}` };
}

async function recordStockUse(sb: SB, args: any) {
  const q = (args.product_name ?? '').trim();
  if (!q) return { error: 'nome prodotto mancante' };
  const { data: prods } = await sb
    .from('products').select('id, name, brand, stock, cost_cents').ilike('name', `%${q}%`).limit(5);
  if (!prods || prods.length === 0) return { error: `nessun prodotto per "${q}"` };
  if (prods.length > 1) return { ambiguo: prods.map((p: any) => (p.brand ? `${p.brand} ${p.name}` : p.name)) };
  const p: any = prods[0];
  const qty = Number.isFinite(args.qty) && args.qty > 0 ? Math.floor(args.qty) : 1;
  const newStock = Math.max(0, (p.stock ?? 0) - qty);
  await sb.from('products').update({ stock: newStock }).eq('id', p.id);
  const { error } = await sb.from('stock_movements').insert({
    product_id: p.id, qty, delta: -qty, reason: 'internal_use',
    unit_cost_cents: p.cost_cents ?? null, source: 'telegram',
  });
  if (error) return { error: error.message };
  return { ok: true, prodotto: p.brand ? `${p.brand} ${p.name}` : p.name, nuovo_stock: newStock };
}

async function getDailyBrief(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const { startISO, endISO } = romeDayRange(date);
  const { data: appts } = await sb
    .from('appointments').select('status, price_paid_cents, payment_method')
    .gte('start_at', startISO).lt('start_at', endISO);
  const rows = (appts ?? []) as any[];
  const completed = rows.filter((a) => a.status === 'completed');
  const sum = (f: (a: any) => number) => completed.reduce((s, a) => s + f(a), 0);
  const cash = sum((a) => (a.payment_method === 'cash' ? a.price_paid_cents ?? 0 : 0));
  const pos = sum((a) => (a.payment_method === 'pos' ? a.price_paid_cents ?? 0 : 0));
  const total = sum((a) => a.price_paid_cents ?? 0);
  const { data: exp } = await sb.from('expenses').select('amount_cents').eq('occurred_on', date);
  const expenses = (exp ?? []).reduce((s: number, e: any) => s + (e.amount_cents ?? 0), 0);
  return {
    date,
    appuntamenti: rows.filter((a) => a.status !== 'cancelled').length,
    completati: completed.length,
    no_show: rows.filter((a) => a.status === 'no_show').length,
    incasso_totale: eur(total),
    pos: eur(pos),
    contanti: eur(cash),
    spese: eur(expenses),
    nota: 'POS/contanti sono calcolati dagli incassi registrati per appuntamento; se mancano, chiedi i totali al titolare.',
  };
}

async function completeDailyBrief(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const row: Record<string, unknown> = {
    brief_date: date,
    status: 'completed',
    completed_at: new Date().toISOString(),
    completed_via: 'telegram',
    attendance_ok: typeof args.attendance_ok === 'boolean' ? args.attendance_ok : null,
    hours_ok: typeof args.hours_ok === 'boolean' ? args.hours_ok : null,
    sale_stock_used: typeof args.sale_stock_used === 'boolean' ? args.sale_stock_used : null,
    sale_stock_notes: args.sale_stock_notes ?? null,
    extraordinary_cents: toCents(args.extraordinary_eur) ?? 0,
    extraordinary_notes: args.extraordinary_notes ?? null,
    revenue_cash_cents: toCents(args.revenue_cash_eur) ?? 0,
    revenue_pos_cents: toCents(args.revenue_pos_eur) ?? 0,
    no_shows: Number.isFinite(args.no_shows) ? args.no_shows : null,
    owner_notes: args.notes ?? null,
  };
  const { error } = await sb.from('daily_brief').upsert(row, { onConflict: 'brief_date' });
  if (error) return { error: error.message };
  return { ok: true, giornata_chiusa: date };
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
  {
    type: 'function',
    function: {
      name: 'record_expense',
      description: "Registra una SPESA dell'attività. Usa quando il titolare dice di aver speso qualcosa (es. 'oggi ho speso 120€ in attrezzatura', 'speso 45 in detergenti').",
      parameters: {
        type: 'object',
        properties: {
          amount_eur: { type: 'number', description: 'Importo in euro' },
          category: { type: 'string', enum: EXPENSE_CATEGORIES, description: 'Categoria spesa' },
          description: { type: 'string', description: 'Dettaglio opzionale' },
          payment_method: { type: 'string', enum: ['cash', 'pos', 'bonifico', 'altro'] },
          is_extraordinary: { type: 'boolean', description: 'true se spesa straordinaria' },
        },
        required: ['amount_eur', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_stock_use',
      description: "Registra l'USO INTERNO di un prodotto in salone (consumo = spesa, NON vendita): scala lo stock di 1 (o qty). Es: 'ho finito una cera in polvere usandola in salone'.",
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'Nome prodotto (anche parziale)' },
          qty: { type: 'integer', description: 'Quantità, default 1' },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_brief',
      description: "Riepilogo contabile del giorno: appuntamenti, completati, no-show, incasso totale, POS, contanti, spese. Usalo all'inizio del brief serale per mostrare i numeri.",
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD, default oggi' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_daily_brief',
      description: 'Chiude la giornata salvando le risposte del brief serale (presenze, ore, materiale di vendita usato, spese straordinarie, incassi POS/contanti). Chiama SOLO dopo aver raccolto le risposte dal titolare.',
      parameters: {
        type: 'object',
        properties: {
          attendance_ok: { type: 'boolean', description: 'Si sono presentati tutti?' },
          hours_ok: { type: 'boolean', description: 'Hanno lavorato tutte le ore di servizio?' },
          sale_stock_used: { type: 'boolean', description: 'È stato usato in salone materiale che era in vendita?' },
          sale_stock_notes: { type: 'string' },
          extraordinary_eur: { type: 'number', description: 'Spese straordinarie del giorno in euro' },
          extraordinary_notes: { type: 'string' },
          revenue_cash_eur: { type: 'number', description: 'Incasso in contanti (euro)' },
          revenue_pos_eur: { type: 'number', description: 'Incasso POS/carta (euro)' },
          no_shows: { type: 'integer' },
          notes: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD, default oggi' },
        },
      },
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
    case 'record_expense': return recordExpense(sb, args);
    case 'record_stock_use': return recordStockUse(sb, args);
    case 'get_daily_brief': return getDailyBrief(sb, args);
    case 'complete_daily_brief': return completeDailyBrief(sb, args);
    default: return { error: `tool sconosciuto: ${name}` };
  }
}

const SYSTEM_PROMPT = `Sei il segretario e CONTABILE digitale di "Hair Rich Olbia", una barberia. Parli SOLO col titolare, in italiano, conciso e diretto, con Markdown Telegram leggero (grassetto *così*, elenchi con trattini).
La data di oggi è __TODAY__ (fuso ${TZ}). Gli importi sono in euro.

DATI: usa SEMPRE i tool per leggere/scrivere dati reali; non inventare numeri, nomi, prezzi o giacenze. Se un dato manca o un nome è ambiguo, dillo e chiedi di precisare.

SCRITTURE (registri contabili): puoi REGISTRARE:
- spese con record_expense (es. "speso 120€ in attrezzatura" → categoria 'attrezzatura");
- uso interno prodotti con record_stock_use (es. "ho finito una cera usandola in salone" → scala 1 dallo stock come consumo/spesa, NON vendita).
Prima di ogni scrittura di denaro o stock, RIEPILOGA cosa stai per registrare e procedi; dopo, conferma con il risultato del tool.

BRIEF SERALE (chiusura giornata): se il titolare dice "chiudi la giornata", "facciamo il resoconto" o risponde al riepilogo serale, conduci tu il brief:
1) chiama get_daily_brief e mostra i numeri (appuntamenti, completati, no-show, incasso, POS, contanti, spese);
2) chiedi in modo naturale, una cosa alla volta: si sono presentati tutti? hanno lavorato tutte le ore? è stato usato in salone materiale che era in vendita? ci sono state spese straordinarie? Se POS/contanti non risultano dai dati, chiedi i totali;
3) quando hai le risposte, chiama complete_daily_brief con i valori raccolti e conferma che la giornata è chiusa.

Mantieni le risposte brevi: dritto al punto, niente preamboli.`;

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

// ── Memoria conversazionale (telegram_sessions) ─────────────────────────────
async function loadHistory(sb: SB, chatId: number | string): Promise<OpenAIMsg[]> {
  const { data } = await sb.from('telegram_sessions').select('state').eq('chat_id', String(chatId)).maybeSingle();
  const h = (data?.state as any)?.history;
  return Array.isArray(h) ? (h as OpenAIMsg[]).slice(-12) : [];
}
async function saveHistory(sb: SB, chatId: number | string, history: OpenAIMsg[]) {
  const trimmed = history.filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content).slice(-12);
  await sb
    .from('telegram_sessions')
    .upsert({ chat_id: String(chatId), state: { history: trimmed }, updated_at: new Date().toISOString() }, { onConflict: 'chat_id' })
    .then(() => {}, () => {});
}
async function clearHistory(sb: SB, chatId: number | string) {
  await sb
    .from('telegram_sessions')
    .upsert({ chat_id: String(chatId), state: {}, updated_at: new Date().toISOString() }, { onConflict: 'chat_id' })
    .then(() => {}, () => {});
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

  if (text === '/reset' || text === '/nuovo') {
    await clearHistory(sb, chatId);
    await reply(chatId, '🧹 Conversazione azzerata. Ripartiamo da capo.');
    return new Response('ok', { status: 200 });
  }

  if (text === '/start' || text === '/aiuto' || text === '/help') {
    await clearHistory(sb, chatId);
    await reply(
      chatId,
      '👋 *Sono il tuo segretario e contabile Hair Rich.*\nChiedimi o dimmi pure, ad esempio:\n\n' +
        '• _Che appuntamenti ho oggi?_\n' +
        '• _Quanto ha speso Marco Rossi da noi?_\n' +
        '• _Quanti Slick Gorilla sono rimasti?_\n' +
        '• _Quanto ho incassato questo mese?_\n' +
        '• _Speso 120€ in attrezzatura_ (registro la spesa)\n' +
        '• _Ho finito una cera usandola in salone_ (scalo lo stock)\n' +
        '• _Chiudi la giornata_ (facciamo il brief serale)\n\n' +
        '_/reset_ per ricominciare la conversazione.',
    );
    return new Response('ok', { status: 200 });
  }

  await tg('sendChatAction', { chat_id: chatId, action: 'typing' });

  try {
    const history = await loadHistory(sb, chatId);
    const messages: OpenAIMsg[] = [
      { role: 'system', content: SYSTEM_PROMPT.replace('__TODAY__', romeTodayStr()) },
      ...history,
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
    if (answer) {
      await saveHistory(sb, chatId, [
        ...history,
        { role: 'user', content: text },
        { role: 'assistant', content: answer },
      ]);
    }
  } catch (err) {
    await reply(chatId, '⚠️ Errore temporaneo. Riprova tra poco.');
    console.error('telegram-assistant error', (err as Error).message);
  }

  return new Response('ok', { status: 200 });
});
