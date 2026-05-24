"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBookingStore, useToastStore } from "@/lib/store";
import { bookingContactSchema, type BookingContactData } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { downloadICS, googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar";
import { bookAppointment, redeemCoupon, uploadReferenceImage } from "@/lib/supabase/queries";
import { SITE } from "@/lib/constants";
import { ConfettiBurst } from "./ConfettiBurst";
import { renderBookingShareImage, shareBookingImage } from "@/lib/bookingShareImage";
import { CouponField, type AppliedCoupon } from "./CouponField";
import { PackageCreditField, type ActivePackage } from "./PackageCreditField";
import { createClient } from "@/lib/supabase/client";

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
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<ActivePackage | null>(null);
    const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
    const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
    const MAX_REFERENCES = 3;

    const handleAddReferences = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const incoming = Array.from(files).slice(0, MAX_REFERENCES - referenceFiles.length);
        const newPreviews = incoming.map((f) => URL.createObjectURL(f));
        setReferenceFiles((prev) => [...prev, ...incoming]);
        setReferencePreviews((prev) => [...prev, ...newPreviews]);
    };

    const handleRemoveReference = (i: number) => {
        setReferenceFiles((prev) => prev.filter((_, idx) => idx !== i));
        setReferencePreviews((prev) => {
            const removed = prev[i];
            if (removed) URL.revokeObjectURL(removed);
            return prev.filter((_, idx) => idx !== i);
        });
    };

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
            // Upload reference photos in parallel, ignore individual failures
            // so a single failed upload doesn't block the booking itself.
            const refPaths: string[] = [];
            if (referenceFiles.length > 0) {
                const settled = await Promise.allSettled(
                    referenceFiles.map((f) => uploadReferenceImage(f))
                );
                for (const r of settled) {
                    if (r.status === "fulfilled") refPaths.push(r.value);
                }
            }

            const result = await bookAppointment({
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email ?? "",
                serviceId,
                staffId: staffId ?? null,
                startAtISO,
                notes: data.notes ?? "",
                isFirstVisit,
                referenceImagePaths: refPaths,
            });

            if (appliedCoupon && result?.appointment_id && result?.customer_id) {
                try {
                    await redeemCoupon({
                        couponId: appliedCoupon.couponId,
                        appointmentId: result.appointment_id,
                        customerId: result.customer_id,
                        discountCents: appliedCoupon.discountCents,
                    });
                } catch {
                    addToast("Prenotato, ma coupon non applicato", "info");
                }
            }

            if (selectedPackage && result?.appointment_id) {
                try {
                    const supabase = createClient();
                    const { error: redeemErr } = await supabase.rpc("fn_redeem_package_credit", {
                        p_customer_package_id: selectedPackage.customer_package_id,
                        p_appointment_id: result.appointment_id,
                    });
                    if (redeemErr) throw redeemErr;
                    addToast("Credito pacchetto applicato", "success");
                } catch {
                    addToast("Prenotato, ma credito non applicato", "info");
                }
            }

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
        const handleShare = async () => {
            if (!startDate || !service) return;
            const dateLabel = new Intl.DateTimeFormat("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
            }).format(startDate);
            const timeLabel = new Intl.DateTimeFormat("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
            }).format(startDate);
            const file = await renderBookingShareImage({
                serviceName: service.name,
                dateLabel,
                timeLabel,
                staffName: staff?.name ?? null,
            });
            if (!file) {
                addToast("Generazione immagine fallita", "error");
                return;
            }
            const shared = await shareBookingImage(
                file,
                `Prenotato da Hair Rich Olbia · ${dateLabel} alle ${timeLabel}`
            );
            if (!shared) {
                addToast("Immagine scaricata: ora condividila come storia", "info");
            }
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative text-center space-y-8 py-6 overflow-visible"
            >
                {/* Confetti — fires once on mount, ~1.5s. Absolutely positioned
                   so it overlays the check ring without affecting layout. */}
                <ConfettiBurst />

                {/* Big rotating check */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
                    className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-accent-warm to-accent-warm-dark border-2 border-accent-warm flex items-center justify-center shadow-[0_8px_40px_-8px_rgba(212,165,116,0.6)]"
                >
                    <svg viewBox="0 0 24 24" className="w-12 h-12 text-black" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    <span className="text-display-alt text-2xl text-accent-warm">Ci vediamo presto</span>
                    <h3 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[1.05]">
                        Prenotazione confermata
                    </h3>
                    <p className="mt-3 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-md mx-auto">
                        Ti aspettiamo in salone. Riceverai un promemoria 24h prima via email.
                    </p>
                </motion.div>

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

                {/* Share image — generates a 1080x1920 PNG with the booking
                   details and opens the native share sheet (or falls back to
                   download). Lets users post the booking to their IG story. */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                >
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-3 px-6 py-3 border-2 border-accent-warm/60 text-accent-warm bg-accent-warm/5 rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-accent-warm hover:text-black transition-colors active:scale-95"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                            <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        Condividi su Instagram
                    </button>
                </motion.div>

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
                                autoComplete="given-name"
                                autoCapitalize="words"
                                className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3.5 md:py-3 text-base md:text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
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
                                autoComplete="family-name"
                                autoCapitalize="words"
                                className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3.5 md:py-3 text-base md:text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
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
                            inputMode="tel"
                            autoComplete="tel"
                            className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3.5 md:py-3 text-base md:text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
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
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="off"
                            className="mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3.5 md:py-3 text-base md:text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
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
                            placeholder="Allergie, richieste particolari…"
                        />
                    </div>

                    {/* Foto reference upload — fino a 3, accede direttamente alla
                       fotocamera del telefono via capture="environment" */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Foto del taglio che vuoi <span className="text-silver-dark">(opzionale · max 3)</span>
                        </label>
                        <p className="mt-1 text-[11px] text-warm-white-muted leading-snug">
                            Una foto di reference vale dieci minuti di consulto. Il barber la vede prima del tuo arrivo.
                        </p>

                        {referencePreviews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {referencePreviews.map((src, i) => (
                                    <div
                                        key={i}
                                        className="relative aspect-[4/5] rounded-[var(--radius-sm)] overflow-hidden border border-line group"
                                    >
                                        <img
                                            src={src}
                                            alt={`Reference ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveReference(i)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 text-warm-white flex items-center justify-center text-xs active:scale-95 hover:bg-error transition-colors"
                                            aria-label="Rimuovi"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {referenceFiles.length < MAX_REFERENCES && (
                            <label className="mt-3 inline-flex items-center gap-3 px-4 py-3 bg-black-2 border border-dashed border-line rounded-[var(--radius-sm)] text-warm-white text-sm font-body cursor-pointer hover:border-accent-warm transition-colors active:scale-[0.99]">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span>{referenceFiles.length === 0 ? "Aggiungi foto" : "Aggiungi altra foto"}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                        handleAddReferences(e.target.files);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {/* First-visit toggle — the barber sees this flag in the admin
                       agenda and dedicates extra consult time + post-cut photo */}
                    <label
                        className={`flex items-start gap-3 cursor-pointer select-none px-4 py-3.5 rounded-[var(--radius-sm)] border transition-colors ${
                            isFirstVisit
                                ? "bg-accent-warm/10 border-accent-warm"
                                : "bg-black-2 border-line hover:border-silver-mid"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={isFirstVisit}
                            onChange={(e) => setIsFirstVisit(e.target.checked)}
                            className="sr-only"
                        />
                        <span
                            aria-hidden="true"
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isFirstVisit
                                    ? "bg-accent-warm border-accent-warm"
                                    : "border-line"
                            }`}
                        >
                            {isFirstVisit && (
                                <svg viewBox="0 0 24 24" className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </span>
                        <span className="flex-1">
                            <span className="block text-sm text-warm-white font-body font-semibold">
                                È il mio primo appuntamento da voi
                            </span>
                            <span className="block text-xs text-warm-white-muted mt-0.5 leading-snug">
                                Il barber dedicherà più tempo al consulto iniziale.
                            </span>
                        </span>
                    </label>

                    <PackageCreditField
                        serviceId={serviceId}
                        onChange={setSelectedPackage}
                    />

                    <CouponField
                        subtotalCents={service?.price_cents ?? 0}
                        onChange={setAppliedCoupon}
                    />

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
                    {appliedCoupon && (
                        <div className="mt-4 pt-3 border-t border-line/50 flex items-center justify-between text-sm">
                            <span className="text-success font-body">
                                Coupon{" "}
                                <code className="font-mono text-xs tracking-widest">{appliedCoupon.code}</code>
                            </span>
                            <span className="text-success tabular-nums">
                                -{formatPrice(appliedCoupon.discountCents)}
                            </span>
                        </div>
                    )}
                    {selectedPackage && (
                        <div className="mt-4 pt-3 border-t border-line/50 flex items-center justify-between text-sm">
                            <span className="text-accent-warm font-body">
                                Pacchetto{" "}
                                <span className="font-body text-xs text-silver-dark">
                                    ({selectedPackage.credits_remaining - 1}/{selectedPackage.credits_total} dopo)
                                </span>
                            </span>
                            <span className="text-accent-warm tabular-nums">−1 credito</span>
                        </div>
                    )}
                    <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Totale
                        </span>
                        <span className="text-display text-2xl text-accent-warm tabular-nums">
                            {selectedPackage
                                ? "Gratis"
                                : service
                                ? formatPrice(
                                      Math.max(0, service.price_cents - (appliedCoupon?.discountCents ?? 0))
                                  )
                                : "—"}
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
