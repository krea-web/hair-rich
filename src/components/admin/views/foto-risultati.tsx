"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

/**
 * Admin tool to upload "result" photos for completed appointments. The
 * client-facing /profilo/appuntamenti picks these up via
 * appointment_photos.id and AppointmentPhotos.tsx renders them. Without
 * uploads here, the Round 2 "photo memory" feature stays dormant.
 *
 * UX:
 *  - Lists recent completed appointments (last 60 days, newest first)
 *  - Per row: customer name, date, service, existing thumbnail count
 *  - File picker per row uploads to appointment-photos/{id}/{uuid}.{ext}
 *    + inserts an appointment_photos row pointing at the storage path
 *  - Optimistic UI: thumbs show right after upload, toast on completion
 */

interface AdminApptRow {
    id: string;
    start_at: string;
    customer_first: string;
    customer_last: string | null;
    service_name: string;
    photo_count: number;
}

export default function AdminFotoRisultatiPage() {
    const [rows, setRows] = useState<AdminApptRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            // Last 60 days, status = completed
            const since = new Date();
            since.setDate(since.getDate() - 60);
            const { data, error } = await supabase
                .from("appointments")
                .select(
                    `id, start_at,
                    customer:customer_id ( first_name, last_name ),
                    appointment_services ( service:service_id ( name ) ),
                    appointment_photos ( id )`
                )
                .eq("status", "completed")
                .gte("start_at", since.toISOString())
                .order("start_at", { ascending: false });
            if (error) throw error;
            const mapped: AdminApptRow[] = (data ?? []).map((r: any) => ({
                id: r.id,
                start_at: r.start_at,
                customer_first: r.customer?.first_name ?? "—",
                customer_last: r.customer?.last_name ?? null,
                service_name:
                    r.appointment_services?.[0]?.service?.name ?? "Rituale",
                photo_count: r.appointment_photos?.length ?? 0,
            }));
            setRows(mapped);
        } catch (e: any) {
            addToast(`Errore caricamento: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const handleUpload = async (appointmentId: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadingId(appointmentId);
        const supabase = createClient();
        try {
            for (const file of Array.from(files)) {
                const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(ext) ? ext : "jpg";
                const path = `${appointmentId}/${crypto.randomUUID()}.${safeExt}`;
                const { error: uploadErr } = await supabase.storage
                    .from("appointment-photos")
                    .upload(path, file, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type || `image/${safeExt}`,
                    });
                if (uploadErr) throw uploadErr;

                const { error: insertErr } = await supabase
                    .from("appointment_photos")
                    .insert({
                        appointment_id: appointmentId,
                        storage_path: path,
                    });
                if (insertErr) throw insertErr;
            }
            addToast(`${files.length} foto caricat${files.length === 1 ? "a" : "e"}`, "success");
            load();
        } catch (e: any) {
            addToast(`Errore upload: ${e?.message ?? "?"}`, "error");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-6xl">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">
                    Foto risultato
                </span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Memoria dei tagli.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-2xl leading-relaxed">
                    Carica le foto del taglio finito subito dopo l'appuntamento. Il cliente le
                    vedrà nel suo profilo e potrà riprenotare lo stesso look con un tap. Più foto
                    riempi qui, più i clienti tornano.
                </p>
            </motion.header>

            <div className="mt-8 md:mt-12">
                {loading && (
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-24 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {!loading && rows.length === 0 && (
                    <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                        Nessun appuntamento completato negli ultimi 60 giorni. Quando ne
                        marcherai uno come "completato" nell'agenda, comparirà qui.
                    </p>
                )}

                {!loading && rows.length > 0 && (
                    <ul className="space-y-3">
                        {rows.map((r) => {
                            const d = new Date(r.start_at);
                            const dateStr = d.toLocaleString("it", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                            const isUploading = uploadingId === r.id;
                            return (
                                <motion.li
                                    key={r.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 bg-carbon border border-line rounded-[var(--radius-md)] hover:border-silver-dark transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-3 flex-wrap">
                                            <span className="text-display text-lg text-warm-white tracking-tight">
                                                {r.customer_first} {r.customer_last ?? ""}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                                {dateStr}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-3 text-warm-white-muted text-sm">
                                            <span>{r.service_name}</span>
                                            {r.photo_count > 0 && (
                                                <span className="inline-flex items-center gap-1 text-accent-warm text-xs">
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                                                    </svg>
                                                    {r.photo_count} foto
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <label
                                        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                                            isUploading
                                                ? "bg-line text-silver cursor-wait"
                                                : "bg-accent-warm text-black hover:scale-[1.02] active:scale-95"
                                        }`}
                                    >
                                        {isUploading ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Carico…
                                            </>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                                {r.photo_count > 0 ? "Aggiungi altra" : "Carica foto"}
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            capture="environment"
                                            className="sr-only"
                                            disabled={isUploading}
                                            onChange={(e) => {
                                                handleUpload(r.id, e.target.files);
                                                e.target.value = "";
                                            }}
                                        />
                                    </label>
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
