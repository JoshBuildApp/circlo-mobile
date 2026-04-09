
-- Allow admin/developer to delete any coach_videos row
CREATE POLICY "Admins can delete any video"
ON public.coach_videos
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);

-- Allow admin/developer to delete any comment
CREATE POLICY "Admins can delete any comment"
ON public.comments
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);

-- Allow admin/developer to delete any like
CREATE POLICY "Admins can delete any like"
ON public.likes
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);

-- Add status column to profiles for soft-delete
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Allow admin/developer to update any profile (for status changes)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);

-- Allow admin/developer to view all coach_videos (already public, but explicit)
-- Already covered by "Videos are viewable by everyone"

-- Allow admin/developer to delete any saved_items (cleanup)
CREATE POLICY "Admins can delete any saved item"
ON public.saved_items
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);
