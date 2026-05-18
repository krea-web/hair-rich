"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchAppointmentPhotos, type AppointmentPhoto } from "@/lib/supabase/queries";

interface Props {
    appointmentId: string;
}

/**
 * Compact horizontal strip of photos linked to a past appointment. Renders
 * nothing if there are no photos yet (most appointments won't have any
 * until the barber starts uploading via admin).
 */
export function AppointmentPhotos({ appointmentId }: Props) {
    const [photos, setPhotos] = useState<AppointmentPhoto[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let alive = true;
        fetchAppointmentPhotos([appointmentId])
            .then((rows) => {
                if (!alive) return;
                setPhotos(rows);
                setLoaded(true);
            })
            .catch(() => {
                if (alive) setLoaded(true);
            });
        return () => {
            alive = false;
        };
    }, [appointmentId]);

    if (!loaded || photos.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-4 flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide"
        >
            {photos.map((p) => (
                <a
                    key={p.id}
                    href={p.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-16 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-line block group relative"
                    aria-label={p.caption ?? "Foto del taglio"}
                >
                    <img
                        src={p.signed_url}
                        alt={p.caption ?? ""}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                    />
                </a>
            ))}
            <span className="flex-shrink-0 inline-flex items-center text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold px-1">
                {photos.length} foto · tocca per zoom
            </span>
        </motion.div>
    );
}
