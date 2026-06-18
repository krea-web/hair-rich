"use client";

import { Drawer } from "vaul";
import { BookingWizard } from "./BookingWizard";
import { useBookingDrawer, useBookingStore } from "@/lib/store";

/**
 * Global bottom-sheet drawer hosting the BookingWizard. Mount once per page
 * — the open/close state lives in zustand (useBookingDrawer) so any CTA on
 * the site can trigger it via `useBookingDrawer.getState().open()`.
 *
 * On md+ it renders as a centered modal-style drawer; on mobile it's a true
 * bottom sheet with safe-area-aware padding.
 */
export function BookingDrawer() {
    const isOpen = useBookingDrawer((s) => s.isOpen);
    const setOpen = useBookingDrawer((s) => s.setOpen);
    const resetBooking = useBookingStore((s) => s.reset);

    // Alla chiusura del drawer azzera lo stato del wizard: la prossima apertura
    // riparte sempre dallo step 1. La pre-selezione di servizio/slot fatta dalle
    // CTA avviene subito PRIMA dell'apertura, quindi non viene toccata.
    const handleOpenChange = (open: boolean) => {
        setOpen(open);
        if (!open) {
            resetBooking();
            try {
                localStorage.removeItem("hr-booking-draft");
            } catch {
                /* ignore */
            }
        }
    };

    return (
        <Drawer.Root open={isOpen} onOpenChange={handleOpenChange} shouldScaleBackground>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" />
                <Drawer.Content
                    className="fixed bottom-0 left-0 right-0 z-[91] mt-24 flex flex-col rounded-t-[28px] bg-black-2 border-t border-line outline-none"
                    style={{
                        height: "92dvh",
                        maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 12px)",
                        paddingTop: "env(safe-area-inset-top, 0px)",
                    }}
                >
                    {/* Handle */}
                    <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 md:px-8 pt-4 pb-2">
                        <div>
                            <Drawer.Title className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                Prenota il tuo appuntamento
                            </Drawer.Title>
                            <Drawer.Description className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mt-1">
                                Disponibilità in tempo reale · nessun pagamento online
                            </Drawer.Description>
                        </div>
                        <Drawer.Close asChild>
                            <button
                                aria-label="Chiudi"
                                className="w-10 h-10 rounded-full border border-line text-silver hover:text-warm-white hover:border-warm-white transition-colors flex items-center justify-center"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </Drawer.Close>
                    </div>

                    {/* Scrollable wizard */}
                    <div
                        className="flex-1 overflow-y-auto px-6 md:px-8 pt-4"
                        style={{
                            paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
                        }}
                    >
                        <BookingWizard />
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
