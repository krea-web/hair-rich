"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { downloadCsv, todayStamp } from "@/lib/csv";

type FieldKey =
    | "segment"
    | "days_since_last_visit"
    | "days_since_signup"
    | "visits_total"
    | "lifetime_spend_cents"
    | "noshow_count"
    | "birthday_month"
    | "has_email"
    | "has_phone"
    | "marketing_consent"
    | "notes_match";

type OpKey = "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains";

interface Rule {
    id: string;
    field: FieldKey;
    operator: OpKey;
    value: string | number | boolean;
}

interface RuleSet {
    combinator: "and" | "or";
    rules: Array<{ field: FieldKey; operator: OpKey; value: string | number | boolean }>;
}

interface SavedSearch {
    id: string;
    name: string;
    description: string | null;
    filters: RuleSet;
    is_template: boolean;
    template_key: string | null;
    last_run_at: string | null;
    last_hit_count: number | null;
}

interface CustomerResult {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
}

const FIELDS: { key: FieldKey; label: string; type: "string" | "number" | "boolean" | "segment" }[] = [
    { key: "segment", label: "Segmento", type: "segment" },
    { key: "days_since_last_visit", label: "Giorni dall'ultima visita", type: "number" },
    { key: "days_since_signup", label: "Giorni da iscrizione", type: "number" },
    { key: "visits_total", label: "Numero visite totali", type: "number" },
    { key: "lifetime_spend_cents", label: "Spesa totale (cent)", type: "number" },
    { key: "noshow_count", label: "Numero no-show", type: "number" },
    { key: "birthday_month", label: "Mese compleanno", type: "string" },
    { key: "has_email", label: "Ha email", type: "boolean" },
    { key: "has_phone", label: "Ha telefono", type: "boolean" },
    { key: "marketing_consent", label: "Marketing consent", type: "boolean" },
    { key: "notes_match", label: "Note contengono", type: "string" },
];

const SEGMENTS: { value: string; label: string }[] = [
    { value: "vip", label: "💎 VIP" },
    { value: "abituale", label: "🔁 Abituale" },
    { value: "nuovo", label: "🆕 Nuovo" },
    { value: "a_rischio", label: "😴 A rischio" },
    { value: "perso", label: "🚪 Perso" },
    { value: "noshow_recidivo", label: "⚠️ No-show" },
    { value: "compleanno_mese", label: "🎂 Compleanno mese" },
];

const OPERATORS_BY_TYPE: Record<string, OpKey[]> = {
    string: ["=", "contains"],
    number: ["=", "!=", ">", ">=", "<", "<="],
    boolean: ["="],
    segment: ["="],
};

function newRule(): Rule {
    return { id: Math.random().toString(36).slice(2), field: "visits_total", operator: ">=", value: 1 };
}

export default function AdminClientiCercaPage() {
    const [rules, setRules] = useState<Rule[]>([newRule()]);
    const [combinator, setCombinator] = useState<"and" | "or">("and");
    const [results, setResults] = useState<CustomerResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchName, setSearchName] = useState("");
    const [templates, setTemplates] = useState<SavedSearch[]>([]);
    const [saved, setSaved] = useState<SavedSearch[]>([]);
    const addToast = useToastStore((s) => s.addToast);

    const loadSaved = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("saved_searches")
            .select("*")
            .order("is_template", { ascending: false })
            .order("created_at", { ascending: false });
        const rows = (data ?? []) as SavedSearch[];
        setTemplates(rows.filter((r) => r.is_template));
        setSaved(rows.filter((r) => !r.is_template));
    }, []);

    useEffect(() => {
        loadSaved();
    }, [loadSaved]);

    const applyRuleSet = (rs: RuleSet) => {
        setCombinator(rs.combinator);
        setRules(
            rs.rules.map((r) => ({ ...r, id: Math.random().toString(36).slice(2) })) as Rule[]
        );
    };

    const buildFilters = (): RuleSet => ({
        combinator,
        rules: rules.map(({ id: _id, ...r }) => r),
    });

    const runSearch = async () => {
        setSearching(true);
        try {
            const supabase = createClient();
            const { data: ids, error } = await supabase.rpc("fn_search_customers", {
                p_filters: buildFilters(),
            });
            if (error) throw error;
            const customerIds = (ids ?? []).map((r: { customer_id: string }) => r.customer_id);
            if (customerIds.length === 0) {
                setResults([]);
                return;
            }
            const { data: custData, error: custErr } = await supabase
                .from("customers")
                .select("id, first_name, last_name, email, phone")
                .in("id", customerIds);
            if (custErr) throw custErr;
            setResults((custData ?? []) as CustomerResult[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSearching(false);
        }
    };

    const saveSearch = async () => {
        if (!searchName.trim()) {
            addToast("Inserisci un nome", "error");
            return;
        }
        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("saved_searches").insert({
                name: searchName.trim(),
                filters: buildFilters(),
                is_template: false,
            });
            if (error) throw error;
            addToast("Ricerca salvata", "success");
            setSearchName("");
            await loadSaved();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const exportCsv = () => {
        if (results.length === 0) return;
        downloadCsv(
            `clienti-cerca-${todayStamp()}.csv`,
            ["Nome", "Cognome", "Email", "Telefono"],
            results.map((r) => [r.first_name, r.last_name ?? "", r.email ?? "", r.phone ?? ""])
        );
    };

    const updateRule = (id: string, patch: Partial<Rule>) =>
        setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const removeRule = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

    const stats = useMemo(() => ({ count: results.length }), [results]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Query builder</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Ricerca avanzata clienti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Componi filtri concatenabili. Esegui, esporta o salva la ricerca per uso futuro.
                </p>
            </motion.div>

            {templates.length > 0 && (
                <div>
                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Template
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {templates.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => applyRuleSet(t.filters)}
                                className="px-3 py-1.5 rounded-full border border-accent-warm/40 text-accent-warm text-[10px] uppercase tracking-[0.2em] font-body font-semibold hover:bg-accent-warm/15 transition-colors"
                                title={t.description ?? ""}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Combina con
                    </span>
                    <select
                        value={combinator}
                        onChange={(e) => setCombinator(e.target.value as "and" | "or")}
                        className="bg-black-2 border border-line rounded-md px-3 py-1.5 text-warm-white text-sm"
                    >
                        <option value="and">AND (tutti)</option>
                        <option value="or">OR (almeno uno)</option>
                    </select>
                </div>

                <ul className="space-y-3">
                    {rules.map((rule) => {
                        const field = FIELDS.find((f) => f.key === rule.field)!;
                        const ops = OPERATORS_BY_TYPE[field.type];
                        return (
                            <li
                                key={rule.id}
                                className="flex flex-wrap items-center gap-2 bg-black-2/40 border border-line rounded-md p-3"
                            >
                                <select
                                    value={rule.field}
                                    onChange={(e) => {
                                        const next = FIELDS.find((f) => f.key === (e.target.value as FieldKey))!;
                                        const defaultOp = OPERATORS_BY_TYPE[next.type][0];
                                        updateRule(rule.id, {
                                            field: next.key,
                                            operator: defaultOp,
                                            value:
                                                next.type === "boolean"
                                                    ? true
                                                    : next.type === "number"
                                                    ? 0
                                                    : "",
                                        });
                                    }}
                                    className="bg-black-2 border border-line rounded-md px-2 py-1.5 text-warm-white text-sm"
                                >
                                    {FIELDS.map((f) => (
                                        <option key={f.key} value={f.key}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={rule.operator}
                                    onChange={(e) => updateRule(rule.id, { operator: e.target.value as OpKey })}
                                    className="bg-black-2 border border-line rounded-md px-2 py-1.5 text-warm-white text-sm"
                                >
                                    {ops.map((op) => (
                                        <option key={op} value={op}>
                                            {op}
                                        </option>
                                    ))}
                                </select>
                                {field.type === "segment" && (
                                    <select
                                        value={String(rule.value)}
                                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                        className="flex-1 bg-black-2 border border-line rounded-md px-2 py-1.5 text-warm-white text-sm"
                                    >
                                        <option value="">— seleziona —</option>
                                        {SEGMENTS.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {field.type === "number" && (
                                    <input
                                        type="number"
                                        value={Number(rule.value)}
                                        onChange={(e) => updateRule(rule.id, { value: parseFloat(e.target.value) || 0 })}
                                        className="flex-1 min-w-[80px] bg-black-2 border border-line rounded-md px-2 py-1.5 text-warm-white text-sm font-mono"
                                    />
                                )}
                                {field.type === "boolean" && (
                                    <select
                                        value={String(rule.value)}
                                        onChange={(e) => updateRule(rule.id, { value: e.target.value === "true" })}
                                        className="bg-black-2 border border-line rounded-md px-2 py-1.5 text-warm-white text-sm"
                                    >
                                        <option value="true">Sì</option>
                                        <option value="false">No</option>
                                    </select>
                                )}
                                {field.type === "string" && (
                                    <input
                                        type="text"
                                        value={String(rule.value)}
                                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                        placeholder={
                                            rule.field === "birthday_month" ? "current oppure 1-12" : "testo"
                                        }
                                        className="flex-1 min-w-[120px] bg-black-2 border border-line rounded-md px-2 py-1.5 text-warm-white text-sm"
                                    />
                                )}
                                <button
                                    onClick={() => removeRule(rule.id)}
                                    className="ml-auto px-2 py-1 text-error border border-error/40 rounded text-[10px] uppercase tracking-[0.2em] font-body font-semibold hover:bg-error/10"
                                >
                                    Rimuovi
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setRules((rs) => [...rs, newRule()])}
                        className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold hover:border-warm-white transition-colors"
                    >
                        + Aggiungi filtro
                    </button>
                    <button
                        onClick={runSearch}
                        disabled={searching}
                        className="px-5 py-2 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 disabled:opacity-50"
                    >
                        {searching ? "Cerco…" : "Esegui ricerca"}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-carbon border border-line rounded-[var(--radius-md)] p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Risultati
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-warm-white tabular-nums text-sm">{stats.count} clienti</span>
                            {results.length > 0 && (
                                <button
                                    onClick={exportCsv}
                                    className="text-[10px] uppercase tracking-[0.25em] text-accent-warm underline underline-offset-4"
                                >
                                    Export CSV
                                </button>
                            )}
                        </div>
                    </div>
                    {results.length === 0 ? (
                        <p className="mt-4 text-warm-white-muted text-sm">
                            Nessun risultato ancora. Componi i filtri e tap Esegui.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-1 max-h-[400px] overflow-y-auto">
                            {results.map((r) => (
                                <li
                                    key={r.id}
                                    className="flex items-center justify-between py-2 border-b border-line/30 text-sm"
                                >
                                    <span className="text-warm-white">
                                        {r.first_name} {r.last_name ?? ""}
                                    </span>
                                    <span className="text-silver-dark text-xs">
                                        {r.phone ?? r.email ?? "—"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <aside className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 space-y-4">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Salva ricerca
                        </span>
                        <input
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="Nome ricerca"
                            className="mt-2 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm"
                        />
                        <button
                            onClick={saveSearch}
                            disabled={saving || !searchName.trim()}
                            className="mt-2 w-full px-4 py-2 bg-accent-warm/15 border border-accent-warm/40 text-accent-warm rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50"
                        >
                            {saving ? "Salvataggio…" : "Salva"}
                        </button>
                    </div>

                    {saved.length > 0 && (
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Mie ricerche
                            </span>
                            <ul className="mt-2 space-y-1">
                                {saved.map((s) => (
                                    <li key={s.id}>
                                        <button
                                            onClick={() => applyRuleSet(s.filters)}
                                            className="w-full text-left px-3 py-2 rounded-md text-warm-white text-sm hover:bg-black-2 transition-colors"
                                        >
                                            {s.name}
                                            {s.last_hit_count !== null && (
                                                <span className="ml-2 text-silver-dark text-xs">
                                                    · {s.last_hit_count} hit
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
