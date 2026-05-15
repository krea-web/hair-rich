"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBookingStore, useToastStore } from "@/lib/store";
import { bookingContactSchema, type BookingContactData } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { downloadICS, googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar";
import { bookAppointment } from "@/lib/supabase/queries";
import { SITE } from "@/lib/constants";

export function StepConfirm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
    const {
        serviceId,
        staffId,
        date,
        time,
        notes,
        contactName,
        contactPhone,
        contactEmail,
        services,
        staff: staffList,
        setContact,
        setNotes,
    } = useBookingStore();
    const addToast = useToastStore((s) => s.addToast);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const service = services.find((s) => s.id === serviceId) ?? null;
    const staff = staffId ? staffList.find((s) => s.id === staffId) ?? null : null;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BookingContactData>({
        resolver: zodResolver(bookingContactSchema),
        defaultValues: {
            firstName: contactName?.split(" ")[0] ?? "",
            lastName: contactName?.split(" ").slice(1).join(" ") ?? "",
            phone: contactPhone,
            email: contactEmail,
            notes,
        },
    });

    const onSubmit = async (data: BookingContactData) => {
        if (!serviceId || !date || !time) {
            setSubmitError("Mancano servizio, data o ora.");
            return;
        }
        setSubmitting(true);
        setSubmitError(null);

        // Costruisci start_at in fuso Europe/Rome
        const startAtISO = new Date(`${date}T${time}:00+02:00`).toISOString();

        try {
            await bookAppointment({
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email ?? "",
                serviceId,
                staffId: staffId ?? null,
                startAtISO,
                notes: data.notes ?? "",
            });

            setContact({
                name: `${data.firstName} ${data.lastName}`,
                phone: data.phone,
                email: data.email ?? "",
            });
            setNotes(data.notes ?? "");
            setSubmitted(true);
            addToast("Prenotazione confermata", "success");

            if (typeof window !== "undefined" && (window as any).plausible) {
                (window as any).plausible("booking_complete", {
                    props: { service: service?.name, staff: staff?.name ?? "any" },
                });
            }
        } catch (err: any) {
            const msg = err?.message ?? "Errore durante la prenotazione";
            if (msg.includes("Slot non disponibile")) {
                setSubmitError("Lo slot scelto è stato appena prenotato. Torna indietro e scegline un altro.");
            } else {
                setSubmitError(msg);
            }
            addToast("Errore nella prenotazione", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Calendar export helpers
    const startDate = date && time ? new Date(`${date}T${time}:00`) : null;
    const buildBooking = () => ({
        title: `${service?.name ?? "Hair Rich"} · Hair Rich Olbia`,
        description: `Prenotazione presso Hair Rich Olbia${staff ? ` con ${staff.name}` : ""}.${notes ? `\n\nNote: ${notes}` : ""}`,
        location: SITE.address,
        start: startDate!,
        durationMinutes: service?.duration_min ?? 30,
    });

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-8 py-6"
            >
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                    className="mx-auto w-20 h-20 rounded-full bg-success/15 border border-success/40 flex items-center justify-center"
                >
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-success" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
                <div>
                    <span className="text-display-alt text-2xl text-accent-warm">Confermato</span>
                    <h3 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1">
                        Prenotazione confermata
                    </h3>
                    <p className="mt-3 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-md mx-auto">
                        Ti aspettiamo in salone. Riceverai un promemoria 24h prima via SMS e WhatsApp.
                    </p>
                </div>

                {startDate && (
                    <div className="inline-flex flex-col items-center gap-1 px-6 py-4 bg-carbon border border-line rounded-[var(--radius-md)]">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {service?.name ?? "Servizio"}
                        </span>
                        <span className="text-display text-xl text-warm-white">
                            {new Intl.DateTimeFormat("it-IT", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                            }).format(startDate)}
                        </span>
                        {staff && (
                            <span className="text-xs text-silver">con {staff.name} · {staff.role}</span>
                        )}
                    </div>
                )}

                <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-3">
                        Aggiungi al calendario
                    </h4>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {startDate && (
                            <>
                                <a
                                    href={googleCalendarUrl(buildBooking())}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors"
                                >
                                    Google Calendar
                                </a>
                                <a
                                    href={outlookCalendarUrl(buildBooking())}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors"
                                >
                                    Outlook
                                </a>
                                <button
                                    onClick={() => downloadICS(buildBooking())}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors"
                                >
                                    Apple / .ics
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={onDone}
                    className="inline-flex items-center gap-3 px-7 py-3 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform mt-4"
                >
                    Nuova prenotazione
                </button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="text-display-alt text-xl text-accent-warm">03</span>
                    <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mt-1">
                        Conferma
                    </h3>
                    <p className="mt-2 text-warm-white-muted text-sm">
                        Ultimi dettagli e sei a posto. Niente carta richiesta.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Indietro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Nome
                            </label>
                            <input
                                {...register("firstName")}
                                className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                                placeholder="Mario"
                            />
                            {errors.firstName && <p className="text-error text-xs mt-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Cognome
                            </label>
                            <input
                                {...register("lastName")}
                                className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                                placeholder="Rossi"
                            />
                            {errors.lastName && <p className="text-error text-xs mt-1">{errors.lastName.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Telefono
                        </label>
                        <input
                            {...register("phone")}
                            type="tel"
                            className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                            placeholder="+39 333 1234567"
                        />
                        {errors.phone && <p className="text-error text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Email <span className="text-silver-dark">(opzionale)</span>
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                            placeholder="mario@email.com"
                        />
                        {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Note <span className="text-silver-dark">(opzionale)</span>
                        </label>
                        <textarea
                            {...register("notes")}
                            rows={3}
                            className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors resize-none"
                            placeholder="Allergie, richieste particolari, foto reference…"
                        />
                    </div>

                    {submitError && (
                        <div className="text-xs text-error bg-error/10 border border-error/30 rounded-[var(--radius-sm)] px-3 py-2">
                            {submitError}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-2 inline-flex items-center justify-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <>
                                Conferma prenotazione
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-silver-dark text-center">
                        Nessun pagamento richiesto. Si paga in salone post-servizio.
                    </p>
                </form>

                {/* Sticky Summary */}
                <aside className="md:sticky md:top-4 self-start bg-gradient-to-br from-carbon to-black-2 border border-accent-warm/30 rounded-[var(--radius-md)] p-5">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                        Riepilogo
                    </h4>
                    <div className="mt-4 space-y-3 text-sm">
                        <SummaryRow label="Servizio" value={service?.name ?? "—"} />
                        <SummaryRow label="Barber" value={staff?.name ?? "Chiunque"} />
                        <SummaryRow
                            label="Quando"
                            value={
                                startDate
                                    ? new Intl.DateTimeFormat("it-IT", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }).format(startDate)
                                    : "—"
                            }
                        />
                        <SummaryRow label="Durata" value={service ? `${service.duration_min} min` : "—"} />
                    </div>
                    <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Totale
                        </span>
                        <span className="text-display text-2xl text-accent-warm tabular-nums">
                            {service ? formatPrice(service.price_cents) : "—"}
                        </span>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold w-20 flex-shrink-0">
                {label}
            </span>
            <span className="text-warm-white font-body truncate">{value}</span>
        </div>
    );
}
