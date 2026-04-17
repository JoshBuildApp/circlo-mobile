import { supabase } from "@/integrations/supabase/client";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, html },
  });

  if (error) throw error;
  return data;
}

// ── Sequence enrollment helpers ───────────────────────────────────────────────

/** Enroll the current user in a named email sequence. */
export async function enrollInEmailSequence(
  userId: string,
  type: "welcome" | "reengagement" | "post_booking",
  metadata: Record<string, string> = {},
) {
  const { data, error } = await supabase.rpc("enroll_in_email_sequence", {
    p_user_id: userId,
    p_type: type,
    p_metadata: metadata,
  });
  if (error) console.error("[enrollInEmailSequence]", error.message);
  return data as string | null;
}

/** Cancel all active email sequence enrollments for the current user (unsubscribe). */
export async function unsubscribeFromEmailSequences(userId: string) {
  const { error } = await supabase.rpc("unsubscribe_from_email_sequences", {
    p_user_id: userId,
  });
  if (error) console.error("[unsubscribeFromEmailSequences]", error.message);
}

/* ── Pre-built email templates ── */

export function bookingConfirmationEmail(coachName: string, date: string, time: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#FF6B2B;">Booking Confirmed ✓</h2>
      <p>Your session with <strong>${coachName}</strong> is confirmed.</p>
      <p><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}</p>
      <p style="color:#888;font-size:13px;">See you on the court — Circlo Club Team</p>
    </div>`;
}

export function sessionReminderEmail(coachName: string, time: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#FF6B2B;">Session in 1 hour 🏃</h2>
      <p>Your session with <strong>${coachName}</strong> starts at <strong>${time}</strong>.</p>
      <p style="color:#888;font-size:13px;">Get ready — Circlo Club Team</p>
    </div>`;
}

export function welcomeEmail(name: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#FF6B2B;">Welcome to Circlo, ${name}! 🎉</h2>
      <p>You're in. Find your coach, book your first session, and start leveling up.</p>
      <a href="https://circloclub.com/discover" style="display:inline-block;background:linear-gradient(135deg,#FF6B2B,#FF9D8A);color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;margin-top:16px;">Find a Coach</a>
      <p style="color:#888;font-size:13px;margin-top:24px;">— Circlo Club Team</p>
    </div>`;
}
