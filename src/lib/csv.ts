// Hair Rich · CSV export helpers
// Tiny, dependency-free RFC 4180 writer + download trigger.

type Primitive = string | number | boolean | null | undefined;

interface ExportOptions<Row> {
    filename: string;
    columns: Array<{
        key: keyof Row | string;
        label: string;
        get?: (row: Row) => Primitive;
    }>;
    rows: Row[];
}

function escapeCell(value: Primitive): string {
    if (value == null) return "";
    const s = typeof value === "string" ? value : String(value);
    // Escape if contains separator, quote or newline
    if (/[",\r\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

/**
 * Build a CSV string from rows + column descriptors. Uses comma separator
 * and CRLF line endings (Excel-friendly). Adds a UTF-8 BOM so Excel on
 * Windows detects encoding without prompting.
 */
export function buildCsv<Row>(opts: ExportOptions<Row>): string {
    const header = opts.columns.map((c) => escapeCell(c.label)).join(",");
    const lines = opts.rows.map((row) =>
        opts.columns
            .map((c) => {
                const v = c.get ? c.get(row) : (row as any)[c.key as string];
                return escapeCell(v as Primitive);
            })
            .join(",")
    );
    return "﻿" + [header, ...lines].join("\r\n");
}

/**
 * Trigger a browser download for the given CSV content.
 */
export function downloadCsv<Row>(opts: ExportOptions<Row>): void {
    if (typeof document === "undefined") return;
    const csv = buildCsv(opts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = opts.filename.endsWith(".csv") ? opts.filename : `${opts.filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function todayStamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
