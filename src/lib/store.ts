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
    /** Add an item. `qty` defaults to 1 — pass any positive integer to add
     *  multiple units in one shot (e.g. from the product detail drawer). */
    addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
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

    addItem: (item, qty = 1) =>
        set((state) => {
            const add = Math.max(1, Math.floor(qty));
            const existing = state.items.find((i) => i.productId === item.productId);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.productId === item.productId
                            ? { ...i, quantity: i.quantity + add }
                            : i
                    ),
                };
            }
            return { items: [...state.items, { ...item, quantity: add }] };
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

/* ── Product detail drawer (bottom sheet, mirror of booking drawer) ────────── */
interface ProductDrawerProduct {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    category: string;
    description: string | null;
    price_cents: number;
    stock: number;
    image_path: string | null;
    badge: string | null;
}

interface ProductDrawerState {
    isOpen: boolean;
    product: ProductDrawerProduct | null;
    open: (product: ProductDrawerProduct) => void;
    close: () => void;
    setOpen: (open: boolean) => void;
}

export const useProductDrawer = create<ProductDrawerState>((set) => ({
    isOpen: false,
    product: null,
    open: (product) => set({ isOpen: true, product }),
    close: () => set({ isOpen: false }),
    setOpen: (open) => set((s) => ({ isOpen: open, product: open ? s.product : null })),
}));

/* ── Favorites (persisted) ─────────────────────────────────────────────────── */
const FAV_STORAGE_KEY = "hairrich.favorites";

interface FavoritesState {
    ids: string[];
    toggle: (productId: string) => void;
    has: (productId: string) => boolean;
    clear: () => void;
}

function loadFavorites(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(FAV_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
}

function saveFavorites(ids: string[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(ids));
    } catch {
        /* quota exceeded — fail silently */
    }
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    ids: loadFavorites(),
    toggle: (productId) =>
        set((s) => {
            const next = s.ids.includes(productId)
                ? s.ids.filter((x) => x !== productId)
                : [...s.ids, productId];
            saveFavorites(next);
            return { ids: next };
        }),
    has: (productId) => get().ids.includes(productId),
    clear: () => {
        saveFavorites([]);
        set({ ids: [] });
    },
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

/* ── Admin inbox unread counter ─────────────────────────────────────────────── */
interface AdminInboxState {
    unreadCount: number;
    setUnreadCount: (n: number) => void;
    incUnread: (n?: number) => void;
}

export const useAdminInboxStore = create<AdminInboxState>((set) => ({
    unreadCount: 0,
    setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
    incUnread: (n = 1) => set((s) => ({ unreadCount: s.unreadCount + n })),
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
