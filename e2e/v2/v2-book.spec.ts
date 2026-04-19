import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke coverage for the Book landing page + raised center Book FAB.
 *
 * The feature flag + player role are primed via addInitScript so /v2/book
 * renders without needing a real auth session.
 */

async function enableV2Player(page: Page) {
  await page.context().addInitScript(() => {
    window.localStorage.setItem("circlo:v2_enabled", "true");
    window.localStorage.setItem("circlo:v2_role", "player");
  });
}

async function enableV2Coach(page: Page) {
  await page.context().addInitScript(() => {
    window.localStorage.setItem("circlo:v2_enabled", "true");
    window.localStorage.setItem("circlo:v2_role", "coach");
  });
}

test.describe("v2 Book landing page", () => {
  test.beforeEach(async ({ page }) => {
    await enableV2Player(page);
  });

  test("/v2/book renders the booking hub with hero + quick actions", async ({
    page,
  }) => {
    await page.goto("/v2/book");
    await expect(
      page.getByRole("heading", { name: /Train with the right coach/i }),
    ).toBeVisible();
    await expect(page.getByText(/Ready when you are/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Quick book/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Browse coaches/i }),
    ).toBeVisible();
  });

  test("center Book FAB in tab bar navigates to /v2/book", async ({ page }) => {
    await page.goto("/v2/home");
    const fab = page.getByRole("link", { name: /Book a session/i });
    await expect(fab).toBeVisible();
    await fab.click();
    await expect(page).toHaveURL(/\/v2\/book$/);
    await expect(
      page.getByRole("heading", { name: /Train with the right coach/i }),
    ).toBeVisible();
  });

  test("Browse coaches tile routes to Discover", async ({ page }) => {
    await page.goto("/v2/book");
    await page.getByRole("button", { name: /Browse coaches/i }).click();
    await expect(page).toHaveURL(/\/v2\/discover/);
  });

  test("Quick book tile routes into the flow with prefill=quick", async ({
    page,
  }) => {
    await page.goto("/v2/book");
    await page.getByRole("button", { name: /Quick book/i }).click();
    await expect(page).toHaveURL(/\/v2\/book\/.+\?prefill=quick/);
  });
});

test.describe("v2 Book FAB — coach mode isolation", () => {
  test("coach tab bar does NOT render the Book FAB", async ({ page }) => {
    await enableV2Coach(page);
    await page.goto("/v2/coach-me");
    // The Book FAB carries aria-label="Book a session"; coach mode must
    // not render it because coaches don't self-book sessions.
    await expect(
      page.getByRole("link", { name: /Book a session/i }),
    ).toHaveCount(0);
  });
});
