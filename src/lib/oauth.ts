/**
 * Shared OAuth provider sign-in helper.
 *
 * On native (iOS Capacitor): uses skipBrowserRedirect + Capacitor Browser
 * plugin so the system Safari handles the round-trip and the deep-link
 * listener in src/native/capacitor.ts routes circlo://home?code=... back
 * into the SPA. Supabase's detectSessionInUrl exchanges the code.
 *
 * On web: default redirect-the-browser behaviour.
 */
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { authRedirect } from "@/lib/platform";

const isNative = Capacitor.isNativePlatform();

export type OAuthProvider = "google" | "apple";

export async function signInWithProvider(
  provider: OAuthProvider,
  redirectPath: string = "/home",
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: authRedirect(redirectPath),
        skipBrowserRedirect: isNative,
      },
    });
    if (error) return { ok: false, reason: error.message };
    if (isNative && data?.url) {
      await Browser.open({ url: data.url, presentationStyle: "popover" });
    }
    return { ok: true };
  } catch (err) {
    console.error("[signInWithProvider]", err);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Sign-in failed",
    };
  }
}
