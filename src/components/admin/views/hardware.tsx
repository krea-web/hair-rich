"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
    HARDWARE_CATALOG,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
    STATUS_LABELS,
    type HardwareDevice,
    type HardwareCategory,
    type HardwareStatus,
    type ConnectionType,
} from "@/lib/hardware/catalog";

const CONNECTION_LABELS: Record<ConnectionType, string> = {
    bluetooth: "Bluetooth",
    wifi: "WiFi / Ethernet",
    usb: "USB",
    cloud: "Cloud (browser)",
    smartphone_only: "Solo smartphone",
    serial: "Seriale RS-232",
};

const STATUS_TONES: Record<HardwareStatus, string> = {
    available: "border-green-400/40 bg-green-500/10 text-green-300",
    in_development: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    on_request: "border-line bg-carbon-2 text-silver",
};

export default function AdminHardwarePage() {
    const [category, setCategory] = useState<HardwareCategory | "all">("all");

    const categories = useMemo(() => {
        const set = new Set<HardwareCategory>();
        for (const d of HARDWARE_CATALOG) set.add(d.category);
        return Array.from(set);
    }, []);

    const filtered = useMemo(() => {
        if (category === "all") return HARDWARE_CATALOG;
        return HARDWARE_CATALOG.filter((d) => d.category === category);
    }, [category]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Hardware</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Casse, POS, stampanti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Tutto l'hardware che il gestionale può controllare. Prezzi reali del fornitore,
                    senza ricarichi. Scegli la combinazione che ti serve — il resto lo lasci spento.
                </p>
            </motion.div>

            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setCategory("all")}
                    className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                        category === "all"
                            ? "bg-accent-warm text-black border-accent-warm"
                            : "border-line text-silver hover:bg-carbon"
                    }`}
                >
                    Tutto ({HARDWARE_CATALOG.length})
                </button>
                {categories.map((cat) => {
                    const count = HARDWARE_CATALOG.filter((d) => d.category === cat).length;
                    return (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                                category === cat
                                    ? "bg-accent-warm text-black border-accent-warm"
                                    : "border-line text-silver hover:bg-carbon"
                            }`}
                        >
                            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                ))}
            </div>

            <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 mt-12">
                <h2 className="text-display text-xl text-warm-white tracking-tight mb-3">
                    Non vedi quello che cerchi?
                </h2>
                <p className="text-warm-white-muted text-sm leading-relaxed max-w-2xl">
                    Il catalogo cresce in base alle richieste dei saloni clienti. Se hai già un POS,
                    una cassa RT o una stampante che vorresti collegare, contattaci con marca e
                    modello — valutiamo l'integrazione caso per caso. Tempi tipici di sviluppo:
                    16-40 ore per provider, ammortizzato sui saloni che richiedono lo stesso hardware.
                </p>
                <a
                    href="mailto:info@hairrich.it?subject=Richiesta integrazione hardware"
                    className="mt-4 inline-block px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon-2 transition-colors"
                >
                    Richiedi integrazione →
                </a>
            </section>
        </div>
    );
}

function DeviceCard({ device }: { device: HardwareDevice }) {
    const [imageBroken, setImageBroken] = useState(false);
    const showFallback = !device.imageUrl || imageBroken;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-carbon border border-line rounded-[var(--radius-md)] overflow-hidden flex flex-col hover:border-silver-mid transition-colors"
        >
            {/* Image / styled fallback */}
            <div
                className="relative h-44 flex items-center justify-center overflow-hidden"
                style={{
                    background: showFallback
                        ? `linear-gradient(135deg, ${device.brandColor}30 0%, ${device.brandColor}10 100%)`
                        : "#0a0a0a",
                }}
            >
                {!showFallback && device.imageUrl ? (
                    <img
                        src={device.imageUrl}
                        alt={device.name}
                        className="max-h-full max-w-full object-contain p-4"
                        onError={() => setImageBroken(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="text-center px-4">
                        <div className="text-6xl mb-2" aria-hidden>
                            {device.icon}
                        </div>
                        <div
                            className="text-display text-xl tracking-tight"
                            style={{ color: device.brandColor }}
                        >
                            {device.brand}
                        </div>
                    </div>
                )}
                <span
                    className={`absolute top-2 right-2 text-[9px] uppercase tracking-[0.25em] font-body font-semibold px-2 py-1 rounded-full border ${STATUS_TONES[device.status]}`}
                >
                    {STATUS_LABELS[device.status]}
                </span>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-3">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        {CATEGORY_LABELS[device.category]} · {CONNECTION_LABELS[device.connection]}
                    </div>
                    <h3 className="text-warm-white font-body font-semibold text-lg mt-1 leading-tight">
                        {device.name}
                    </h3>
                    <div className="text-xs text-silver-dark mt-0.5">{device.brand}</div>
                </div>

                <p className="text-sm text-warm-white-muted leading-snug">{device.descriptionIT}</p>

                {/* Pricing */}
                <div className="bg-black-2 rounded-md p-3 space-y-1.5 text-sm">
                    <PriceRow label="Costo iniziale" value={fmtPrice(device.setupCostEur)} />
                    <PriceRow
                        label="Costo mensile"
                        value={device.monthlyEur > 0 ? `€ ${device.monthlyEur}/mese` : "nessuno"}
                    />
                    {device.transactionFee && (
                        <PriceRow label="Per transazione" value={device.transactionFee} />
                    )}
                </div>

                {/* Pros + cons */}
                <ul className="space-y-1 text-xs">
                    {device.pros.map((p, i) => (
                        <li key={`pro-${i}`} className="flex gap-2 text-warm-white-muted">
                            <span className="text-green-400 shrink-0">✓</span>
                            <span>{p}</span>
                        </li>
                    ))}
                    {device.cons.map((c, i) => (
                        <li key={`con-${i}`} className="flex gap-2 text-warm-white-muted">
                            <span className="text-red-400 shrink-0">✗</span>
                            <span>{c}</span>
                        </li>
                    ))}
                </ul>

                {/* Platforms */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {device.platforms.map((p) => (
                        <span
                            key={p}
                            className="text-[9px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold px-2 py-0.5 bg-black-2 border border-line rounded-full"
                        >
                            {platformLabel(p)}
                        </span>
                    ))}
                </div>

                <div className="mt-auto pt-3 border-t border-line flex items-center justify-between text-xs">
                    {device.learnMoreUrl ? (
                        <a
                            href={device.learnMoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-warm hover:underline"
                        >
                            Sito ufficiale →
                        </a>
                    ) : (
                        <span className="text-silver-dark italic">Nessun link fornitore</span>
                    )}
                    {device.skillKey && (
                        <span className="text-[9px] uppercase tracking-[0.2em] text-silver-dark font-mono">
                            skill: {device.skillKey}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function PriceRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-silver-dark">{label}</span>
            <span className="text-warm-white font-body font-semibold">{value}</span>
        </div>
    );
}

function fmtPrice(eur: number): string {
    if (eur === 0) return "gratis";
    return `€ ${eur}${eur >= 100 ? "" : ""}`;
}

function platformLabel(p: string): string {
    const map: Record<string, string> = {
        chrome: "Chrome",
        edge: "Edge",
        safari: "Safari",
        android: "Android",
        ios: "iPhone",
        desktop_only: "Desktop",
    };
    return map[p] ?? p;
}
