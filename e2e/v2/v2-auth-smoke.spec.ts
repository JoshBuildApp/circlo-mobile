import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke coverage for the new /v2/auth/* shared-element onboarding flow.
 *
 * Each test hits a route directly, verifies the Circlo ring rendered, and
 * checks a landmark element unique to that screen. We don't assert on the
 * ring's animation timing — Playwright's fake clock isn't wired here — but
 * we do verify the ring's variant + opening state flip correctly.
 *
 * The flow is gated by the V2 feature flag + SignupContext's forward-only
 * step gate (see SignupOutlet). Each suite primes localStorage accordingly.
 */

async function enableV2(page: Page, role: "player" | "coach" = "player") {
  await page.context().addInitScript((r) => {
    window.localStorage.setItem("circlo:v2_enabled", "true");
    window.localStorage.setItem("circlo:v2_role", r);
  }, role);
}

test.describe("v2 auth flow — welcome + login", () => {
  test.beforeEach(async ({ page }) => {
    await enableV2(page);
  });

  test("/v2/auth resolves to /welcome and renders the splash", async ({
    page,
  }) => {
    await page.goto("/v2/auth");
    await page.waitForURL("**/v2/auth/welcome");
    await expect(page.getByText("circlo", { exact: true })).toBeVisible();
    await expect(page.getByText(/FIND YOUR CIRCLE/i)).toBeVisible();
    // Ring exists and is in the welcome variant.
    const ring = page.locator('[data-variant="welcome"]').first();
    await expect(ring).toBeVisible();
  });

  test("welcome → login navigation swaps the ring variant", async ({
    page,
  }) => {
    await page.goto("/v2/auth/welcome");
    await page.getByRole("link", { name: /log in/i }).click();
    await page.waitForURL("**/v2/auth/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('[data-variant="login"]').first()).toBeVisible();
  });

  test("login page has email + password fields and apple/google buttons", async ({
    page,
  }) => {
    await page.goto("/v2/auth/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with apple/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });
});

test.describe("v2 auth flow — signup step gating", () => {
  test.beforeEach(async ({ page }) => {
    await enableV2(page);
  });

  test("/signup redirects to /signup/role", async ({ page }) => {
    await page.goto("/v2/auth/signup");
    await page.waitForURL("**/v2/auth/signup/role");
    await expect(
      page.getByRole("heading", { name: /who are you on Circlo/i }),
    ).toBeVisible();
  });

  test("landing on /sports without a role bounces to /role", async ({
    page,
  }) => {
    await page.goto("/v2/auth/signup/sports");
    await page.waitForURL("**/v2/auth/signup/role");
  });

  test("landing on /credentials without a sport bounces to the earliest gap", async ({
    page,
  }) => {
    await page.goto("/v2/auth/signup/credentials");
    // No role yet → bounced all the way to /role.
    await page.waitForURL("**/v2/auth/signup/role");
  });

  test("landing on /verify without full credentials bounces backward", async ({
    page,
  }) => {
    await page.goto("/v2/auth/signup/verify");
    await page.waitForURL("**/v2/auth/signup/role");
  });
});

test.describe("v2 auth flow — full happy path (player)", () => {
  test.beforeEach(async ({ page }) => {
    await enableV2(page, "player");
  });

  test("click through Role → Sports → Credentials → Verify → Success", async ({
    page,
  }) => {
    await page.goto("/v2/auth/signup/role");

    // Role: select player, continue.
    await page.getByRole("button", { name: /i'm a player/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL("**/v2/auth/signup/sports");
    await expect(
      page.getByRole("heading", { name: /what sports are you into/i }),
    ).toBeVisible();

    // Sports: pick one, continue.
    await page.getByRole("button", { name: /padel/i }).click();
    await page
      .getByRole("button", { name: /continue \u00B7 1 sport/i })
      .click();
    await page.waitForURL("**/v2/auth/signup/credentials");

    // Credentials: fill all four fields, continue.
    await page.getByLabel(/full name/i).fill("Test User");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByLabel(/confirm password/i).fill("Password123!");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL("**/v2/auth/signup/verify");

    // Verify: enter the OTP. onComplete auto-navs to /success.
    const digits = page.locator(".circlo-otp-digit");
    for (let i = 0; i < 6; i++) {
      await digits.nth(i).pressSequentially(String(i));
    }
    await page.waitForURL("**/v2/auth/signup/success");

    // Success: greets the user + shows a primary CTA. Ring should be in
    // the success variant; the opening class flips after ~700ms.
    await expect(
      page.getByRole("heading", { name: /you're in the circle/i }).or(
        page.getByText(/you're in the circle/i),
      ),
    ).toBeVisible();
    const ring = page.locator('[data-variant="success"]').first();
    await expect(ring).toBeVisible();
    await expect(ring).toHaveClass(/circlo-ring--opening/, { timeout: 3000 });
  });
});

test.describe("v2 auth flow — coach copy variant", () => {
  test.beforeEach(async ({ page }) => {
    await enableV2(page, "coach");
  });

  test("coach role flips sports copy to 'what do you coach?'", async ({
    page,
  }) => {
    await page.goto("/v2/auth/signup/role");
    await page.getByRole("button", { name: /i'm a coach/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL("**/v2/auth/signup/sports");
    await expect(
      page.getByRole("heading", { name: /what do you coach/i }),
    ).toBeVisible();
  });
});
