// Hair Rich · Supabase types (handwritten — keep in sync with migrations)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentSource = "app" | "admin" | "phone" | "walkin" | "widget";

export interface Service {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price_cents: number;
    duration_min: number;
    badge: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export interface Staff {
    id: string;
    name: string;
    slug: string;
    role: string;
    bio: string | null;
    avatar_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export interface Customer {
    id: string;
    user_id: string | null;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    is_guest: boolean;
    marketing_consent: boolean;
    birthdate: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Appointment {
    id: string;
    customer_id: string;
    staff_id: string | null;
    chair_id: string | null;
    start_at: string;
    end_at: string;
    status: AppointmentStatus;
    source: AppointmentSource;
    notes: string | null;
    total_cents: number;
    created_at: string;
    updated_at: string;
}

export interface PortfolioImage {
    id: string;
    storage_path: string;
    title: string;
    tag: string;
    alt_text: string | null;
    staff_id: string | null;
    service_id: string | null;
    is_featured: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export interface BookAppointmentResult {
    appointment_id: string;
    customer_id: string;
    start_at: string;
    end_at: string;
    total_cents: number;
}

export interface AvailableSlot {
    slot_time: string; // HH:MM:SS
    staff_id: string;
}

export type ProductCategory = "hair" | "beard" | "shave" | "tools" | "other";

export interface Product {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    category: ProductCategory;
    description: string | null;
    price_cents: number;
    stock: number;
    image_path: string | null;
    badge: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export type OrderStatus = "pending" | "ready" | "picked_up" | "cancelled" | "expired";

export interface CreateOrderResult {
    order_id: string;
    short_code: string;
    total_cents: number;
    pickup_deadline: string;
}

export interface SalonSettings {
    id: string;
    display_name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    lat: number | null;
    lng: number | null;
    booking_lead_time_min: number;
    booking_lead_time_max_days: number;
    cancel_min_hours: number;
    no_show_threshold: number;
    slot_step_min: number;
    onboarding_completed_at: string | null;
    updated_at: string;
}
