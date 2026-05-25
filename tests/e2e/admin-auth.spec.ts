import { test, expect } from "@playwright/test";

// Critical path #3: every /admin/* route is gated by Supabase Auth + the
// `admins` table check. Unauthenticated visitors must NEVER see admin
// content; they redirect to /login. This catches both the session check
// in AdminApp and any new admin views that bypass it.

const ADMIN_ROUTES = [
    "/admin",
    "/admin/inbox",
    "/admin/funzionalita",
    "/admin/log",
    "/admin/salute",
];

test.describe("Admin auth gate", () => {
    for (const path of ADMIN_ROUTES) {
        test(`${path} redirects to /login when not authenticated`, async ({ page }) => {
            await page.goto(path);
            await page.waitForURL(/\/login(\/|\?|$)/, { timeout: 5000 });
            expect(page.url()).toMatch(/\/login/);
        });
    }
});
