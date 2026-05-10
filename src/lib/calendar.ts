/**
 * Generatori .ics + Google Calendar / Apple Calendar URL per export prenotazioni.
 */

interface Booking {
    title: string;
    description: string;
    location: string;
    start: Date;
    durationMinutes: number;
}

function pad(n: number): string {
    return n.toString().padStart(2, "0");
}

/** ISO senza separatori in UTC: YYYYMMDDTHHMMSSZ */
function toICSDate(d: Date): string {
    return (
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        "T" +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        "Z"
    );
}

function escapeICS(s: string): string {
    return s
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

export function buildICS(b: Booking): string {
    const end = new Date(b.start.getTime() + b.durationMinutes * 60 * 1000);
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@hairricholbia.com`;
    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hair Rich Olbia//Booking//IT",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(b.start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${escapeICS(b.title)}`,
        `DESCRIPTION:${escapeICS(b.description)}`,
        `LOCATION:${escapeICS(b.location)}`,
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Reminder",
        "TRIGGER:-PT24H",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
}

/** Avvia download di un .ics dato un Booking. */
export function downloadICS(b: Booking, filename = "hairrich-prenotazione.ics") {
    if (typeof document === "undefined") return;
    const blob = new Blob([buildICS(b)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** URL Google Calendar add-event prefilled. */
export function googleCalendarUrl(b: Booking): string {
    const end = new Date(b.start.getTime() + b.durationMinutes * 60 * 1000);
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: b.title,
        dates: `${toICSDate(b.start)}/${toICSDate(end)}`,
        details: b.description,
        location: b.location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** URL Outlook (web) add-event prefilled — alternativa cross-platform. */
export function outlookCalendarUrl(b: Booking): string {
    const end = new Date(b.start.getTime() + b.durationMinutes * 60 * 1000);
    const params = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        startdt: b.start.toISOString(),
        enddt: end.toISOString(),
        subject: b.title,
        body: b.description,
        location: b.location,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
