// Hair Rich · Supabase query helpers (browser client)
import { createClient } from "./client";
import type {
    Service,
    Staff,
    PortfolioImage,
    BookAppointmentResult,
    AvailableSlot,
    Appointment,
} from "./types";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;

export function publicStorageUrl(path: string): string {
    return `${SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
}

interface TransformOpts {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "origin";
    resize?: "cover" | "contain" | "fill";
}

/**
 * Builds a Supabase Image Transformations URL for the public `portfolio`
 * bucket. Use this everywhere instead of `publicStorageUrl` for portfolio
 * images — file delivery drops ~90% on average (a 3MB iPhone JPEG renders
 * as a ~200KB WebP at width 800).
 */
export function portfolioImageUrl(path: string, opts: TransformOpts = {}): string {
    const params = new URLSearchParams();
    if (opts.width) params.set("width", String(opts.width));
    if (opts.height) params.set("height", String(opts.height));
    if (opts.quality) params.set("quality", String(opts.quality));
    if (opts.resize) params.set("resize", opts.resize);
    if (opts.format) params.set("format", opts.format);
    const qs = params.toString();
    return `${SUPABASE_URL}/storage/v1/render/image/public/portfolio/${path}${qs ? "?" + qs : ""}`;
}

/**
 * Responsive srcset for a portfolio image at 3 widths + WebP. Returns a
 * srcset string for the `<img srcset>` attribute. Pair with a `sizes`
 * attribute on the consumer side.
 */
export function portfolioImageSrcset(path: string, quality = 78): string {
    return [480, 800, 1280, 1920]
        .map(
            (w) =>
                `${portfolioImageUrl(path, { width: w, quality, format: "webp" })} ${w}w`
        )
        .join(", ");
}


export async function fetchServices(): Promise<Service[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Service[];
}

export async function fetchStaff(): Promise<Staff[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Staff[];
}

export async function fetchPortfolio(): Promise<PortfolioImage[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
    if (error) throw error;
    return (data ?? []) as PortfolioImage[];
}

export async function fetchAvailableSlots(params: {
    date: string;
    serviceId: string;
    staffId?: string | null;
    stepMin?: number;
}): Promise<AvailableSlot[]> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("fn_available_slots", {
        p_date: params.date,
        p_service_id: params.serviceId,
        p_staff_id: params.staffId ?? null,
        p_step_min: params.stepMin ?? 30,
    });
    if (error) throw error;
    return (data ?? []) as AvailableSlot[];
}

export interface BookAppointmentInput {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    serviceId: string;
    staffId: string | null;
    startAtISO: string;
    notes?: string;
    marketingConsent?: boolean;
    isFirstVisit?: boolean;
}

export async function bookAppointment(input: BookAppointmentInput): Promise<BookAppointmentResult> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("fn_book_appointment", {
        p_first_name: input.firstName,
        p_last_name: input.lastName,
        p_phone: input.phone,
        p_email: input.email ?? "",
        p_service_id: input.serviceId,
        p_staff_id: input.staffId,
        p_start_at: input.startAtISO,
        p_notes: input.notes ?? null,
        p_marketing_consent: input.marketingConsent ?? false,
        p_is_first_visit: input.isFirstVisit ?? false,
    });
    if (error) throw error;
    return data as BookAppointmentResult;
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("start_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Appointment[];
}
