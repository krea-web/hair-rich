/* ── Hair Rich · Format Utilities ──────────────────────────────────────────── */

export function formatPrice(cents: number): string {
    return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
    }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "full",
        timeZone: "Europe/Rome",
    }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateShort(date: string | Date): string {
    return new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "short",
        timeZone: "Europe/Rome",
    }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatTime(date: string | Date): string {
    return new Intl.DateTimeFormat("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Rome",
    }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatPhone(phone: string): string {
    // Format Italian phone: +39 333 123 4567
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("39") && cleaned.length === 12) {
        return `+39 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
}

export function formatOrderNumber(num: number): string {
    const year = new Date().getFullYear();
    return `HR-${year}-${String(num).padStart(4, "0")}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(" ");
}
