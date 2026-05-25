# E2E tests

Playwright suite covering the three critical paths:

| File | Path | Why it matters |
|---|---|---|
| `booking-flow.spec.ts` | `/` | Drawer mounts, services fetch, Step 1 renders |
| `profile-auth.spec.ts` | `/profilo` | Unauth → `/login` redirect, login form renders |
| `admin-auth.spec.ts` | `/admin/*` | Every admin route gated |

## Local run

```bash
npm install                  # picks up @playwright/test from devDependencies
npm run test:e2e:install     # downloads Chromium (~100MB, one-time)

# Option A — let Playwright start the dev server
npm run test:e2e

# Option B — point at an already-running server
BASE_URL=http://localhost:4321 npm run test:e2e
```

## Adding tests

Drop new `*.spec.ts` files in this folder. Use:

- `page.goto(path)` with relative paths (baseURL is configured)
- `page.getByRole(...)` / `page.getByText(...)` rather than CSS selectors when possible
- `page.waitForURL(/regex/)` for client-side redirects (the project is SSG-only)

## What NOT to test here

- Anything that writes real DB rows (use a separate seed/teardown script if you need integration tests against a staging DB)
- Edge Function behaviour (those are tested via direct HTTP invocation, not browser)
- Email/Telegram delivery (mock the channels at the Router boundary)
