import { test, expect } from "@playwright/test";

// Critical path #1: the booking drawer opens, shows the 3 services and lets
// you click through Step 1 (service + barber). We stop short of confirming
// because that writes a real appointment row. The goal is to catch
// regressions in the drawer mount, zustand store, and Supabase service
// fetch.

test.describe("Public booking flow", () => {
    test("opens drawer from homepage CTA and reaches Step 1", async ({ page }) => {
        await page.goto("/");

        // The site has multiple "Prenota" CTAs; pick the first that opens
        // the drawer (sticky/floating ones first if present).
        const cta = page.getByRole("button", { name: /prenota/i }).first();
        await expect(cta).toBeVisible();
        await cta.click();

        // Drawer title appears
        await expect(
            page.getByText("Prenota il tuo appuntamento"),
        ).toBeVisible({ timeout: 5000 });

        // At least one of the three published services renders. Names are
        // configurable in the DB but at minimum a price tag should appear.
        await expect(page.locator("text=/€\\s?\\d+/").first()).toBeVisible();

        // Stepper shows the first step as active
        await expect(page.getByText(/Step 1/)).toBeVisible();
    });

    test("Esc closes the drawer", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: /prenota/i }).first().click();
        await expect(page.getByText("Prenota il tuo appuntamento")).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(page.getByText("Prenota il tuo appuntamento")).not.toBeVisible({
            timeout: 3000,
        });
    });
});
