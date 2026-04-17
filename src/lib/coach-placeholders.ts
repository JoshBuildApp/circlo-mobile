import placeholder1 from "@/assets/coach-placeholder-1.jpg";
import placeholder2 from "@/assets/coach-placeholder-2.jpg";
import placeholder3 from "@/assets/coach-placeholder-3.jpg";

const PLACEHOLDERS = [placeholder1, placeholder2, placeholder3];

/**
 * Returns a deterministic placeholder image for a coach based on their id or name.
 * Ensures the same coach always gets the same placeholder.
 */
export function getCoachPlaceholder(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash * 31 + identifier.charCodeAt(i)) | 0;
  }
  return PLACEHOLDERS[Math.abs(hash) % PLACEHOLDERS.length];
}

/**
 * Returns the image_url if truthy, otherwise a deterministic placeholder.
 */
export function resolveCoachImage(imageUrl: string | null | undefined, coachId: string): string {
  return imageUrl || getCoachPlaceholder(coachId);
}
