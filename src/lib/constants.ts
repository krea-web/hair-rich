/* ── Hair Rich · Constants ──────────────────────────────────────────────────── */

export const SALON_ID = "00000000-0000-0000-0000-000000000001";

export const SITE = {
    name: "Hair Rich",
    city: "Olbia",
    address: "Via Regina Elena 33/A, Olbia",
    phone: "0789 1891049",
    email: "info@hairrich.it",
    timezone: "Europe/Rome",
    url: import.meta.env.PUBLIC_SITE_URL ?? "https://www.hairricholbia.com",
    instagram: "https://www.instagram.com/hair_rich_/",
} as const;

export const BOOKING = {
    MIN_LEAD_MINUTES: 60,
    MAX_ADVANCE_DAYS: 60,
    CANCELLATION_POLICY_HOURS: 2,
    SLOT_STEP_MINUTES: 30,
} as const;

export const ORDERS = {
    PICKUP_DEADLINE_DAYS: 7,
    MAX_FEATURED_PRODUCTS: 8,
} as const;

export const AUTH = {
    SESSION_DURATION_DAYS: 30,
    OTP_TTL_MINUTES: 10,
    OTP_COOLDOWN_SECONDS: 60,
} as const;

export const STORAGE_BUCKETS = {
    SALON_PHOTOS: "salon-photos",
    CLIENT_PHOTOS: "client-photos",
    PRODUCTS: "products",
} as const;
