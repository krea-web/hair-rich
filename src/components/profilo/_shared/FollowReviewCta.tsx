"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const INSTAGRAM_URL = SITE.instagram ?? "https://www.instagram.com/hair_rich_/";
// Fallback Google review entry-point when no place_id is stored: a Google
// Maps search for the salon name + address. Opens the place card with the
// "Scrivi una recensione" button visible.
const GOOGLE_FALLBACK =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${SITE.name} ${SITE.address}`);

export function FollowReviewCta() {
    const [reviewUrl, setReviewUrl] = useState<string>(GOOGLE_FALLBACK);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from("salon_settings")
                    .select("google_review_url, google_place_id")
                    .limit(1)
                    .maybeSingle();
                if (!alive || !data) return;
                const direct = (data as { google_review_url?: string | null }).google_review_url;
                const placeId = (data as { google_place_id?: string | null }).google_place_id;
                if (direct && direct.trim()) {
                    setReviewUrl(direct.trim());
                } else if (placeId) {
                    setReviewUrl(`https://search.google.com/local/writereview?placeid=${placeId}`);
                }
            } catch {
                /* keep fallback */
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            aria-label="Seguici e lascia una recensione"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
        >
            <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-[#1a0d2e] via-[#3a0d3a] to-[#5a1d2e] p-5 md:p-6 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-4">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-pink-300 font-body font-semibold">
                            Seguici
                        </span>
                        <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mt-1 leading-snug">
                            @hair_rich_
                        </h3>
                        <p className="mt-2 text-warm-white-muted text-sm leading-snug">
                            Foto dei tagli, behind the scenes, anteprime stile.
                        </p>
                        <span className="inline-flex items-center gap-1.5 mt-4 text-pink-300 text-[10px] uppercase tracking-[0.3em] font-body font-semibold group-hover:gap-2.5 transition-all">
                            Apri Instagram
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 text-pink-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                </div>
            </a>

            <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-[#0f1f0f] via-[#1f3a1f] to-[#0f2a4a] p-5 md:p-6 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-4">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 font-body font-semibold">
                            Recensione
                        </span>
                        <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mt-1 leading-snug">
                            Lasciaci 5 stelle su Google
                        </h3>
                        <p className="mt-2 text-warm-white-muted text-sm leading-snug">
                            È il modo più diretto per farci crescere — 30 secondi.
                        </p>
                        <span className="inline-flex items-center gap-1.5 mt-4 text-emerald-300 text-[10px] uppercase tracking-[0.3em] font-body font-semibold group-hover:gap-2.5 transition-all">
                            Apri Google
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-emerald-300 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" aria-hidden="true">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.06 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
                            </svg>
                        ))}
                    </div>
                </div>
            </a>
        </motion.section>
    );
}
