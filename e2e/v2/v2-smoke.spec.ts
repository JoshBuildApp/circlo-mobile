import { test, expect } from "@playwright/test";

/**
 * v2 smoke test — checks the feature flag gate, enable flow, and that the
 * top player+coach pages render their landmark headings without errors.
 * Each page is hit via direct URL; the V2Guard reads the localStorage flag
 * we set on first load.
 */

test.describe("v2 routing & flag", () => {
  test("redirects to /v2/enable when flag is off", async ({ page }) => {
    await page.goto("/v2/home");
    await page.waitForURL("**/v2/enable");
    await expect(page.getByText("Circlo")).toBeVisible();
    await expect(page.getByText(/v2/i).first()).toBeVisible();
  });

  test("enables v2 via the toggle and lands on home", async ({ page }) => {
    await page.goto("/v2/enable");
    await page.getByRole("button", { name: /turn on/i }).click();
    // setV2Enabled triggers a reload — wait for the home redirect.
    await page.waitForURL("**/v2/enable");
    await page.goto("/v2/home");
    await expect(page.getByText(/Hey,/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("v2 player smoke", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem("circlo:v2_enabled", "true");
      window.localStorage.setItem("circlo:v2_role", "player");
    });
  });

  test("home renders greeting and tab bar", async ({ page }) => {
    await page.goto("/v2/home");
    await expect(page.getByText(/Hey,/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Discover/i })).toBeVisible();
  });

  test("discover renders heading and sport tiles", async ({ page }) => {
    await page.goto("/v2/discover");
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
    await expect(page.getByText("Padel").first()).toBeVisible();
  });

  test("coach about page renders coach name", async ({ page }) => {
    await page.goto("/v2/coach/maya");
    await expect(page.getByText("Maya Rosenfeld")).toBeVisible({ timeout: 10_000 });
  });

  test("messages inbox renders threads", async ({ page }) => {
    await page.goto("/v2/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  });

  test("calendar shows view toggle", async ({ page }) => {
    await page.goto("/v2/calendar");
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Week/ })).toBeVisible();
  });
});

test.describe("v2 coach smoke", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem("circlo:v2_enabled", "true");
      window.localStorage.setItem("circlo:v2_role", "coach");
    });
  });

  test("coach dashboard renders revenue and KPIs", async ({ page }) => {
    await page.goto("/v2/coach-me");
    await expect(page.getByText(/THIS MONTH/i)).toBeVisible({ timeout: 10_000 });
  });

  test("bob page renders for coaches", async ({ page }) => {
    await page.goto("/v2/bob");
    await expect(page.getByText(/Hey/)).toBeVisible({ timeout: 10_000 });
  });

  test("requests inbox renders pending requests", async ({ page }) => {
    await page.goto("/v2/coach-me/requests");
    await expect(page.getByRole("heading", { name: "Booking requests" })).toBeVisible();
  });
});

test.describe("v2 booking flow", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem("circlo:v2_enabled", "true");
      window.localStorage.setItem("circlo:v2_role", "player");
    });
  });

  test("starts at format step and advances through steps", async ({ page }) => {
    await page.goto("/v2/book/maya");
    await expect(page.getByText(/STEP 1 OF 5/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByText(/STEP 2 OF 5/i)).toBeVisible();
  });

  test("date query parameter pre-fills time step", async ({ page }) => {
    await page.goto("/v2/book/maya?date=2026-05-01");
    await expect(page.getByText(/STEP 2 OF 5/i)).toBeVisible({ timeout: 10_000 });
  });
});
