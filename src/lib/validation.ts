import { z } from "zod";

/* ── Booking ───────────────────────────────────────────────────────────────── */
export const bookingContactSchema = z.object({
    firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
    phone: z
        .string()
        .regex(/^\+?[0-9\s]{8,15}$/, "Numero di telefono non valido"),
    email: z.string().email("Email non valida").optional().or(z.literal("")),
    notes: z.string().max(500).optional(),
});

export type BookingContactData = z.infer<typeof bookingContactSchema>;

/* ── Auth ──────────────────────────────────────────────────────────────────── */
export const loginEmailSchema = z.object({
    email: z.string().email("Email non valida"),
});

export const loginPhoneSchema = z.object({
    phone: z
        .string()
        .regex(/^\+39[0-9]{9,10}$/, "Inserisci un numero italiano valido (+39...)"),
});

export const otpSchema = z.object({
    code: z.string().length(6, "Il codice deve essere di 6 cifre"),
});

export const registrationSchema = z.object({
    firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
    email: z.string().email("Email non valida"),
    phone: z.string().regex(/^\+39[0-9]{9,10}$/, "Numero non valido"),
    birthdate: z.string().optional(),
    marketingConsent: z.boolean().default(false),
});

export type RegistrationData = z.infer<typeof registrationSchema>;

/* ── Products / Cart ───────────────────────────────────────────────────────── */
export const checkoutSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().regex(/^\+?[0-9\s]{8,15}$/),
    email: z.string().email().optional().or(z.literal("")),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;

/* ── Admin ─────────────────────────────────────────────────────────────────── */
export const serviceFormSchema = z.object({
    nameIt: z.string().min(1, "Nome obbligatorio"),
    descriptionIt: z.string().optional(),
    durationMinutes: z.coerce.number().min(10).max(240),
    priceCents: z.coerce.number().min(0),
    category: z.enum(["taglio", "barba", "combo", "bambino", "altro"]),
    isActive: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;

export const staffFormSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    bioIt: z.string().optional(),
    specialtyTags: z.array(z.string()).default([]),
    yearsExperience: z.coerce.number().min(0).optional(),
    instagramUrl: z.string().url().optional().or(z.literal("")),
});

export type StaffFormData = z.infer<typeof staffFormSchema>;

export const productFormSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    descriptionShort: z.string().optional(),
    descriptionLong: z.string().optional(),
    priceCents: z.coerce.number().min(0),
    compareAtPriceCents: z.coerce.number().optional(),
    stockQuantity: z.coerce.number().min(0).default(0),
    lowStockThreshold: z.coerce.number().min(0).default(3),
    brand: z.string().optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export const couponFormSchema = z.object({
    code: z.string().min(3).max(20),
    name: z.string().optional(),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().min(1),
    validFrom: z.string(),
    validUntil: z.string().optional(),
    maxUses: z.coerce.number().optional(),
    isActive: z.boolean().default(true),
});

export type CouponFormData = z.infer<typeof couponFormSchema>;

export const siteContentSchema = z.object({
    key: z.string(),
    valueIt: z.string(),
    contentType: z.enum(["text", "html", "image_url", "json"]),
});

export type SiteContentData = z.infer<typeof siteContentSchema>;
