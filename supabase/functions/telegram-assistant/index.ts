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

const MODEL = 'gpt-4o';            // scrive prenotazioni + contabilita' reali → modello piu' affidabile
const TRANSCRIBE_MODEL = 'whisper-1';
const TZ = 'Europe/Rome';
const MAX_TOOL_ROUNDS = 6;          // il questionario serale incatena piu' tool
const CAPACITY = 2;                 // due poltrone (Federico + Cristian)
const OPEN_BLOCKS: Array<[number, number]> = [[9 * 60, 13 * 60], [15 * 60, 20 * 60]]; // Lun–Sab

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

// Vocale Telegram → testo (OpenAI Whisper). Stringa vuota se fallisce.
async function transcribeVoice(fileId: string): Promise<string> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!token || !apiKey) return '';
  const fr = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const filePath = (await fr.json())?.result?.file_path;
  if (!filePath) return '';
  const audioRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  const audioBuf = new Uint8Array(await audioRes.arrayBuffer());
  const form = new FormData();
  form.append('file', new Blob([audioBuf], { type: 'audio/ogg' }), 'voice.ogg');
  form.append('model', TRANSCRIBE_MODEL);
  form.append('language', 'it');
  const tr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form,
  });
  if (!tr.ok) return '';
  return ((await tr.json())?.text ?? '').toString();
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
// Offset (min) di Rome rispetto a UTC a un dato istante.
function tzOffsetMin(at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(at)) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return (asUTC - at.getTime()) / 60000;
}
// "YYYY-MM-DD" + "HH:MM" (ora di Rome) → ISO UTC.
function romeToUTC(dateStr: string, hhmm: string): string {
  const naive = new Date(`${dateStr}T${hhmm}:00Z`);
  const off = tzOffsetMin(naive);
  return new Date(naive.getTime() - off * 60000).toISOString();
}
function romeMinutesOfDay(iso: string): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const [h, m] = p.split(':').map(Number);
  return h * 60 + m;
}
function isClosedRome(dateStr: string): boolean {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay() === 0; // domenica
}
// Slot liberi da 30' nelle fasce di apertura. capacity=1 se filtrato per operatore.
function computeFreeSlots(dateStr: string, busy: Array<[number, number]>, capacity: number): string[] {
  if (isClosedRome(dateStr)) return [];
  const out: string[] = [];
  for (const [from, to] of OPEN_BLOCKS) {
    for (let t = from; t + 30 <= to; t += 30) {
      const occ = busy.filter(([s, e]) => s < t + 30 && e > t).length;
      if (occ < capacity) out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
    }
  }
  return out;
}
// Registra un evento owner-facing nell'inbox admin (alimenta il cassetto in Dashboard).
async function logOwnerInbox(sb: SB, item: { event_type: string; title: string; body?: string; icon?: string; priority?: string; payload?: unknown }) {
  await sb.from('admin_inbox_items').insert({
    event_type: item.event_type, category: 'system', priority: item.priority ?? 'normal',
    title: item.title, body: item.body ?? null, icon: item.icon ?? '🤖',
    payload: item.payload ?? {}, source_skill: 'telegram_assistant',
  }).then(() => {}, () => {});
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

// ── Risolutori staff / servizio ─────────────────────────────────────────────
async function resolveStaff(sb: SB, name: string) {
  const q = (name ?? '').trim().toLowerCase();
  if (!q) return null;
  const { data } = await sb.from('staff').select('id, name, slug, role_type').eq('is_active', true);
  const rows = (data ?? []) as any[];
  return (
    rows.find((s) => (s.slug ?? '').toLowerCase() === q || (s.name ?? '').toLowerCase() === q) ??
    rows.find((s) => (s.name ?? '').toLowerCase().includes(q) || (s.slug ?? '').toLowerCase().includes(q)) ??
    null
  );
}
async function resolveServiceByKind(sb: SB, kind: string) {
  const k = (kind ?? 'taglio').toLowerCase();
  const slug =
    /combo|barba.*taglio|taglio.*barba|capelli.*barba/.test(k) ? 'taglio-barba' :
    /^barba|solo barba/.test(k) ? 'barba-sartoriale' :
    'taglio-classico';
  const { data } = await sb.from('services').select('id, slug, name, duration_min, price_cents').eq('slug', slug).maybeSingle();
  return (data as any) ?? null;
}

// ── Fasce libere ────────────────────────────────────────────────────────────
async function getAvailableSlots(sb: SB, args: { date?: string; staff_name?: string }) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  if (isClosedRome(date)) return { date, chiuso: true, nota: 'Domenica: salone chiuso.' };
  const { startISO, endISO } = romeDayRange(date);
  let staff: any = null;
  if (args.staff_name) {
    staff = await resolveStaff(sb, args.staff_name);
    if (!staff) return { error: `operatore non riconosciuto: "${args.staff_name}"` };
  }
  let query = sb.from('appointments').select('start_at, end_at, staff_id, status')
    .gte('start_at', startISO).lt('start_at', endISO).neq('status', 'cancelled');
  if (staff) query = query.eq('staff_id', staff.id);
  const { data } = await query;
  const busy = (data ?? []).map((a: any) => [romeMinutesOfDay(a.start_at), romeMinutesOfDay(a.end_at)] as [number, number]);
  const free = computeFreeSlots(date, busy, staff ? 1 : CAPACITY);
  return { date, operatore: staff?.name ?? 'salone (2 poltrone)', fasce_libere: free, totale_libere: free.length };
}

// ── Crea appuntamento (gate di conferma) ────────────────────────────────────
async function createAppointment(sb: SB, args: any) {
  const { customer_first_name, customer_last_name, service, staff_name, date, time } = args;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return { error: 'data mancante o non valida (YYYY-MM-DD)' };
  if (!/^\d{2}:\d{2}$/.test(time ?? '')) return { error: 'ora mancante o non valida (HH:MM)' };
  if (!customer_first_name) return { error: 'nome cliente mancante' };
  const staff = await resolveStaff(sb, staff_name ?? '');
  if (!staff) return { error: `operatore non riconosciuto: "${staff_name}". Operatori: Federico, Cristian.` };
  const svc = await resolveServiceByKind(sb, service ?? 'taglio');
  if (!svc) return { error: 'servizio non riconosciuto' };
  const startISO = romeToUTC(date, time);
  const endISO = new Date(new Date(startISO).getTime() + svc.duration_min * 60000).toISOString();

  // Conflitto stesso operatore?
  const { data: clash } = await sb.from('appointments').select('id, start_at')
    .eq('staff_id', staff.id).lt('start_at', endISO).gt('end_at', startISO)
    .not('status', 'in', '("cancelled","no_show")').limit(1);
  const summary = {
    cliente: [customer_first_name, customer_last_name].filter(Boolean).join(' '),
    servizio: svc.name, operatore: staff.name, giorno: dmy(startISO), ora: hhmm(startISO),
    durata_min: svc.duration_min, prezzo: eur(svc.price_cents),
  };
  if (clash && clash.length > 0) {
    return { conflict: true, messaggio: `${staff.name} ha gia' un appuntamento che si sovrappone alle ${hhmm(startISO)}.`, riepilogo: summary };
  }
  if (args.confirmed !== true) {
    return { needs_confirmation: true, riepilogo: summary, istruzione: 'Mostra il riepilogo e CHIEDI conferma esplicita prima di salvare.' };
  }

  // Cliente: riusa se c'e' un solo match esatto nome+cognome, altrimenti nuovo.
  let customerId: string | null = null;
  if (customer_last_name) {
    const { data: existing } = await sb.from('customers').select('id')
      .ilike('first_name', customer_first_name).ilike('last_name', customer_last_name).limit(2);
    if (existing && existing.length === 1) customerId = existing[0].id;
  }
  if (!customerId) {
    const { data: cust, error: cErr } = await sb.from('customers')
      .insert({ first_name: customer_first_name, last_name: customer_last_name ?? null, is_guest: true }).select('id').single();
    if (cErr) return { error: `creazione cliente fallita: ${cErr.message}` };
    customerId = cust.id;
  }
  const { data: appt, error: aErr } = await sb.from('appointments')
    .insert({ customer_id: customerId, staff_id: staff.id, start_at: startISO, end_at: endISO, status: 'confirmed', source: 'phone', total_cents: svc.price_cents, notes: 'Inserito dal titolare via Telegram' })
    .select('id').single();
  if (aErr) return { error: `creazione appuntamento fallita: ${aErr.message}` };
  await sb.from('appointment_services').insert({ appointment_id: appt.id, service_id: svc.id, price_cents: svc.price_cents, duration_min: svc.duration_min });
  await logOwnerInbox(sb, { event_type: 'owner_new_booking', icon: '🟢', title: `Prenotazione · ${summary.cliente}`, body: `${summary.giorno} ${summary.ora} · ${summary.servizio} · ${summary.operatore}`, payload: summary });
  return { ok: true, creato: summary };
}

// ── Chiusura presenze giornata (presenti = completed, assenti = no_show) ──────
async function closeDayAttendance(sb: SB, args: { date?: string; no_show_names?: string[] }) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const { startISO, endISO } = romeDayRange(date);
  const { data: appts } = await sb.from('appointments')
    .select('id, status, customer:customer_id ( first_name, last_name )')
    .gte('start_at', startISO).lt('start_at', endISO).in('status', ['booked', 'confirmed']);
  const rows = (appts ?? []) as any[];
  const names = (args.no_show_names ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean);
  const matchedIds: string[] = [];
  const usedNames = new Set<string>();
  for (const r of rows) {
    const full = `${r.customer?.first_name ?? ''} ${r.customer?.last_name ?? ''}`.toLowerCase();
    const hit = names.find((n) => full.includes(n) || n.includes((r.customer?.first_name ?? '').toLowerCase()));
    if (hit) { matchedIds.push(r.id); usedNames.add(hit); }
  }
  const completedIds = rows.filter((r) => !matchedIds.includes(r.id)).map((r) => r.id);
  if (matchedIds.length) await sb.from('appointments').update({ status: 'no_show' }).in('id', matchedIds);
  if (completedIds.length) await sb.from('appointments').update({ status: 'completed' }).in('id', completedIds);
  const notFound = names.filter((n) => !usedNames.has(n));
  await logOwnerInbox(sb, { event_type: 'owner_day_attendance', icon: '✅', title: `Presenze ${date}: ${completedIds.length} ok, ${matchedIds.length} no-show`, payload: { date, completed: completedIds.length, no_show: matchedIds.length } });
  return { date, completati: completedIds.length, no_show: matchedIds.length, nomi_non_trovati: notFound };
}

// ── Vendita prodotto (incasso separato + scarico stock) ──────────────────────
async function recordProductSale(sb: SB, args: any) {
  const q = (args.product_name ?? '').trim();
  if (!q) return { error: 'nome prodotto mancante' };
  const { data: prods } = await sb.from('products').select('id, name, brand, stock, price_cents').ilike('name', `%${q}%`).limit(5);
  if (!prods || prods.length === 0) return { error: `nessun prodotto per "${q}"` };
  if (prods.length > 1) return { ambiguo: prods.map((p: any) => (p.brand ? `${p.brand} ${p.name}` : p.name)) };
  const p: any = prods[0];
  const qty = Number.isFinite(args.qty) && args.qty > 0 ? Math.floor(args.qty) : 1;
  const { data: res, error } = await sb.rpc('fn_create_order', {
    p_first_name: args.customer_first_name ?? 'Cliente', p_last_name: args.customer_last_name ?? null,
    p_phone: null, p_email: null,
    p_items: [{ product_id: p.id, quantity: qty }], p_notes: `Vendita in salone (telegram)${args.payment_method ? ' · ' + args.payment_method : ''}`,
  });
  if (error) return { error: `vendita non registrata: ${error.message}` };
  const orderId = (res as any)?.order_id;
  if (orderId) await sb.from('orders').update({ status: 'picked_up' }).eq('id', orderId).then(() => {}, () => {});
  const incasso = (res as any)?.total_cents ?? p.price_cents * qty;
  await logOwnerInbox(sb, { event_type: 'owner_product_sale', icon: '🛍️', title: `Vendita prodotto · ${p.brand ? p.brand + ' ' : ''}${p.name}`, body: `${qty}× · ${eur(incasso)}${args.customer_first_name ? ' · ' + args.customer_first_name : ''}`, payload: { product: p.name, qty, total_cents: incasso } });
  return { ok: true, prodotto: p.brand ? `${p.brand} ${p.name}` : p.name, qty, incasso: eur(incasso), cliente: args.customer_first_name ?? null };
}

// ── Sconto / prezzo reale su un appuntamento ─────────────────────────────────
async function setAppointmentDiscount(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const who = (args.customer_name ?? '').trim().toLowerCase();
  if (!who) return { error: 'nome cliente mancante' };
  const { startISO, endISO } = romeDayRange(date);
  const { data: appts } = await sb.from('appointments')
    .select('id, start_at, total_cents, customer:customer_id ( first_name, last_name )')
    .gte('start_at', startISO).lt('start_at', endISO).neq('status', 'cancelled');
  const matches = (appts ?? []).filter((a: any) => {
    const full = `${a.customer?.first_name ?? ''} ${a.customer?.last_name ?? ''}`.toLowerCase();
    return full.includes(who);
  });
  if (matches.length === 0) return { error: `nessun appuntamento per "${args.customer_name}" il ${date}` };
  if (matches.length > 1) return { ambiguo: matches.map((m: any) => `${[m.customer?.first_name, m.customer?.last_name].filter(Boolean).join(' ')} ${hhmm(m.start_at)}`) };
  const a: any = matches[0];
  const pricePaid = toCents(args.price_paid_eur);
  const discount = toCents(args.discount_eur) ?? Math.max(0, (a.total_cents ?? 0) - (pricePaid ?? a.total_cents ?? 0));
  const { error } = await sb.from('appointments').update({
    price_paid_cents: pricePaid ?? a.total_cents, discount_cents: discount,
    discount_reason: args.reason ?? 'manuale',
    payment_method: ['cash', 'pos', 'package_credit', 'mixed', 'free'].includes(args.payment_method) ? args.payment_method : null,
    paid_at: new Date().toISOString(),
  }).eq('id', a.id);
  if (error) return { error: error.message };
  return { ok: true, cliente: [a.customer?.first_name, a.customer?.last_name].filter(Boolean).join(' '), prezzo_pagato: eur(pricePaid ?? a.total_cents), sconto: eur(discount) };
}

// ── Trova appuntamento per nome cliente in un giorno ────────────────────────
async function findApptByName(sb: SB, date: string, who: string) {
  const { startISO, endISO } = romeDayRange(date);
  const { data } = await sb.from('appointments')
    .select('id, start_at, end_at, staff_id, total_cents, status, customer:customer_id ( first_name, last_name ), staff:staff_id ( name )')
    .gte('start_at', startISO).lt('start_at', endISO).not('status', 'in', '("cancelled","no_show")');
  const q = who.trim().toLowerCase();
  return ((data ?? []) as any[]).filter((a) =>
    `${a.customer?.first_name ?? ''} ${a.customer?.last_name ?? ''}`.toLowerCase().includes(q));
}
const apptLabel = (m: any) =>
  `${[m.customer?.first_name, m.customer?.last_name].filter(Boolean).join(' ')} ${hhmm(m.start_at)} (${m.staff?.name ?? '—'})`;

// ── Sposta un appuntamento (gate di conferma) ───────────────────────────────
async function rescheduleAppointment(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const who = (args.customer_name ?? '').trim();
  if (!who) return { error: 'nome cliente mancante' };
  if (!/^\d{2}:\d{2}$/.test(args.new_time ?? '')) return { error: 'nuova ora mancante (HH:MM)' };
  const newDate = args.new_date && /^\d{4}-\d{2}-\d{2}$/.test(args.new_date) ? args.new_date : date;
  const matches = await findApptByName(sb, date, who);
  if (matches.length === 0) return { error: `nessun appuntamento per "${who}" il ${date}` };
  if (matches.length > 1) return { ambiguo: matches.map(apptLabel) };
  const a: any = matches[0];
  let staff: any = a.staff_id ? { id: a.staff_id, name: a.staff?.name } : null;
  if (args.new_staff_name) { staff = await resolveStaff(sb, args.new_staff_name); if (!staff) return { error: `operatore non riconosciuto: "${args.new_staff_name}"` }; }
  if (!staff?.id) return { error: 'appuntamento senza operatore: specifica con quale barbiere spostarlo' };
  const dur = new Date(a.end_at).getTime() - new Date(a.start_at).getTime();
  const startISO = romeToUTC(newDate, args.new_time);
  const endISO = new Date(new Date(startISO).getTime() + dur).toISOString();

  const { data: off } = await sb.from('time_off').select('id, reason')
    .or(`staff_id.is.null,staff_id.eq.${staff.id}`).lt('starts_at', endISO).gt('ends_at', startISO).limit(1);
  if (off && off.length) return { error: `in quell'orario c'è un'indisponibilità${off[0].reason ? ' (' + off[0].reason + ')' : ''}.` };
  const { data: clash } = await sb.from('appointments').select('id')
    .eq('staff_id', staff.id).neq('id', a.id).lt('start_at', endISO).gt('end_at', startISO)
    .not('status', 'in', '("cancelled","no_show")').limit(1);
  const riepilogo = { cliente: who, da: `${dmy(a.start_at)} ${hhmm(a.start_at)} (${a.staff?.name ?? '—'})`, a: `${dmy(startISO)} ${hhmm(startISO)} (${staff.name})` };
  if (clash && clash.length) return { conflict: true, messaggio: `${staff.name} è già occupato alle ${hhmm(startISO)}.`, riepilogo };
  if (args.confirmed !== true) return { needs_confirmation: true, riepilogo, istruzione: 'Mostra il riepilogo e chiedi conferma esplicita prima di spostare.' };
  const { error } = await sb.from('appointments').update({ start_at: startISO, end_at: endISO, staff_id: staff.id }).eq('id', a.id);
  if (error) return { error: error.message };
  await logOwnerInbox(sb, { event_type: 'owner_appt_moved', icon: '↪️', title: `Spostato · ${who}`, body: `${riepilogo.da} → ${riepilogo.a}`, payload: riepilogo });
  return { ok: true, spostato: riepilogo };
}

// ── Annulla / elimina un appuntamento (gate di conferma) ─────────────────────
async function cancelAppointment(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const who = (args.customer_name ?? '').trim();
  if (!who) return { error: 'nome cliente mancante' };
  const matches = await findApptByName(sb, date, who);
  if (matches.length === 0) return { error: `nessun appuntamento per "${who}" il ${date}` };
  if (matches.length > 1) return { ambiguo: matches.map(apptLabel) };
  const a: any = matches[0];
  const hard = args.mode === 'delete';
  const riepilogo = { cliente: who, quando: `${dmy(a.start_at)} ${hhmm(a.start_at)}`, operatore: a.staff?.name ?? '—', azione: hard ? 'ELIMINA definitivamente' : 'annulla' };
  if (args.confirmed !== true) return { needs_confirmation: true, riepilogo, istruzione: 'Chiedi conferma esplicita prima di procedere.' };
  const { error } = hard
    ? await sb.from('appointments').delete().eq('id', a.id)
    : await sb.from('appointments').update({ status: 'cancelled' }).eq('id', a.id);
  if (error) return { error: error.message };
  await logOwnerInbox(sb, { event_type: 'owner_appt_cancelled', icon: '🗑️', title: `${hard ? 'Eliminato' : 'Annullato'} · ${who}`, body: `${riepilogo.quando} · ${riepilogo.operatore}`, payload: riepilogo });
  return { ok: true, esito: hard ? 'eliminato' : 'annullato', riepilogo };
}

// ── Blocca orari per ESIGENZA (impegno/ferie) = time_off, NON prenotazione ────
async function blockTime(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const endDate = args.end_date && /^\d{4}-\d{2}-\d{2}$/.test(args.end_date) ? args.end_date : date;
  let staff: any = null;
  if (args.staff_name) { staff = await resolveStaff(sb, args.staff_name); if (!staff) return { error: `operatore non riconosciuto: "${args.staff_name}"` }; }
  let startISO: string, endISO: string, fascia: string;
  if (/^\d{2}:\d{2}$/.test(args.start_time ?? '') && /^\d{2}:\d{2}$/.test(args.end_time ?? '')) {
    startISO = romeToUTC(date, args.start_time);
    endISO = romeToUTC(endDate, args.end_time);
    fascia = `${date} ${args.start_time}–${args.end_time}`;
  } else {
    startISO = romeDayRange(date).startISO;
    endISO = romeDayRange(endDate).endISO;
    fascia = endDate === date ? `${date} (tutto il giorno)` : `${date} → ${endDate} (giorni interi)`;
  }
  if (new Date(endISO) <= new Date(startISO)) return { error: 'intervallo non valido (fine ≤ inizio)' };
  const riepilogo = { chi: staff?.name ?? 'tutto il salone', quando: fascia, motivo: args.reason ?? '—' };
  if (args.confirmed !== true) return { needs_confirmation: true, riepilogo, istruzione: "Conferma prima di bloccare: è un'INDISPONIBILITÀ (impegno/ferie), non una prenotazione." };
  const { error } = await sb.from('time_off').insert({ staff_id: staff?.id ?? null, starts_at: startISO, ends_at: endISO, reason: args.reason ?? null, source: 'admin' });
  if (error) return { error: error.message };
  await logOwnerInbox(sb, { event_type: 'owner_time_blocked', icon: '⛔', title: `Orari bloccati · ${riepilogo.chi}`, body: `${riepilogo.quando}${args.reason ? ' · ' + args.reason : ''}`, payload: riepilogo });
  return { ok: true, bloccato: riepilogo };
}

// ── Elenca le indisponibilità (time_off) ─────────────────────────────────────
async function listTimeOff(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const days = Number.isFinite(args.days_ahead) && args.days_ahead > 0 ? Math.floor(args.days_ahead) : 14;
  const startISO = romeDayRange(date).startISO;
  const endISO = new Date(new Date(startISO).getTime() + days * 86400000).toISOString();
  const { data } = await sb.from('time_off')
    .select('id, staff_id, starts_at, ends_at, reason, staff:staff_id ( name )')
    .lt('starts_at', endISO).gt('ends_at', startISO).order('starts_at');
  const blocchi = ((data ?? []) as any[]).map((t) => ({
    chi: t.staff?.name ?? 'tutto il salone',
    dal: `${dmy(t.starts_at)} ${hhmm(t.starts_at)}`, al: `${dmy(t.ends_at)} ${hhmm(t.ends_at)}`,
    motivo: t.reason ?? null,
  }));
  return { da: date, giorni: days, blocchi, totale: blocchi.length };
}

// ── Rimuove un'indisponibilità (sblocca orari) ───────────────────────────────
async function removeTimeOff(sb: SB, args: any) {
  const date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : romeTodayStr();
  const { startISO, endISO } = romeDayRange(date);
  let staff: any = null;
  if (args.staff_name) { staff = await resolveStaff(sb, args.staff_name); if (!staff) return { error: `operatore non riconosciuto: "${args.staff_name}"` }; }
  const { data } = await sb.from('time_off')
    .select('id, staff_id, starts_at, ends_at, reason, staff:staff_id ( name )')
    .lt('starts_at', endISO).gt('ends_at', startISO);
  let rows = (data ?? []) as any[];
  if (staff) rows = rows.filter((r) => r.staff_id === staff.id);
  if (args.reason) rows = rows.filter((r) => (r.reason ?? '').toLowerCase().includes(String(args.reason).toLowerCase()));
  if (rows.length === 0) return { error: `nessuna indisponibilità trovata il ${date}` };
  if (rows.length > 1 && args.confirmed !== true) {
    return { ambiguo: rows.map((r) => `${r.staff?.name ?? 'salone'} ${hhmm(r.starts_at)}–${hhmm(r.ends_at)}${r.reason ? ' (' + r.reason + ')' : ''}`), istruzione: 'Specifica operatore/motivo, oppure conferma per rimuoverle tutte.' };
  }
  const { error } = await sb.from('time_off').delete().in('id', rows.map((r) => r.id));
  if (error) return { error: error.message };
  return { ok: true, rimossi: rows.length, giorno: date };
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
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Fasce libere da 30 minuti in un giorno (orari apertura Lun–Sab 09–13/15–20). Senza operatore: posti liberi sul salone (2 poltrone). Con operatore: fasce libere di quel barbiere. Usalo per prenotare o per suggerire una storia IG.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD, default oggi' }, staff_name: { type: 'string', description: 'Federico o Cristian (opzionale)' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: "Crea un appuntamento. PRIMA chiamala con confirmed=false per ottenere il riepilogo, MOSTRALO al titolare e attendi la sua conferma esplicita; SOLO dopo richiamala con confirmed=true per salvare. Non inventare: se mancano dati o un nome non è chiaro, chiedi.",
      parameters: {
        type: 'object',
        properties: {
          customer_first_name: { type: 'string', description: 'Nome cliente' },
          customer_last_name: { type: 'string', description: 'Cognome (se noto)' },
          service: { type: 'string', description: "taglio | barba | combo (taglio+barba)" },
          staff_name: { type: 'string', description: 'Federico o Cristian' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:MM (ora di Rome)' },
          confirmed: { type: 'boolean', description: 'true SOLO dopo conferma esplicita del titolare' },
        },
        required: ['customer_first_name', 'service', 'staff_name', 'date', 'time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_day_attendance',
      description: "Chiude le presenze del giorno: i clienti nominati come assenti diventano 'no_show', tutti gli altri appuntamenti del giorno diventano 'completed'. Usalo nel brief serale dopo aver chiesto chi non si è presentato.",
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD, default oggi' }, no_show_names: { type: 'array', items: { type: 'string' }, description: 'Nomi/cognomi di chi NON si è presentato (vuoto = tutti presenti)' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_product_sale',
      description: "Registra la VENDITA di un prodotto al cliente (incasso separato dai tagli + scarico stock). Diverso da record_stock_use (uso interno). Chiedi il nome del cliente se non lo sai.",
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'Nome prodotto (anche parziale)' },
          qty: { type: 'integer', description: 'Quantità, default 1' },
          customer_first_name: { type: 'string' },
          customer_last_name: { type: 'string' },
          payment_method: { type: 'string', enum: ['cash', 'pos'] },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_appointment_discount',
      description: "Registra uno sconto / prezzo reale / cambio tariffa su un appuntamento di un cliente (per la contabilità). Trova l'appuntamento per nome cliente nel giorno indicato.",
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Nome o cognome del cliente' },
          date: { type: 'string', description: 'YYYY-MM-DD, default oggi' },
          price_paid_eur: { type: 'number', description: 'Prezzo effettivamente pagato (euro)' },
          discount_eur: { type: 'number', description: "Sconto applicato (euro); se assente lo calcolo da listino-pagato" },
          payment_method: { type: 'string', enum: ['cash', 'pos', 'package_credit', 'mixed', 'free'] },
          reason: { type: 'string', description: 'Motivo sconto' },
        },
        required: ['customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: "SPOSTA un appuntamento esistente a un nuovo orario (e/o nuovo operatore). Trova l'appuntamento per nome cliente nel giorno indicato. PRIMA con confirmed=false per il riepilogo, mostralo e chiedi conferma, POI confirmed=true per salvare.",
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Nome o cognome del cliente da spostare' },
          date: { type: 'string', description: "Giorno ATTUALE dell'appuntamento (YYYY-MM-DD), default oggi" },
          new_date: { type: 'string', description: 'Nuovo giorno (YYYY-MM-DD); se assente resta lo stesso' },
          new_time: { type: 'string', description: 'Nuova ora HH:MM (ora di Rome)' },
          new_staff_name: { type: 'string', description: 'Nuovo operatore (Federico/Cristian), opzionale' },
          confirmed: { type: 'boolean', description: 'true SOLO dopo conferma esplicita' },
        },
        required: ['customer_name', 'new_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: "Annulla (status cancelled) o ELIMINA definitivamente un appuntamento. Trova per nome cliente nel giorno. PRIMA confirmed=false per il riepilogo, poi confirmed=true. Usa mode='delete' solo se il titolare vuole cancellarlo del tutto (es. inserito per sbaglio).",
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Nome o cognome del cliente' },
          date: { type: 'string', description: 'YYYY-MM-DD, default oggi' },
          mode: { type: 'string', enum: ['cancel', 'delete'], description: "cancel = annulla (default), delete = elimina definitivamente" },
          confirmed: { type: 'boolean', description: 'true SOLO dopo conferma esplicita' },
        },
        required: ['customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'block_time',
      description: "Blocca degli orari come INDISPONIBILITÀ per un'esigenza (impegno, dentista, commissioni) o FERIE — NON è una prenotazione. Quegli slot risultano occupati e non prenotabili. Per un singolo operatore (es. 'domani 16-17 Federico ha il dentista') o per tutto il salone (staff_name vuoto). Con start_time+end_time = fascia oraria; senza = giorno/i interi (ferie). PRIMA confirmed=false per il riepilogo, poi confirmed=true.",
      parameters: {
        type: 'object',
        properties: {
          staff_name: { type: 'string', description: 'Federico o Cristian; vuoto = tutto il salone' },
          date: { type: 'string', description: 'Giorno (YYYY-MM-DD), default oggi' },
          end_date: { type: 'string', description: 'Per ferie su più giorni: ultimo giorno (YYYY-MM-DD)' },
          start_time: { type: 'string', description: 'Ora inizio HH:MM (se è una fascia)' },
          end_time: { type: 'string', description: 'Ora fine HH:MM (se è una fascia)' },
          reason: { type: 'string', description: 'Motivo (dentista, ferie, commissioni, ...)' },
          confirmed: { type: 'boolean', description: 'true SOLO dopo conferma esplicita' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_time_off',
      description: 'Elenca le indisponibilità/ferie (time_off) a partire da un giorno per i prossimi N giorni: chi, quando, motivo.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD, default oggi' }, days_ahead: { type: 'integer', description: 'Finestra giorni, default 14' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_time_off',
      description: "Rimuove un'indisponibilità (sblocca gli orari) in un giorno. Filtra per operatore e/o motivo. Se ce n'è più di una e non è chiaro, chiede quale.",
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, default oggi' },
          staff_name: { type: 'string', description: 'Operatore (opzionale)' },
          reason: { type: 'string', description: 'Filtro per motivo (opzionale)' },
          confirmed: { type: 'boolean', description: 'true per rimuovere tutte le corrispondenze' },
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
    case 'get_available_slots': return getAvailableSlots(sb, args);
    case 'create_appointment': return createAppointment(sb, args);
    case 'close_day_attendance': return closeDayAttendance(sb, args);
    case 'record_product_sale': return recordProductSale(sb, args);
    case 'set_appointment_discount': return setAppointmentDiscount(sb, args);
    case 'reschedule_appointment': return rescheduleAppointment(sb, args);
    case 'cancel_appointment': return cancelAppointment(sb, args);
    case 'block_time': return blockTime(sb, args);
    case 'list_time_off': return listTimeOff(sb, args);
    case 'remove_time_off': return removeTimeOff(sb, args);
    default: return { error: `tool sconosciuto: ${name}` };
  }
}

const SYSTEM_PROMPT = `Sei il segretario e CONTABILE digitale di "Hair Rich Olbia", una barberia. Parli SOLO col titolare, in italiano, naturale e diretto come un dipendente fidato (niente comandi rigidi: chat libera). Markdown Telegram leggero (grassetto *così*, trattini per elenchi).
Oggi è __TODAY__ (fuso ${TZ}). Operatori: *Federico* e *Cristian*. Servizi: taglio (30', €20), barba, combo taglio+barba (60', €30). Importi in euro.

REGOLA D'ORO: usa SEMPRE i tool per leggere/scrivere dati reali. NON inventare MAI numeri, nomi, prezzi, giacenze, orari. Se non hai capito bene un nome o una parola (specie da un messaggio vocale), CHIEDI di ripetere — non tirare a indovinare.

PRENOTARE UN APPUNTAMENTO (anche da vocale):
1) Estrai: cliente (nome ed eventuale cognome), servizio, operatore, giorno, ora.
2) Chiama create_appointment con confirmed=false: ricevi un riepilogo. MOSTRALO e chiedi: "Confermi: *cliente X · servizio · operatore · giorno · ora*?".
3) SOLO quando il titolare conferma esplicitamente (es. "conferma", "sì", "ok"), richiama create_appointment con gli stessi dati e confirmed=true. Mai salvare senza conferma.
Se l'operatore è già occupato (conflict) o un dato manca, dillo e proponi un'alternativa (usa get_available_slots).

SPOSTARE / ANNULLARE UN APPUNTAMENTO: per spostare usa reschedule_appointment (trova per nome nel giorno, proponi il nuovo orario, conferma, poi salva). Per annullare/eliminare usa cancel_appointment (mode='delete' SOLO se inserito per sbaglio). Sempre col gate di conferma (confirmed=false → riepilogo → confirmed=true).

BLOCCARE ORARI PER ESIGENZA / FERIE: quando il titolare dice che un operatore non c'è per un impegno (es. "domani dalle 16 alle 17 Federico ha il dentista", "Cristian è in ferie da lunedì a mercoledì"), usa block_time: NON è una prenotazione, è un'INDISPONIBILITÀ (time_off) — quegli slot diventano occupati/non prenotabili, col motivo. Fascia oraria → start_time/end_time; giorni interi (ferie) → date + end_date. Vuoto staff_name = tutto il salone chiuso. Usa list_time_off per vedere i blocchi e remove_time_off per sbloccare. Sempre col gate di conferma.

REGISTRARE (contabilità): record_expense (spese), record_stock_use (prodotto usato in salone = costo, non vendita), record_product_sale (prodotto venduto = incasso + scarico stock), set_appointment_discount (sconto/prezzo reale). Prima di scrivere, riepiloga in una riga; dopo, conferma con l'esito.

BRIEF SERALE (quando il titolare dice "chiudo la giornata", "buonanotte", "resoconto", o risponde al promemoria delle 20:00). Conducilo TU, UNA domanda alla volta, aspettando la risposta prima della successiva, senza essere invadente:
1) Chiama get_daily_brief e mostra i numeri (appuntamenti, completati, no-show, incasso, POS, contanti, spese).
2) "Confermi che *tutti* gli appuntamenti di oggi sono venuti in salone?" — se NO: "Dimmi nomi e cognomi di chi non si è presentato, li metto nei no-show" → chiama close_day_attendance con no_show_names. Se SÌ: chiama close_day_attendance con no_show_names vuoto (segna tutti completati).
3) "Hai *venduto* o *usato in salone* qualche prodotto da scalare?" — se USATO: record_stock_use. Se VENDUTO: chiedi quale prodotto e il *nome del cliente* → record_product_sale.
4) "Hai fatto *sconti* o cambi di tariffa a qualcuno?" — se sì: chiedi nome cliente e importo → set_appointment_discount.
5) "Quanti pagamenti con *POS* e quanti in *contanti*?" — raccogli i due totali.
6) Chiama complete_daily_brief con tutto (attendance_ok, sale_stock_used, revenue_pos_eur, revenue_cash_eur, no_shows, note). Poi chiudi col *brief finale*: "Hai fatto *N* tagli, incassato *€X*; domani ti aspettano *M* appuntamenti" (M = get_today_appointments di domani).

Risposte brevi, niente preamboli.`;

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
  if (!chatId) return new Response('ok', { status: 200 });

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

  // Messaggio: testo, oppure VOCALE trascritto con Whisper.
  let text: string = (message?.text ?? '').trim();
  const voiceFileId: string | undefined = message?.voice?.file_id ?? message?.audio?.file_id;
  if (!text && voiceFileId) {
    await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
    try { text = (await transcribeVoice(voiceFileId)).trim(); } catch { text = ''; }
    if (!text) {
      await reply(chatId, "🎙️ Non sono riuscito a capire l'audio, puoi ripetere?");
      return new Response('ok', { status: 200 });
    }
    await reply(chatId, `🎙️ _"${text}"_`);
  }
  if (!text) return new Response('ok', { status: 200 });

  if (text === '/reset' || text === '/nuovo') {
    await clearHistory(sb, chatId);
    await reply(chatId, '🧹 Conversazione azzerata. Ripartiamo da capo.');
    return new Response('ok', { status: 200 });
  }

  if (text === '/start' || text === '/aiuto' || text === '/help') {
    await clearHistory(sb, chatId);
    await reply(
      chatId,
      '👋 *Sono il tuo segretario Hair Rich.* Scrivimi o mandami un *vocale*, ad esempio:\n\n' +
        '• _Prenota domani alle 10 un taglio per Luca Sanna con Federico_ (ti chiedo conferma)\n' +
        '• _Che fasce ho libere venerdì?_\n' +
        '• _Che appuntamenti ho oggi?_\n' +
        '• _Quanto ha speso Marco Rossi da noi?_\n' +
        '• _Quanti Slick Gorilla sono rimasti?_\n' +
        '• _Speso 120€ in attrezzatura_ (registro la spesa)\n' +
        '• _Ho venduto una cera a Luca_ (incasso + scarico stock)\n' +
        '• _Chiudo la giornata_ (facciamo il resoconto serale)\n\n' +
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
