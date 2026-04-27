// send-push-notification — fan-out APNs push from a notifications row.
//
// Trigger: Supabase database webhook on INSERT into public.notifications.
// Auth   : verifies x-supabase-webhook-source via SUPABASE_WEBHOOK_SECRET
//          (set in dashboard so only Supabase can call us). Service-role
//          access via SUPABASE_SERVICE_ROLE_KEY for the fan-out query.
//
// Required env (Supabase Project → Settings → Edge Functions → Secrets):
//   APNS_KEY_ID         — 10-char Apple Key ID (e.g. R3M4TBQ7WH)
//   APNS_TEAM_ID        — 10-char Apple Team ID (e.g. 55D7C5BR7A)
//   APNS_BUNDLE_ID      — App bundle id (e.g. club.circlo.app)
//   APNS_PRIVATE_KEY    — Full PEM of the .p8 file, including BEGIN/END lines
//   APNS_USE_SANDBOX    — "true" to use api.sandbox.push.apple.com (default: false → production)
//   SUPABASE_URL        — automatic (but reachable via env)
//   SUPABASE_SERVICE_ROLE_KEY — automatic
//   WEBHOOK_SHARED_SECRET     — random string; set the same value on the
//                              Supabase webhook config for x-webhook-secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APNS_HOST_PROD    = "https://api.push.apple.com";
const APNS_HOST_SANDBOX = "https://api.sandbox.push.apple.com";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  reference_id: string | null;
  reference_type: string | null;
}

interface DeviceTokenRow {
  token: string;
  platform: "ios" | "android" | "web";
}

// ---------- ES256 JWT signer for APNs ----------

function pemToPkcs8(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    bytes = input;
  }
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

let cachedJwt: { token: string; expiresAt: number } | null = null;

async function getApnsJwt(): Promise<string> {
  // APNs JWTs must be < 1 hour old; cache for 50 min.
  if (cachedJwt && Date.now() < cachedJwt.expiresAt) return cachedJwt.token;

  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const pem = Deno.env.get("APNS_PRIVATE_KEY");
  if (!keyId || !teamId || !pem) {
    throw new Error("APNs env not configured (need APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY)");
  }

  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const payload = { iss: teamId, iat };

  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(pem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const signatureB64 = b64url(signature);
  const jwt = `${signingInput}.${signatureB64}`;

  cachedJwt = { token: jwt, expiresAt: Date.now() + 50 * 60 * 1000 };
  return jwt;
}

// ---------- APNs send ----------

async function sendToAPNs(
  deviceToken: string,
  notification: NotificationRow,
): Promise<{ ok: boolean; status: number; reason?: string }> {
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  if (!bundleId) {
    return { ok: false, status: 0, reason: "APNS_BUNDLE_ID not set" };
  }

  const useSandbox = Deno.env.get("APNS_USE_SANDBOX") === "true";
  const host = useSandbox ? APNS_HOST_SANDBOX : APNS_HOST_PROD;

  const jwt = await getApnsJwt();

  const body = {
    aps: {
      alert: {
        title: notification.title ?? "Circlo",
        body: notification.body ?? "",
      },
      sound: "default",
      "thread-id": notification.reference_type ?? notification.type,
      "mutable-content": 1,
    },
    // Custom keys consumed by the iOS client to deep-link
    notification_id: notification.id,
    type: notification.type,
    reference_id: notification.reference_id,
    reference_type: notification.reference_type,
  };

  const resp = await fetch(`${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.ok) return { ok: true, status: resp.status };

  // 410 = device token unregistered; mark inactive.
  // 400 BadDeviceToken = invalid; mark inactive.
  let reason = "";
  try {
    const data = await resp.json();
    reason = data?.reason ?? "";
  } catch {
    /* ignore */
  }
  return { ok: false, status: resp.status, reason };
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Optional shared secret check (set both here and on the webhook).
  const expectedSecret = Deno.env.get("WEBHOOK_SHARED_SECRET");
  if (expectedSecret) {
    const got = req.headers.get("x-webhook-secret");
    if (got !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let payload: { type: string; record?: NotificationRow } | null = null;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  if (!payload || payload.type !== "INSERT" || !payload.record) {
    return new Response("Ignored (not an INSERT)", { status: 200 });
  }

  const notification = payload.record;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    console.error("supabase env missing");
    return new Response("server misconfigured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  // Look up active iOS tokens for the recipient.
  const { data: tokens, error } = await supabase
    .from("push_notification_tokens")
    .select("token, platform")
    .eq("user_id", notification.user_id)
    .eq("is_active", true);

  if (error) {
    console.error("token query failed:", error);
    return new Response("token query failed", { status: 500 });
  }

  const iosTokens = (tokens as DeviceTokenRow[] | null ?? []).filter(
    (t) => t.platform === "ios",
  );

  if (iosTokens.length === 0) {
    return new Response(JSON.stringify({ delivered: 0, reason: "no iOS tokens" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const results = await Promise.all(
    iosTokens.map((row) => sendToAPNs(row.token, notification).then((r) => ({ token: row.token, ...r }))),
  );

  // Mark dead tokens inactive.
  const dead = results.filter(
    (r) => !r.ok && (r.status === 410 || r.reason === "BadDeviceToken" || r.reason === "Unregistered"),
  );
  if (dead.length > 0) {
    await supabase
      .from("push_notification_tokens")
      .update({ is_active: false })
      .in("token", dead.map((d) => d.token));
  }

  const summary = {
    delivered: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    deactivated: dead.length,
  };
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
