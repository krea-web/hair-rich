# Sentry · error tracking for Edge Functions

A minimal, hand-rolled Sentry client lives at
`supabase/functions/_shared/sentry.ts`. Zero dependencies, uses Sentry's
public envelope API via plain `fetch`. When `SENTRY_DSN` is unset every
call is a silent no-op — functions still work in local dev without a
Sentry project.

## Setup

1. **Create a Sentry project**
   - Platform: JavaScript (no specific framework)
   - Copy the DSN. Format: `https://<key>@<host>/<project_id>`

2. **Add the secret** to the Edge Function environment
   ```bash
   supabase secrets set SENTRY_DSN=https://abc123@o4501.ingest.sentry.io/4502
   supabase secrets set SENTRY_ENV=production    # or staging, dev
   ```

3. **Re-deploy** functions you want covered
   ```bash
   supabase functions deploy notifications-router
   ```

## Coverage

Currently captured:

| Function | What it reports |
|---|---|
| `notifications-router` | Every uncaught exception in the dispatch path (catch at line ~682) |

The `captureException(err, ctx)` and `withSentry(name, handler)` helpers
are available to every Edge Function. Adopt incrementally by importing
from `../_shared/sentry.ts`.

## Usage patterns

### Manual capture inside a try/catch
```ts
import { captureException } from '../_shared/sentry.ts';

try {
  await riskyOperation();
} catch (err) {
  await captureException(err, {
    function_name: 'birthday-sender',
    tags: { phase: 'mint_coupon' },
    extra: { customer_id: c.id },
  });
  // Decide whether to retry, return, or rethrow
}
```

### Wrap an entire handler
```ts
import { withSentry } from '../_shared/sentry.ts';

serve(
  withSentry('package-expiry-reminders', async (req) => {
    // your code — uncaught throws become Sentry events
    // and the response becomes a clean 500
  }),
);
```

## What NOT to send

- **PII**: never put `customer.email`, `phone`, or full names in `extra`.
  Use the customer UUID instead.
- **Secrets**: API keys, JWTs, OpenAI prompts that contain user text.
- **Body content of customer messages**: even if anonymized.

The `tags` field is indexed and searchable — use it for routing
information (function name, phase, skill_key). The `extra` field is
visible in event details but not indexed.

## Alerts to configure in Sentry

Recommended thresholds:

- **Issue alert**: notify when a new issue appears (any function)
- **Issue alert**: notify when `function:notifications-router` issues
  exceed 5 events / 5 minutes — Router outage = customer messages dropped
- **Metric alert**: notify when error rate by function exceeds 1% over
  last 1h — signals a regression after deploy

Route alerts to the same Telegram chat the owner alerts use (or a
separate "ops" channel) via Sentry's webhook integration.

## Cost

Sentry free tier: 5k errors/month — more than enough for a single-salon
SaaS. If usage explodes, the most likely culprit is a broken cron retrying
on every tick — investigate before paying for a paid plan.
