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
