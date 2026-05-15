"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./EditorialHeading";

interface Props {
    eyebrow: string;
    titleA: string;
    titleB?: string;
    intro?: string;
    children?: React.ReactNode;
}

/**
 * Hero compatto per pagine secondarie (/prenota, /servizi, /lavori, /team,
 * /contatti). Mantiene il linguaggio editorial della home ma sta dentro un
 * 60-65vh, così la pagina sotto comincia subito.
 */
export function PageHero({ eyebrow, titleA, titleB, intro, children }: Props) {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            {/* Mark editorial sullo sfondo */}
            <div
                aria-hidden="true"
                className="absolute -top-24 -left-10 text-display-alt text-[24vw] md:text-[16vw] text-warm-white/[0.02] leading-none pointer-events-none select-none"
            >
                {titleA}
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-32 md:pt-40 pb-14 md:pb-20 min-h-[55vh] md:min-h-[60vh] flex flex-col justify-end">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <EditorialHeading
                        eyebrow={eyebrow}
                        title={
                            <>
                                {titleA}
                                {titleB && (
                                    <>
                                        {" "}
                                        <em className="text-display-alt not-italic text-silver">{titleB}</em>
                                    </>
                                )}
                            </>
                        }
                    />
                    {intro && (
                        <p className="mt-6 max-w-2xl text-warm-white-muted text-base md:text-lg leading-relaxed">
                            {intro}
                        </p>
                    )}
                    {children && <div className="mt-8">{children}</div>}
                </motion.div>
            </div>
        </section>
    );
}
