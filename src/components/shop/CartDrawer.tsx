"use client";

import { useCartStore, useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createOrder } from "@/lib/supabase/queries";

type Stage = "cart" | "checkout" | "success";

interface CheckoutForm {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
}

export function CartDrawer() {
    const { items, isOpen, close, updateQuantity, removeItem, totalPrice, totalItems, clearCart } =
        useCartStore();
    const addToast = useToastStore((s) => s.addToast);

    const [stage, setStage] = useState<Stage>("cart");
    const [submitting, setSubmitting] = useState(false);
    const [orderResult, setOrderResult] = useState<{
        short_code: string;
        pickup_deadline: string;
    } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CheckoutForm>();

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else {
            document.body.style.overflow = "";
            // Reset to cart view a beat after the drawer closes
            setTimeout(() => {
                if (!useCartStore.getState().isOpen) {
                    setStage("cart");
                    setOrderResult(null);
                    reset();
                }
            }, 300);
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen, reset]);

    const handlePlaceOrder = async (data: CheckoutForm) => {
        setSubmitting(true);
        try {
            const result = await createOrder({
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email ?? "",
                notes: data.notes ?? "",
                items: items.map((i) => ({
                    product_id: i.productId,
                    quantity: i.quantity,
                })),
            });
            setOrderResult({
                short_code: result.short_code,
                pickup_deadline: result.pickup_deadline,
            });
            clearCart();
            setStage("success");
            addToast("Ordine confermato — codice generato", "success");
        } catch (e: any) {
            const msg = e?.message ?? "Errore durante l'ordine";
            addToast(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 z-[80] w-full max-w-md h-[100dvh] bg-carbon border-l border-line flex flex-col shadow-2xl shadow-black"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Carrello"
                        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
                    >
                        <div className="flex items-center justify-between p-5 md:p-6 border-b border-line">
                            <h2 className="text-display text-xl text-warm-white">
                                {stage === "cart"
                                    ? "Carrello"
                                    : stage === "checkout"
                                        ? "Conferma ordine"
                                        : "Ordine ricevuto"}
                                {stage === "cart" && (
                                    <span className="text-silver-dark text-sm ml-2">({totalItems()})</span>
                                )}
                            </h2>
                            <div className="flex items-center gap-2">
                                {stage === "checkout" && (
                                    <button
                                        onClick={() => setStage("cart")}
                                        className="text-[10px] uppercase tracking-[0.25em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                                    >
                                        ← Carrello
                                    </button>
                                )}
                                <button
                                    onClick={close}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black-2 hover:bg-carbon-2 text-silver-mid transition-colors"
                                    aria-label="Chiudi"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* CART VIEW */}
                        {stage === "cart" && (
                            <>
                                <div className="flex-1 overflow-y-auto p-5 md:p-6 overscroll-contain">
                                    {items.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-black-2 flex items-center justify-center text-silver-dark">
                                                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                                    <path d="M3 6h18" />
                                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                                </svg>
                                            </div>
                                            <p className="text-warm-white-muted text-sm max-w-[220px]">
                                                Il tuo carrello è vuoto. Scopri pomate, oli barba e strumenti.
                                            </p>
                                            <a
                                                href="/prodotti"
                                                onClick={close}
                                                className="mt-2 text-xs uppercase tracking-[0.3em] font-body font-semibold text-accent-warm hover:text-warm-white transition-colors"
                                            >
                                                Vai allo shop →
                                            </a>
                                        </div>
                                    ) : (
                                        <ul className="space-y-5">
                                            <AnimatePresence>
                                                {items.map((item) => (
                                                    <motion.li
                                                        key={item.productId}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                                        className="flex gap-4"
                                                    >
                                                        <div className="w-20 h-24 shrink-0 rounded-[var(--radius-sm)] bg-black-2 border border-line overflow-hidden">
                                                            {item.imageUrl ? (
                                                                <img
                                                                    src={item.imageUrl}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-silver-dark text-xs uppercase">
                                                                    —
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                                            <div>
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <h3 className="font-body text-sm font-semibold text-warm-white line-clamp-2">
                                                                        {item.name}
                                                                    </h3>
                                                                    <button
                                                                        onClick={() => removeItem(item.productId)}
                                                                        className="text-silver-dark hover:text-error transition-colors p-1 -m-1"
                                                                        aria-label="Rimuovi"
                                                                    >
                                                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                <p className="text-accent-warm text-sm mt-1 tabular-nums">
                                                                    {formatPrice(item.price)}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center rounded-full border border-line bg-black-2 overflow-hidden w-fit">
                                                                <button
                                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                                    className="w-9 h-9 flex items-center justify-center text-silver hover:bg-carbon transition-colors active:bg-carbon-2"
                                                                    aria-label="Riduci"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-semibold text-warm-white tabular-nums">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                                    className="w-9 h-9 flex items-center justify-center text-silver hover:bg-carbon transition-colors active:bg-carbon-2"
                                                                    aria-label="Aumenta"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.li>
                                                ))}
                                            </AnimatePresence>
                                        </ul>
                                    )}
                                </div>

                                {items.length > 0 && (
                                    <div
                                        className="p-5 md:p-6 border-t border-line bg-black-2"
                                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
                                    >
                                        <div className="flex justify-between items-center mb-5">
                                            <span className="text-warm-white-muted text-sm">Totale · ritiro in salone</span>
                                            <span className="text-display text-2xl text-warm-white tabular-nums">
                                                {formatPrice(totalPrice())}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setStage("checkout")}
                                            className="w-full py-4 px-6 bg-accent-warm text-black font-body font-semibold text-sm tracking-wider uppercase rounded-full transition-all duration-200 hover:brightness-110 hover:scale-[1.01] active:scale-[0.98]"
                                        >
                                            Conferma ordine →
                                        </button>
                                        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-silver-dark mt-3 font-body font-semibold">
                                            Pagamento al ritiro · contanti, bancomat, carte
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* CHECKOUT VIEW */}
                        {stage === "checkout" && (
                            <form
                                onSubmit={handleSubmit(handlePlaceOrder)}
                                className="flex-1 overflow-y-auto p-5 md:p-6 overscroll-contain"
                                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
                            >
                                <p className="text-warm-white-muted text-sm leading-relaxed mb-5">
                                    Lasciaci i tuoi contatti. Prepariamo l'ordine entro 24 ore e ti scriviamo
                                    quando è pronto. Si paga in salone al ritiro.
                                </p>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Nome" error={errors.firstName?.message}>
                                            <input
                                                {...register("firstName", { required: "Obbligatorio", minLength: { value: 2, message: "Minimo 2 caratteri" } })}
                                                autoComplete="given-name"
                                                className={inputCls}
                                                placeholder="Mario"
                                            />
                                        </Field>
                                        <Field label="Cognome" error={errors.lastName?.message}>
                                            <input
                                                {...register("lastName", { required: "Obbligatorio", minLength: { value: 2, message: "Minimo 2 caratteri" } })}
                                                autoComplete="family-name"
                                                className={inputCls}
                                                placeholder="Rossi"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Telefono" error={errors.phone?.message}>
                                        <input
                                            {...register("phone", { required: "Obbligatorio", pattern: { value: /^\+?[0-9\s]{8,15}$/, message: "Numero non valido" } })}
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            className={inputCls}
                                            placeholder="+39 333 1234567"
                                        />
                                    </Field>
                                    <Field label={<>Email <span className="text-silver-dark">(opzionale)</span></>} error={errors.email?.message}>
                                        <input
                                            {...register("email", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email non valida" } })}
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            autoCapitalize="off"
                                            className={inputCls}
                                            placeholder="mario@email.com"
                                        />
                                    </Field>
                                    <Field label={<>Note <span className="text-silver-dark">(opzionale)</span></>}>
                                        <textarea
                                            {...register("notes")}
                                            rows={2}
                                            className={`${inputCls} resize-none`}
                                            placeholder="Allergie, esigenze particolari…"
                                        />
                                    </Field>
                                </div>

                                <div className="mt-5 p-4 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-warm-white-muted">Totale al ritiro</span>
                                        <span className="text-warm-white font-display text-xl tabular-nums">
                                            {formatPrice(totalPrice())}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] text-silver-dark mt-2">
                                        <span>Ritiro entro</span>
                                        <span>7 giorni</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="mt-6 w-full py-4 px-6 bg-accent-warm text-black font-body font-semibold text-sm tracking-wider uppercase rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
                                >
                                    {submitting ? (
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <>
                                            Prenota l'ordine
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] uppercase tracking-[0.25em] text-silver-dark mt-3 font-body font-semibold">
                                    Nessun pagamento online · si salda al ritiro
                                </p>
                            </form>
                        )}

                        {/* SUCCESS VIEW */}
                        {stage === "success" && orderResult && (
                            <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col items-center text-center">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                                    className="mt-8 w-20 h-20 rounded-full bg-gradient-to-br from-accent-warm to-accent-warm-dark flex items-center justify-center shadow-[0_8px_40px_-8px_rgba(212,165,116,0.6)]"
                                >
                                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-black" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>

                                <h3 className="text-display text-3xl text-warm-white tracking-tight mt-6">
                                    Ordine ricevuto
                                </h3>
                                <p className="mt-3 text-warm-white-muted text-sm max-w-xs leading-relaxed">
                                    Ti scriviamo entro 24 ore quando i prodotti sono pronti. Porta questo
                                    codice al barber al ritiro:
                                </p>

                                <div className="mt-6 px-8 py-5 bg-black-2 border-2 border-accent-warm/40 rounded-[var(--radius-md)]">
                                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                        Codice ritiro
                                    </span>
                                    <p className="mt-2 text-display text-5xl text-warm-white tracking-[0.15em] tabular-nums">
                                        {orderResult.short_code}
                                    </p>
                                </div>

                                <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    Ritiro entro {new Date(orderResult.pickup_deadline).toLocaleDateString("it-IT", {
                                        day: "numeric",
                                        month: "long",
                                    })}
                                </p>

                                <button
                                    onClick={close}
                                    className="mt-10 inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95"
                                >
                                    Chiudi
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const inputCls =
    "mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-base md:text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors";

function Field({
    label,
    error,
    children,
}: {
    label: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </label>
            {children}
            {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
    );
}
