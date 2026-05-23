// Minimal Mustache-style template renderer for cms_blocks values.
//
// Supports only `{{var}}` substitution — no logic, no conditionals, no
// partials. We trade flexibility for security (no eval-style holes) and
// keep the bundle tiny. Variables resolve from a flat key/value bag;
// dotted keys (e.g. `customer.first_name`) are also supported by walking
// the object.

export interface RenderContext {
  [key: string]: unknown;
}

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function resolve(ctx: RenderContext, path: string): unknown {
  if (Object.prototype.hasOwnProperty.call(ctx, path)) return ctx[path];
  const parts = path.split('.');
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function renderTemplate(template: string, ctx: RenderContext): string {
  return template.replace(TOKEN_RE, (_match, path) => {
    const v = resolve(ctx, path);
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

// Quick-and-dirty markdown → plain-text for email text/* fallback.
export function markdownToText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/^#+\s+/gm, '');
}

// Quick markdown → HTML for email html body.
export function markdownToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const withLinks = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#0a66c2;text-decoration:none">$1</a>',
  );
  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const withCode = withBold.replace(/`([^`]+)`/g, '<code style="background:#f4f4f4;padding:2px 4px;border-radius:3px">$1</code>');
  const paragraphs = withCode
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#1a1a1a">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">${paragraphs}</body></html>`;
}

// Telegram MarkdownV2 requires escaping a long list of reserved characters
// in non-formatting positions. The cms_blocks tmpl_telegram_* templates
// already use the formatting characters intentionally — we only escape
// dynamic VALUES coming from the render context, not the template itself.
// To keep this simple and bullet-proof, we render with `parse_mode=Markdown`
// (the legacy permissive parser) and only escape the values lightly.
const TG_LEGACY_RESERVED = /([_*`[])/g;
export function escapeTelegramValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(TG_LEGACY_RESERVED, '\\$1');
}

export function renderTelegram(template: string, ctx: RenderContext): string {
  const escapedCtx: RenderContext = {};
  for (const [k, v] of Object.entries(ctx)) escapedCtx[k] = escapeTelegramValue(v);
  return renderTemplate(template, escapedCtx);
}
