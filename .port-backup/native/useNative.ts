/**
 * Circlo Mobile — native hooks
 * --------------------------------------------------------------
 * Thin React wrappers around Capacitor APIs so components can opt into
 * native behaviors without importing `@capacitor/*` directly.
 *
 * All hooks degrade gracefully on web: they return safe defaults and
 * never throw if a plugin is missing.
 */
import { useCallback, useEffect, useState } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { Preferences } from "@capacitor/preferences";
import { Network, type ConnectionStatus } from "@capacitor/network";
import { isNative, platform } from "./capacitor";

/** Returns true when running inside the native iOS/Android shell. */
export function usePlatform() {
  return { isNative, platform };
}

/** Fire a light haptic tap. Safe on web (no-op). */
export function useHaptics() {
  const tap = useCallback(async (style: "light" | "medium" | "heavy" = "light") => {
    if (!isNative) return;
    try {
      const impact =
        style === "heavy" ? ImpactStyle.Heavy : style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
      await Haptics.impact({ style: impact });
    } catch {
      /* swallow — haptics are cosmetic */
    }
  }, []);

  const success = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      /* noop */
    }
  }, []);

  const error = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      /* noop */
    }
  }, []);

  return { tap, success, error };
}

/**
 * Share via the native share sheet on iOS/Android, falls back to
 * `navigator.share` then a clipboard copy on web.
 */
export function useShare() {
  return useCallback(
    async (opts: { title?: string; text?: string; url?: string }) => {
      if (isNative) {
        try {
          await Share.share({
            title: opts.title,
            text: opts.text,
            url: opts.url,
            dialogTitle: opts.title ?? "Share",
          });
          return "native" as const;
        } catch {
          return "cancelled" as const;
        }
      }
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share(opts);
          return "web-share" as const;
        } catch {
          return "cancelled" as const;
        }
      }
      if (opts.url && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(opts.url);
        return "clipboard" as const;
      }
      return "unsupported" as const;
    },
    [],
  );
}

/**
 * Typed wrapper over Capacitor Preferences (native secure storage on
 * iOS/Android, localStorage on web).
 */
export const nativeStorage = {
  async get<T = string>(key: string): Promise<T | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return (value as unknown as T) ?? null;
    }
    const raw = localStorage.getItem(key);
    return raw === null ? null : (raw as unknown as T);
  },
  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      await Preferences.set({ key, value });
      return;
    }
    localStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isNative) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  },
};

/** Live network status. Emits updates when connectivity changes. */
export function useNetworkStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: "unknown",
  });

  useEffect(() => {
    let mounted = true;
    Network.getStatus()
      .then((s) => {
        if (mounted) setStatus(s);
      })
      .catch(() => {
        /* noop */
      });
    const listener = Network.addListener("networkStatusChange", (s) => {
      if (mounted) setStatus(s);
    });
    return () => {
      mounted = false;
      listener.then((l) => l.remove()).catch(() => undefined);
    };
  }, []);

  return status;
}
