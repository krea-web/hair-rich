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

export async function fetchDayDensity(date: string, serviceId: string): Promise<number> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("fn_day_density", {
        p_date: date,
        p_service_id: serviceId,
    });
    if (error) throw error;
    const n = typeof data === "number" ? data : Number(data);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
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
    referenceImagePaths?: string[];
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
        p_reference_image_paths: input.referenceImagePaths ?? [],
    });
    if (error) throw error;
    return data as BookAppointmentResult;
}

/**
 * Upload a reference photo to the private client-references bucket. Returns
 * the storage path on success. Used by the booking wizard to attach photos
 * of the desired haircut/style to the appointment before submitting.
 */
export async function uploadReferenceImage(file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(ext) ? ext : "jpg";
    // Random path per file — no collision worries even within a single submission
    const path = `pending/${crypto.randomUUID()}.${safeExt}`;
    const { error } = await supabase.storage
        .from("client-references")
        .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || `image/${safeExt}`,
        });
    if (error) throw error;
    return path;
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

export interface AppointmentPhoto {
    id: string;
    appointment_id: string;
    storage_path: string;
    caption: string | null;
    sort_order: number;
    created_at: string;
    signed_url: string;
}

/**
 * Fetch all photos linked to the given appointments + signed URLs (the
 * `appointment-photos` bucket is private, so direct public URLs would 403).
 * Signed URLs valid for 1h.
 */
export async function fetchAppointmentPhotos(
    appointmentIds: string[]
): Promise<AppointmentPhoto[]> {
    if (appointmentIds.length === 0) return [];
    const supabase = createClient();
    const { data, error } = await supabase
        .from("appointment_photos")
        .select("*")
        .in("appointment_id", appointmentIds)
        .order("sort_order");
    if (error) throw error;
    const rows = (data ?? []) as Omit<AppointmentPhoto, "signed_url">[];

    // Batch-sign all storage paths in one round-trip
    const paths = rows.map((r) => r.storage_path);
    if (paths.length === 0) return [];
    const { data: signedData, error: signErr } = await supabase
        .storage
        .from("appointment-photos")
        .createSignedUrls(paths, 60 * 60); // 1h
    if (signErr) throw signErr;
    const signedByPath = new Map<string, string>();
    (signedData ?? []).forEach((s) => {
        if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
    });

    return rows.map((r) => ({
        ...r,
        signed_url: signedByPath.get(r.storage_path) ?? "",
    }));
}
