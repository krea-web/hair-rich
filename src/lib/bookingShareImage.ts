// Renders a 1080x1920 (Instagram story aspect) PNG for the share button on
// the booking-confirmed screen. Black background, gold accent, brand
// wordmark, booking metadata. Returns a File so it can be passed to
// navigator.share or downloaded.

interface Args {
    serviceName: string;
    dateLabel: string;
    timeLabel: string;
    staffName: string | null;
}

const W = 1080;
const H = 1920;

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export async function renderBookingShareImage(args: Args): Promise<File | null> {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1A1106");
    grad.addColorStop(0.5, "#0A0A0A");
    grad.addColorStop(1, "#000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Top accent halo
    const halo = ctx.createRadialGradient(W / 2, 280, 0, W / 2, 280, 700);
    halo.addColorStop(0, "rgba(212,165,116,0.35)");
    halo.addColorStop(1, "rgba(212,165,116,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, 700);

    // HAIR RICH wordmark
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#F5E6D3";
    ctx.font = "300 56px 'Cinzel', serif";
    ctx.letterSpacing = "12px";
    ctx.fillText("HAIR · RICH", W / 2, 220);

    // Eyebrow
    ctx.fillStyle = "#D4A574";
    ctx.font = "600 28px 'Manrope', sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("PRENOTAZIONE CONFERMATA", W / 2, 320);

    // Service name — big editorial
    ctx.fillStyle = "#F5E6D3";
    ctx.font = "italic 96px 'Italiana', serif";
    ctx.fillText(args.serviceName, W / 2, 720);

    // Date
    ctx.fillStyle = "#D4A574";
    ctx.font = "300 72px 'Cinzel', serif";
    ctx.fillText(args.dateLabel, W / 2, 950);

    // Time — biggest
    ctx.fillStyle = "#F5E6D3";
    ctx.font = "300 220px 'Cinzel', serif";
    ctx.fillText(args.timeLabel, W / 2, 1180);

    // Staff line (optional)
    if (args.staffName) {
        ctx.fillStyle = "#9E9E9E";
        ctx.font = "500 36px 'Manrope', sans-serif";
        ctx.fillText(`con ${args.staffName}`, W / 2, 1340);
    }

    // Bottom card with location
    const cardX = 80;
    const cardY = H - 380;
    const cardW = W - 160;
    const cardH = 200;
    ctx.fillStyle = "rgba(212,165,116,0.12)";
    roundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,165,116,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#D4A574";
    ctx.font = "600 24px 'Manrope', sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("HAIR RICH OLBIA", W / 2, cardY + 70);
    ctx.fillStyle = "#F5E6D3";
    ctx.font = "400 32px 'Manrope', sans-serif";
    ctx.fillText("Via Regina Elena 33/A", W / 2, cardY + 130);

    // Footer
    ctx.fillStyle = "#5E5E5E";
    ctx.font = "500 20px 'Manrope', sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("HAIRRICH.IT", W / 2, H - 80);

    return new Promise<File | null>((resolve) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) return resolve(null);
                resolve(new File([blob], "hair-rich-booking.png", { type: "image/png" }));
            },
            "image/png",
            0.92
        );
    });
}

/** Tries Web Share API first, falls back to a download anchor. */
export async function shareBookingImage(file: File, text: string): Promise<boolean> {
    try {
        if (typeof navigator !== "undefined" && (navigator as any).canShare) {
            const data: ShareData = { files: [file], text };
            if ((navigator as any).canShare(data)) {
                await (navigator as any).share(data);
                return true;
            }
        }
    } catch {
        // fall through to download
    }
    // Fallback: trigger download
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return false;
}
