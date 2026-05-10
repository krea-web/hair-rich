/* ── Hair Rich · Domain Types ──────────────────────────────────────────────── */

export type UserRole = "client" | "staff" | "owner";
export type ServiceCategory = "taglio" | "barba" | "combo" | "bambino" | "altro";
export type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentSource = "web" | "walk_in" | "whatsapp" | "phone" | "admin";
export type OrderStatus = "pending" | "ready_for_pickup" | "picked_up" | "cancelled" | "expired";
export type ReferralStatus = "pending" | "registered" | "first_visit_done" | "validated" | "rewarded" | "rejected_fraud";

export interface Salon {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    timezone: string;
    settings: Record<string, unknown>;
}

export interface User {
    id: string;
    salonId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    roles: UserRole[];
    avatarUrl: string | null;
    referralCode: string | null;
    reliabilityScore: number;
    isBlacklistedUntil: string | null;
    marketingConsent: boolean;
    createdAt: string;
}

export interface StaffProfile {
    id: string;
    userId: string;
    bioIt: string | null;
    specialtyTags: string[];
    yearsExperience: number | null;
    instagramUrl: string | null;
    isActive: boolean;
    displayOrder: number;
    coverPhotoUrl: string | null;
    user?: User;
}

export interface Service {
    id: string;
    salonId: string;
    nameIt: string;
    descriptionIt: string | null;
    durationMinutes: number;
    priceCents: number;
    isActive: boolean;
    displayOrder: number;
    category: ServiceCategory;
    serviceImageUrl: string | null;
}

export interface Chair {
    id: string;
    salonId: string;
    name: string;
    isActive: boolean;
    displayOrder: number;
}

export interface Appointment {
    id: string;
    salonId: string;
    clientUserId: string | null;
    staffId: string;
    chairId: string;
    serviceId: string;
    startAt: string;
    endAt: string;
    status: AppointmentStatus;
    source: AppointmentSource;
    notesClient: string | null;
    notesStaff: string | null;
    walkInName: string | null;
    walkInPhone: string | null;
    service?: Service;
    staff?: User;
    client?: User;
}

export interface Product {
    id: string;
    salonId: string;
    name: string;
    slug: string;
    descriptionShort: string | null;
    descriptionLong: string | null;
    priceCents: number;
    compareAtPriceCents: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    isActive: boolean;
    isFeatured: boolean;
    brand: string | null;
    images: ProductImage[];
}

export interface ProductImage {
    id: string;
    productId: string;
    imageUrl: string;
    altText: string | null;
    displayOrder: number;
    isPrimary: boolean;
}

export interface Order {
    id: string;
    salonId: string;
    clientUserId: string | null;
    orderNumber: string;
    status: OrderStatus;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    pickupDeadline: string;
    pickupAt: string | null;
    notes: string | null;
    items?: OrderItem[];
    client?: User;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    productSnapshot: {
        name: string;
        imageUrl?: string;
    };
}

export interface Review {
    id: string;
    appointmentId: string | null;
    clientUserId: string | null;
    staffId: string | null;
    rating: number;
    text: string | null;
    isPublic: boolean;
    isApproved: boolean;
    createdAt: string;
    client?: User;
    staff?: User;
}

export interface Achievement {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    criteria: Record<string, unknown>;
    rewardCredits: number;
    isActive: boolean;
}

export interface Referral {
    id: string;
    inviterUserId: string;
    inviteeUserId: string | null;
    referralCode: string;
    status: ReferralStatus;
    validatedAt: string | null;
    createdAt: string;
}

export interface GalleryItem {
    id: string;
    photoUrl: string;
    caption: string | null;
    linkedServiceId: string | null;
    linkedStaffId: string | null;
    isActive: boolean;
}

export interface Trend {
    id: string;
    name: string;
    description: string | null;
    referenceImageUrl: string | null;
    linkedServiceId: string | null;
    popularityScore: number;
    isActive: boolean;
    isPendingApproval: boolean;
    createdByAi: boolean;
}

export interface SiteContent {
    id: string;
    key: string;
    contentType: "text" | "html" | "image_url" | "json";
    valueIt: string;
}

export interface Coupon {
    id: string;
    code: string;
    name: string | null;
    discountType: "percent" | "fixed";
    discountValue: number;
    validFrom: string;
    validUntil: string | null;
    maxUses: number | null;
    currentUses: number;
    isActive: boolean;
}

export interface GiftCard {
    id: string;
    code: string;
    valueCents: number;
    balanceCents: number;
    recipientName: string | null;
    message: string | null;
    expiresAt: string | null;
    isActive: boolean;
}

export interface Campaign {
    id: string;
    name: string;
    channel: "email" | "whatsapp" | "both";
    audienceFilter: Record<string, unknown>;
    subject: string | null;
    bodyHtml: string | null;
    scheduledAt: string | null;
    sentAt: string | null;
    status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
}

export interface TimeSlot {
    startAt: string;
    endAt: string;
    staffId: string;
}
