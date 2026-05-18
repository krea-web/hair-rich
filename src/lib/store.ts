"use client";

import { create } from "zustand";

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface CartItem {
    productId: string;
    name: string;
    price: number;
    imageUrl?: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isOpen: false,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),

    addItem: (item) =>
        set((state) => {
            const existing = state.items.find((i) => i.productId === item.productId);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.productId === item.productId
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    ),
                };
            }
            return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

    removeItem: (productId) =>
        set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
        })),

    updateQuantity: (productId, quantity) =>
        set((state) => ({
            items:
                quantity <= 0
                    ? state.items.filter((i) => i.productId !== productId)
                    : state.items.map((i) =>
                        i.productId === productId ? { ...i, quantity } : i
                    ),
        })),

    clearCart: () => set({ items: [] }),

    totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

    totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));

/* ── Toast store ───────────────────────────────────────────────────────────── */
export interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type?: Toast["type"]) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type = "info") => {
        const id = Math.random().toString(36).slice(2, 9);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4000);
    },
    removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/* ── Modal store ───────────────────────────────────────────────────────────── */
interface ModalState {
    isOpen: boolean;
    content: React.ReactNode | null;
    openModal: (content: React.ReactNode) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    isOpen: false,
    content: null,
    openModal: (content) => set({ isOpen: true, content }),
    closeModal: () => set({ isOpen: false, content: null }),
}));

/* ── Booking drawer (bottom sheet) ─────────────────────────────────────────── */
interface BookingDrawerState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    setOpen: (open: boolean) => void;
}

export const useBookingDrawer = create<BookingDrawerState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    setOpen: (open) => set({ isOpen: open }),
}));

/* ── Mobile menu ───────────────────────────────────────────────────────────── */
interface MobileMenuState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const useMobileMenu = create<MobileMenuState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

/* ── Admin live bookings (unseen counter) ──────────────────────────────────── */
interface AdminNotifyState {
    newBookingsCount: number;
    bump: (n?: number) => void;
    markSeen: () => void;
}

export const useAdminNotifyStore = create<AdminNotifyState>((set) => ({
    newBookingsCount: 0,
    bump: (n = 1) => set((s) => ({ newBookingsCount: s.newBookingsCount + n })),
    markSeen: () => set({ newBookingsCount: 0 }),
}));

/* ── Booking store ─────────────────────────────────────────────────────────── */
import type { Service, Staff } from "./supabase/types";

export interface BookingState {
    step: number;
    serviceId: string | null;
    staffId: string | null;
    date: string | null;
    time: string | null;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    notes: string;
    services: Service[];
    staff: Staff[];
    setStep: (step: number) => void;
    setService: (id: string) => void;
    setStaff: (id: string | null) => void;
    setDate: (date: string) => void;
    setTime: (time: string) => void;
    setContact: (data: { name: string; phone: string; email: string }) => void;
    setNotes: (notes: string) => void;
    setCatalog: (services: Service[], staff: Staff[]) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    step: 0,
    serviceId: null,
    staffId: null,
    date: null,
    time: null,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
    services: [],
    staff: [],
    setStep: (step) => set({ step: Math.max(0, Math.min(2, step)) }),
    setService: (id) => set({ serviceId: id }),
    setStaff: (id) => set({ staffId: id }),
    setDate: (date) => set({ date }),
    setTime: (time) => set({ time }),
    setContact: (data) =>
        set({
            contactName: data.name,
            contactPhone: data.phone,
            contactEmail: data.email,
        }),
    setNotes: (notes) => set({ notes }),
    setCatalog: (services, staff) => set({ services, staff }),
    reset: () =>
        set({
            step: 0,
            serviceId: null,
            staffId: null,
            date: null,
            time: null,
            contactName: "",
            contactPhone: "",
            contactEmail: "",
            notes: "",
        }),
}));
