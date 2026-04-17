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
import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, type Token } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const isSupported = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

type Permission = "default" | "granted" | "denied";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<Permission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Check current permission at mount.
  useEffect(() => {
    if (!isSupported) return;
    PushNotifications.checkPermissions()
      .then((res) => setPermission(res.receive as Permission))
      .catch(() => setPermission("default"));
  }, []);

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

      // Register with APNs/FCM.
      await PushNotifications.register();

      // Listen once for the registration token.
      const tokenListener = await PushNotifications.addListener(
        "registration",
        async (t: Token) => {
          setToken(t.value);
          await saveToken(t.value);
          setIsSubscribed(true);
          await tokenListener.remove();
        },
      );

      // Listen for registration errors.
      await PushNotifications.addListener("registrationError", (err) => {
        console.error("[PushNotifications] registrationError", err);
      });
    } catch (err) {
      console.error("[PushNotifications] subscribe error:", err);
    }
  }, [user, saveToken]);

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
      await PushNotifications.removeAllListeners();
      setIsSubscribed(false);
      setToken(null);
    } catch (err) {
      console.error("[PushNotifications] unsubscribe error:", err);
    }
  }, [user, token]);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe };
}
