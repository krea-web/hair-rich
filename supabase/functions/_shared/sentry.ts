// Minimal Sentry client for Supabase Edge Functions (Deno).
//
// Why hand-rolled vs npm:@sentry/deno:
//   • No cold-start cost — pure fetch, ~80 lines, zero deps
//   • We only need captureException; not a full breadcrumb/scope system
//
// Setup:
//   1. Create a Sentry project (platform: javascript)
//   2. Copy the DSN
//   3. supabase secrets set SENTRY_DSN=https://<key>@<host>/<project_id>
//
// When SENTRY_DSN is unset, every call is a silent no-op so functions
// still work in local dev without a Sentry project.

interface DsnParts {
    host: string;        // sentry.io or self-hosted
    projectId: string;
    publicKey: string;
}

let cachedDsn: DsnParts | null | undefined = undefined;

function parseDsn(): DsnParts | null {
    if (cachedDsn !== undefined) return cachedDsn;
    const dsn = Deno.env.get("SENTRY_DSN");
    if (!dsn) {
        cachedDsn = null;
        return null;
    }
    try {
        const url = new URL(dsn);
        const publicKey = url.username;
        const projectId = url.pathname.replace(/^\/+/, "");
        if (!publicKey || !projectId) {
            cachedDsn = null;
            return null;
        }
        cachedDsn = {
            host: url.host,
            projectId,
            publicKey,
        };
        return cachedDsn;
    } catch {
        cachedDsn = null;
        return null;
    }
}

interface CaptureContext {
    function_name?: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: "error" | "warning" | "info" | "fatal";
}

export async function captureException(
    error: unknown,
    ctx: CaptureContext = {},
): Promise<void> {
    const dsn = parseDsn();
    if (!dsn) {
        // Still surface in logs even without Sentry
        console.error("[unreported]", ctx.function_name ?? "", error);
        return;
    }

    const err = error instanceof Error ? error : new Error(String(error));
    const eventId = crypto.randomUUID().replace(/-/g, "");
    const timestamp = Date.now() / 1000;

    const envelope = [
        JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
        JSON.stringify({ type: "event" }),
        JSON.stringify({
            event_id: eventId,
            timestamp,
            platform: "javascript",
            level: ctx.level ?? "error",
            environment: Deno.env.get("SENTRY_ENV") ?? "production",
            release: Deno.env.get("SENTRY_RELEASE") ?? undefined,
            server_name: ctx.function_name,
            tags: {
                function: ctx.function_name ?? "unknown",
                runtime: "deno-edge",
                ...(ctx.tags ?? {}),
            },
            extra: ctx.extra,
            exception: {
                values: [
                    {
                        type: err.name,
                        value: err.message,
                        stacktrace: err.stack ? { frames: parseStack(err.stack) } : undefined,
                    },
                ],
            },
        }),
    ].join("\n");

    const url = `https://${dsn.host}/api/${dsn.projectId}/envelope/`;
    try {
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-sentry-envelope",
                "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=hairrich-edge/1`,
            },
            body: envelope,
        });
    } catch (e) {
        console.warn("[sentry] envelope send failed:", e);
    }
}

function parseStack(stack: string): Array<{ filename: string; function: string; lineno: number }> {
    return stack
        .split("\n")
        .slice(1, 21)
        .map((line) => {
            const m = line.match(/at (.+?) \((.+):(\d+):\d+\)/) || line.match(/at (.+):(\d+):\d+/);
            if (!m) return null;
            const fn = m.length === 4 ? m[1] : "anonymous";
            const file = m.length === 4 ? m[2] : m[1];
            const lineno = parseInt(m.length === 4 ? m[3] : m[2], 10);
            return { filename: file, function: fn, lineno };
        })
        .filter((x): x is { filename: string; function: string; lineno: number } => x !== null);
}

// Wrap a Deno HTTP handler so every uncaught exception is captured AND
// the request still returns a clean 500 instead of crashing the isolate.
export function withSentry(
    functionName: string,
    handler: (req: Request) => Promise<Response> | Response,
): (req: Request) => Promise<Response> {
    return async (req: Request) => {
        try {
            return await handler(req);
        } catch (err) {
            await captureException(err, {
                function_name: functionName,
                extra: { url: req.url, method: req.method },
            });
            return new Response(
                JSON.stringify({ ok: false, reason: "internal_error" }),
                { status: 500, headers: { "Content-Type": "application/json" } },
            );
        }
    };
}
