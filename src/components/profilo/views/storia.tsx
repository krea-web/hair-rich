"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface PhotoRow {
    id: string;
    appointment_id: string;
    storage_path: string;
    caption: string | null;
    created_at: string;
    appointment: {
        id: string;
        start_at: string;
        status: string;
        staff: { name: string | null } | null;
        appointment_services: { service: { name: string | null } | null }[];
    } | null;
}

interface PhotoGrouped {
    appointment_id: string;
    when: string;
    service: string;
    staff: string;
    photos: { id: string; url: string; caption: string | null }[];
}

export default function ProfiloStoriaPage() {
    const [groups, setGroups] = useState<PhotoGrouped[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState<{ url: string; caption: string | null } | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return;

            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", user.user.id)
                .maybeSingle();
            if (!customer) return;

            // Fetch photos joined to the customer's own appointments
            const { data: photos, error } = await supabase
                .from("appointment_photos")
                .select(`
                    id, appointment_id, storage_path, caption, created_at,
                    appointment:appointment_id (
                        id, start_at, status,
                        staff:staff_id ( name ),
                        appointment_services ( service:service_id ( name ) )
                    )
                `)
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;

            const filtered = (photos ?? []).filter(
                (p: any) => p.appointment?.id && p.appointment !== null,
            ) as unknown as PhotoRow[];

            // Group by appointment
            const map = new Map<string, PhotoGrouped>();
            for (const p of filtered) {
                if (!p.appointment) continue;
                const apptId = p.appointment.id;
                const url = supabase.storage.from("appointment_photos").getPublicUrl(p.storage_path).data.publicUrl;
                if (!map.has(apptId)) {
                    const services = p.appointment.appointment_services
                        ?.map((s) => s.service?.name)
                        .filter(Boolean) as string[];
                    map.set(apptId, {
                        appointment_id: apptId,
                        when: p.appointment.start_at,
                        service: services?.length ? services.join(" + ") : "Servizio",
                        staff: p.appointment.staff?.name ?? "—",
                        photos: [],
                    });
                }
                map.get(apptId)!.photos.push({ id: p.id, url, caption: p.caption });
            }

            const sorted = Array.from(map.values()).sort(
                (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
            );

            setGroups(sorted);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const totalPhotos = useMemo(() => groups.reduce((s, g) => s + g.photos.length, 0), [groups]);

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-5xl">
            <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">La tua</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Storia.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-md">
                    Tutte le foto dei tuoi tagli, una galleria della tua evoluzione di stile.
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    {totalPhotos} foto · {groups.length} appuntamenti
                </p>
            </motion.header>

            {loading ? (
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="aspect-square bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <div className="mt-10 p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center">
                    <p className="text-warm-white text-lg font-body font-semibold">
                        Ancora nessuna foto.
                    </p>
                    <p className="mt-2 text-warm-white-muted text-sm max-w-md mx-auto">
                        Quando il tuo barbiere scatta la foto dopo il taglio, la trovi qui sotto.
                    </p>
                </div>
            ) : (
                <div className="mt-10 space-y-10">
                    {groups.map((g) => (
                        <motion.section
                            key={g.appointment_id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <header className="mb-3 flex items-end justify-between gap-3 flex-wrap">
                                <div>
                                    <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                        {g.service}
                                    </h2>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mt-1">
                                        {new Date(g.when).toLocaleDateString("it-IT", {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}{" "}
                                        · con {g.staff}
                                    </p>
                                </div>
                                <span className="text-xs text-silver-dark tabular-nums">{g.photos.length} foto</span>
                            </header>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {g.photos.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setLightbox({ url: p.url, caption: p.caption })}
                                        className="aspect-square bg-carbon border border-line rounded-md overflow-hidden group hover:border-accent-warm/60 transition-colors"
                                    >
                                        <img
                                            src={p.url}
                                            alt={p.caption ?? "Foto taglio"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        </motion.section>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative max-w-4xl max-h-[90dvh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setLightbox(null)}
                                className="absolute -top-12 right-0 text-warm-white hover:text-accent-warm text-2xl"
                                aria-label="Chiudi"
                            >
                                ×
                            </button>
                            <img src={lightbox.url} alt={lightbox.caption ?? ""} className="max-h-[80dvh] rounded-md" />
                            {lightbox.caption && (
                                <p className="text-warm-white text-sm text-center mt-3 italic">{lightbox.caption}</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
