// Helper fuso orario centrale (Europe/Rome), DST-aware.
//
// Motivo: il sito gira in browser con fuso arbitrario e il DB salva timestamptz.
// Usare `d.toISOString().split("T")[0]` (UTC) per la stringa-giorno spostava il
// giorno (venerdì letto come giovedì nelle ore serali) e hardcodare `+02:00`
// sbagliava di un'ora in inverno (ora solare). Questi helper usano sempre il
// vero offset di Europe/Rome all'istante considerato.

const TZ = "Europe/Rome";

/** Stringa "YYYY-MM-DD" della data `d` letta nel fuso Europe/Rome. */
export function romeDateStr(d: Date): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Offset (in minuti) di Europe/Rome rispetto a UTC all'istante `at` (DST-aware). */
function tzOffsetMin(at: Date): number {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    const p: Record<string, string> = {};
    for (const part of dtf.formatToParts(at)) p[part.type] = part.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return (asUTC - at.getTime()) / 60000;
}

/** "YYYY-MM-DD" + "HH:MM" (ora di Rome) → istante esatto come Date (interno UTC). */
export function romeToUTCDate(dateStr: string, time: string): Date {
    const naive = new Date(`${dateStr}T${time}:00Z`);
    const off = tzOffsetMin(naive);
    return new Date(naive.getTime() - off * 60000);
}

/** "YYYY-MM-DD" + "HH:MM" (ora di Rome) → ISO string UTC. */
export function romeToUTC(dateStr: string, time: string): string {
    return romeToUTCDate(dateStr, time).toISOString();
}

/** Aggiunge `days` giorni a una stringa "YYYY-MM-DD" restituendo il giorno Rome
 *  corretto (preserva l'ora-muro a cavallo dei cambi DST). */
export function addDaysStr(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return romeDateStr(d);
}

/** Formatta un istante (Date) nel fuso Europe/Rome con le opzioni Intl date. */
export function formatRome(d: Date, opts: Intl.DateTimeFormatOptions, locale = "it-IT"): string {
    return new Intl.DateTimeFormat(locale, { timeZone: TZ, ...opts }).format(d);
}
