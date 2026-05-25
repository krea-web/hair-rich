import { test, expect } from "@playwright/test";

// Critical path #2: the /profilo area is gated by Supabase Auth. An
// unauthenticated visitor must be redirected to /login. This catches
// regressions in the ProfiloApp session-check effect and in the
// AuthGuard pattern.

test.describe("Customer profile auth gate", () => {
    test("/profilo redirects to /login when not authenticated", async ({ page }) => {
        await page.goto("/profilo");

        // The check runs client-side; allow up to 5s for the redirect.
        await page.waitForURL(/\/login(\/|\?|$)/, { timeout: 5000 });
        expect(page.url()).toMatch(/\/login/);
    });

    test("/login renders the auth form", async ({ page }) => {
        await page.goto("/login");
        // Page title or form should be present
        await expect(page.locator("form, [data-auth-form]").first()).toBeVisible({
            timeout: 5000,
        });
        // Email input should be reachable
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });
});
