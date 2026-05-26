"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import {
    SKILLS,
    CATEGORY_LABELS,
    STATUS_LABELS,
    type Skill,
    type SkillCategory,
    type SkillStatus,
} from "@/lib/skills/registry";
import {
    checkSkillReadiness,
    loadReadinessContext,
    type ReadinessResult,
} from "@/lib/skills/readiness";

interface SkillRow {
    skill_key: string;
    enabled: boolean;
    enabled_at: string | null;
    usage_count: number;
    last_used_at: string | null;
    min_tier: "vetrina" | "pro" | "full";
    can_use: boolean;
}

type Tier = "vetrina" | "pro" | "full";

const TIER_LABELS: Record<Tier, string> = {
    vetrina: "Vetrina",
    pro: "Pro",
    full: "Full",
};

const TIER_PRICES: Record<Tier, string> = {
    vetrina: "€19/mese",
    pro: "€29/mese",
    full: "€50/mese",
};

type StateFilter = "all" | "enabled" | "disabled" | "recommended" | "in_development";

const STATE_LABELS: Record<StateFilter, string> = {
    all: "Tutte",
    enabled: "Attive",
    disabled: "Disattive",
    recommended: "Consigliate",
    in_development: "In sviluppo",
};

export default function AdminSkillsHubPage() {
    const [rows, setRows] = useState<Map<string, SkillRow>>(new Map());
    const [salonTier, setSalonTier] = useState<Tier>("full");
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<SkillCategory | "all">("all");
    const [state, setState] = useState<StateFilter>("all");
    const [search, setSearch] = useState("");
    const [confirmDisable, setConfirmDisable] = useState<Skill | null>(null);
    const [warnIncomplete, setWarnIncomplete] = useState<{ skill: Skill; readiness: ReadinessResult } | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [readinessMap, setReadinessMap] = useState<Map<string, ReadinessResult>>(new Map());
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const [skillsResp, ctx, salonResp] = await Promise.all([
                supabase
                    .from("skills_with_access")
                    .select("skill_key, enabled, enabled_at, usage_count, last_used_at, min_tier, can_use, salon_tier"),
                loadReadinessContext(supabase),
                supabase.from("salon_settings").select("current_tier").limit(1).maybeSingle(),
            ]);
            if (skillsResp.error) throw skillsResp.error;
            const map = new Map<string, SkillRow>();
            for (const r of (skillsResp.data ?? []) as SkillRow[]) map.set(r.skill_key, r);
            setRows(map);
            const tier = ((salonResp.data as any)?.current_tier as Tier) ?? "full";
            setSalonTier(tier);

            const rmap = new Map<string, ReadinessResult>();
            for (const s of SKILLS) rmap.set(s.key, checkSkillReadiness(s, ctx));
            setReadinessMap(rmap);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        let enabled = 0;
        let total = 0;
        for (const s of SKILLS) {
            total++;
            if (rows.get(s.key)?.enabled) enabled++;
        }
        return { enabled, total };
    }, [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return SKILLS.filter((s) => {
            if (category !== "all" && s.category !== category) return false;
            const row = rows.get(s.key);
            const isOn = Boolean(row?.enabled);
            if (state === "enabled" && !isOn) return false;
            if (state === "disabled" && isOn) return false;
            if (state === "recommended" && s.status !== "recommended") return false;
            if (state === "in_development" && s.status !== "in_development") return false;
            if (q) {
                const haystack = `${s.nameIT} ${s.descriptionIT} ${s.key}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [category, state, search, rows]);

    const grouped = useMemo(() => {
        const map = new Map<SkillCategory, Skill[]>();
        for (const s of filtered) {
            if (!map.has(s.category)) map.set(s.category, []);
            map.get(s.category)!.push(s);
        }
        return map;
    }, [filtered]);

    const persistToggle = async (skill: Skill, nextEnabled: boolean) => {
        setTogglingKey(skill.key);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("skills_config")
                .update({ enabled: nextEnabled })
                .eq("skill_key", skill.key);
            if (error) throw error;
            const prev = rows.get(skill.key);
            const next: SkillRow = {
                skill_key: skill.key,
                enabled: nextEnabled,
                enabled_at: nextEnabled ? new Date().toISOString() : prev?.enabled_at ?? null,
                usage_count: prev?.usage_count ?? 0,
                last_used_at: prev?.last_used_at ?? null,
            };
            setRows((m) => new Map(m).set(skill.key, next));
            addToast(nextEnabled ? `${skill.nameIT} attivata` : `${skill.nameIT} disattivata`, "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setTogglingKey(null);
        }
    };

    const handleToggle = (skill: Skill) => {
        if (skill.alwaysOn) {
            addToast("Questa funzionalità è infrastruttura — non può essere disattivata", "info");
            return;
        }
        const row = rows.get(skill.key);
        const isOn = Boolean(row?.enabled);
        // Block enable if tier doesn't allow it
        if (!isOn && row && !row.can_use) {
            addToast(
                `Questa funzionalità richiede il pacchetto ${TIER_LABELS[row.min_tier]}. Aggiorna il tier.`,
                "info",
            );
            return;
        }
        if (isOn) {
            setConfirmDisable(skill);
            return;
        }
        const r = readinessMap.get(skill.key);
        if (r && r.status === "incomplete") {
            setWarnIncomplete({ skill, readiness: r });
            return;
        }
        void persistToggle(skill, true);
    };

    const confirmEnableAnyway = async () => {
        if (!warnIncomplete) return;
        await persistToggle(warnIncomplete.skill, true);
        setWarnIncomplete(null);
    };

    const confirmAndDisable = async () => {
        if (!confirmDisable) return;
        await persistToggle(confirmDisable, false);
        setConfirmDisable(null);
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Skills Hub</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Funzionalità.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Tutte le funzionalità digitali del gestionale in un solo posto.
                    Accendi solo quelle che vuoi usare — il sistema lavora silenzioso per il resto.
                </p>
                <div className="mt-4 flex items-center gap-4 flex-wrap text-sm">
                    <span className="text-silver-dark">
                        <span className="text-accent-warm font-semibold tabular-nums">{counts.enabled}</span>
                        {" attive su "}
                        <span className="text-warm-white tabular-nums">{counts.total}</span>
                    </span>
                    <span className="text-silver-dark">·</span>
                    <span className="text-silver-dark">
                        Pacchetto:{" "}
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent-warm/15 border border-accent-warm/30 text-accent-warm rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold">
                            {TIER_LABELS[salonTier]} · {TIER_PRICES[salonTier]}
                        </span>
                    </span>
                </div>
            </motion.div>

            {/* Filters */}
            <div className="sticky top-0 lg:top-0 z-20 bg-black/90 backdrop-blur-md -mx-6 md:-mx-10 px-6 md:px-10 py-3 border-b border-line space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cerca per nome o descrizione…"
                        className="flex-1 min-w-[200px] bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white placeholder:text-silver-dark"
                    />
                    <select
                        value={state}
                        onChange={(e) => setState(e.target.value as StateFilter)}
                        className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white"
                    >
                        {(Object.keys(STATE_LABELS) as StateFilter[]).map((k) => (
                            <option key={k} value={k}>
                                {STATE_LABELS[k]}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setCategory("all")}
                        className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                            category === "all"
                                ? "bg-accent-warm text-black border-accent-warm"
                                : "border-line text-silver hover:bg-carbon"
                        }`}
                    >
                        Tutte
                    </button>
                    {(Object.keys(CATEGORY_LABELS) as SkillCategory[]).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                                category === cat
                                    ? "bg-accent-warm text-black border-accent-warm"
                                    : "border-line text-silver hover:bg-carbon"
                            }`}
                        >
                            {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                        />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-silver-dark py-12">
                    Nessuna funzionalità corrisponde ai filtri attuali.
                </div>
            ) : (
                <div className="space-y-10">
                    {[...grouped.entries()].map(([cat, skills]) => (
                        <section key={cat} className="space-y-4">
                            <h2 className="text-display text-xl text-warm-white tracking-tight">
                                {CATEGORY_LABELS[cat]}
                                <span className="text-silver-dark text-sm font-body ml-2 tabular-nums">
                                    · {skills.length}
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {skills.map((s) => (
                                    <SkillCard
                                        key={s.key}
                                        skill={s}
                                        row={rows.get(s.key) ?? null}
                                        readiness={readinessMap.get(s.key)}
                                        toggling={togglingKey === s.key}
                                        onToggle={() => handleToggle(s)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {confirmDisable && (
                    <ConfirmDisableModal
                        skill={confirmDisable}
                        onCancel={() => setConfirmDisable(null)}
                        onConfirm={confirmAndDisable}
                    />
                )}
                {warnIncomplete && (
                    <WarnIncompleteModal
                        skill={warnIncomplete.skill}
                        readiness={warnIncomplete.readiness}
                        onCancel={() => setWarnIncomplete(null)}
                        onConfirm={confirmEnableAnyway}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function SkillCard({
    skill,
    row,
    readiness,
    toggling,
    onToggle,
}: {
    skill: Skill;
    row: SkillRow | null;
    readiness?: ReadinessResult;
    toggling: boolean;
    onToggle: () => void;
}) {
    const isOn = Boolean(row?.enabled);
    const status = skill.status;
    const incomplete = readiness?.status === "incomplete";
    const unverifiable = readiness?.status === "unverifiable";
    const tierLocked = row !== null && !row.can_use && !isOn;

    const statusBadge =
        status === "recommended" ? (
            <span className="text-[10px] uppercase tracking-[0.2em] font-body font-semibold text-accent-warm">
                consigliata
            </span>
        ) : status === "not_recommended" ? (
            <span className="text-[10px] uppercase tracking-[0.2em] font-body font-semibold text-silver-dark">
                non consigliata
            </span>
        ) : status === "in_development" ? (
            <span className="text-[10px] uppercase tracking-[0.2em] font-body font-semibold text-amber-300">
                in sviluppo
            </span>
        ) : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative bg-carbon border rounded-[var(--radius-md)] p-5 flex flex-col gap-3 transition-colors ${
                isOn ? "border-accent-warm/50" : "border-line hover:border-line-strong"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0" aria-hidden>
                        {skill.icon}
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-warm-white font-body font-semibold leading-tight">
                            {skill.nameIT}
                        </h3>
                        {statusBadge}
                    </div>
                </div>
                {tierLocked ? (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="shrink-0 px-3 py-1.5 border border-purple-400/40 text-purple-300 rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-purple-500/10"
                    >
                        🔒
                    </button>
                ) : (
                    <Toggle on={isOn} disabled={toggling || skill.alwaysOn} onClick={onToggle} />
                )}
            </div>

            <p className="text-sm text-warm-white-muted leading-snug">{skill.descriptionIT}</p>

            {skill.exampleIT && (
                <p className="text-xs text-silver-dark italic leading-snug bg-black-2/50 rounded-md px-3 py-2 border-l-2 border-accent-warm/40">
                    {skill.exampleIT}
                </p>
            )}

            {incomplete && (
                <div className="text-xs bg-amber-500/10 border-l-2 border-amber-400 text-amber-200 rounded-md px-3 py-2 leading-snug">
                    <div className="font-body font-semibold text-amber-300 text-[10px] uppercase tracking-[0.2em] mb-1">
                        ⚠️ Configurazione incompleta
                    </div>
                    Manca: {readiness!.missing.join(", ")}.
                    {readiness!.hint && (
                        <div className="mt-1 text-amber-200/70">{readiness!.hint}</div>
                    )}
                </div>
            )}

            {unverifiable && !isOn && !tierLocked && (
                <div className="text-xs bg-blue-500/10 border-l-2 border-blue-400 text-blue-200 rounded-md px-3 py-2 leading-snug">
                    <div className="font-body font-semibold text-blue-300 text-[10px] uppercase tracking-[0.2em] mb-1">
                        ℹ️ Setup esterno richiesto
                    </div>
                    {readiness!.hint}
                </div>
            )}

            {tierLocked && row && (
                <div className="text-xs bg-purple-500/10 border-l-2 border-purple-400 text-purple-200 rounded-md px-3 py-2 leading-snug">
                    <div className="font-body font-semibold text-purple-300 text-[10px] uppercase tracking-[0.2em] mb-1">
                        🔒 Richiede pacchetto {TIER_LABELS[row.min_tier]}
                    </div>
                    Aggiorna il tuo pacchetto a {TIER_LABELS[row.min_tier]} ({TIER_PRICES[row.min_tier]}) per
                    sbloccare questa funzionalità.
                </div>
            )}

            {skill.benefitIT && (
                <p className="text-xs text-accent-warm font-body font-semibold">
                    💰 {skill.benefitIT}
                </p>
            )}

            <div className="mt-auto pt-3 border-t border-line flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-body font-semibold text-silver-dark">
                <span>{skill.effortHours}h effort</span>
                {skill.monthlyCostEur > 0 ? (
                    <span>€ {skill.monthlyCostEur}/mese</span>
                ) : (
                    <span className="text-green-400/70">gratis</span>
                )}
                {row && row.usage_count > 0 && (
                    <span className="text-accent-warm/80 tabular-nums">
                        {row.usage_count} usi
                    </span>
                )}
            </div>

            {skill.alwaysOn && (
                <span className="absolute top-3 right-16 text-[9px] uppercase tracking-[0.25em] font-body font-semibold text-silver-dark">
                    sempre on
                </span>
            )}
        </motion.div>
    );
}

function Toggle({
    on,
    disabled,
    onClick,
}: {
    on: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={on}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                on ? "bg-accent-warm" : "bg-carbon-2 border border-line"
            } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-warm-white shadow transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                }`}
            />
        </button>
    );
}

function WarnIncompleteModal({
    skill,
    readiness,
    onCancel,
    onConfirm,
}: {
    skill: Skill;
    readiness: ReadinessResult;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-amber-400/40 rounded-[var(--radius-md)] p-6 max-w-md w-full space-y-4"
            >
                <div className="flex items-start gap-3">
                    <span className="text-3xl">⚠️</span>
                    <div>
                        <h3 className="text-display text-xl text-warm-white">
                            {skill.nameIT}: configurazione incompleta
                        </h3>
                        <p className="text-sm text-warm-white-muted mt-2">
                            Manca ancora: <strong className="text-amber-300">{readiness.missing.join(", ")}</strong>.
                            Se attivi adesso, la funzionalità sarà ON ma non potrà eseguire fino a quando non
                            completi la configurazione.
                        </p>
                        {readiness.hint && (
                            <p className="text-xs text-silver-dark mt-2 italic">{readiness.hint}</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em]"
                    >
                        Configura prima
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2.5 bg-amber-400 text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold"
                    >
                        Attiva comunque
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ConfirmDisableModal({
    skill,
    onCancel,
    onConfirm,
}: {
    skill: Skill;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 max-w-md w-full space-y-4"
            >
                <div className="flex items-start gap-3">
                    <span className="text-3xl">{skill.icon}</span>
                    <div>
                        <h3 className="text-display text-xl text-warm-white">Disattivare {skill.nameIT}?</h3>
                        <p className="text-sm text-warm-white-muted mt-1">
                            Tutti i processi automatici legati a questa funzionalità verranno fermati.
                            Potrai riattivarla in qualsiasi momento.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em]"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2.5 bg-warm-white text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold"
                    >
                        Disattiva
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
