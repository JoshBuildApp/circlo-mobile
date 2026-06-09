/**
 * usePushNotifications — native push via @capacitor/push-notifications.
 *
 * iOS: APNs token.  Android: FCM token.  Web: no-op (native-only here;
 * the website repo has its own Web Push implementation).
 *
 * The registered token is upserted into the shared `push_notification_tokens`
 * Supabase table so server-side senders (edge functions, admin dashboard)
 * can target users across devices.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications, type Token } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const isSupported = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

/**
 * localStorage key for the last token registered on this device. Read by
 * AuthContext.signOut so the row can be deleted BEFORE the session ends
 * (the delete needs the still-authenticated session to pass RLS).
 */
export const PUSH_TOKEN_STORAGE_KEY = "circlo_push_token";

type Permission = "default" | "granted" | "denied";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<Permission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const listenersRef = useRef<PluginListenerHandle[]>([]);

  // Remove only the listeners this hook attached (not removeAllListeners —
  // other parts of the app may listen for received/tapped notifications).
  const removeListeners = useCallback(async () => {
    const handles = listenersRef.current;
    listenersRef.current = [];
    await Promise.all(handles.map((h) => h.remove().catch(() => {})));
  }, []);

  // Check current permission at mount; drop listeners on unmount.
  useEffect(() => {
    if (!isSupported) return;
    PushNotifications.checkPermissions()
      .then((res) => setPermission(res.receive as Permission))
      .catch(() => setPermission("default"));
    return () => {
      void removeListeners();
    };
  }, [removeListeners]);

  const saveToken = useCallback(
    async (newToken: string) => {
      if (!user) return;
      await supabase.from("push_notification_tokens").upsert(
        {
          user_id: user.id,
          token: newToken,
          platform, // "ios" | "android"
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token" },
      );
      // Remember the device token so sign-out can delete the row even after
      // this hook is gone (see AuthContext.signOut).
      localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, newToken);
    },
    [user],
  );

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return;
    try {
      // Request permission (native dialog).
      const req = await PushNotifications.requestPermissions();
      setPermission(req.receive as Permission);
      if (req.receive !== "granted") return;

      // Attach listeners BEFORE register() — when permission was already
      // granted the cached token can fire immediately, and an event emitted
      // before the listener exists is silently dropped. Clear any handles
      // from a previous subscribe() so they don't accumulate.
      await removeListeners();
      listenersRef.current.push(
        await PushNotifications.addListener("registration", async (t: Token) => {
          setToken(t.value);
          await saveToken(t.value);
          setIsSubscribed(true);
        }),
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("[PushNotifications] registrationError", err);
        }),
      );

      // Register with APNs/FCM.
      await PushNotifications.register();
    } catch (err) {
      console.error("[PushNotifications] subscribe error:", err);
    }
  }, [user, saveToken, removeListeners]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return;
    try {
      // Capacitor doesn't expose an unregister — we just drop our DB row
      // so the server stops sending to this device.
      if (token) {
        await supabase
          .from("push_notification_tokens")
          .delete()
          .eq("user_id", user.id)
          .eq("token", token);
      }
      localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      await removeListeners();
      setIsSubscribed(false);
      setToken(null);
    } catch (err) {
      console.error("[PushNotifications] unsubscribe error:", err);
    }
  }, [user, token, removeListeners]);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe };
}
