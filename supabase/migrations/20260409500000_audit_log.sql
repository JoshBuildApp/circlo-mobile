-- ============================================================
-- AUDIT LOG TABLE
-- Logs every sensitive action: role changes, payment access,
-- profile edits, coach status changes, booking mutations, etc.
-- ============================================================

-- Create enum for audit action categories
DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM (
    'role_change',
    'payment_access',
    'profile_edit',
    'coach_status_change',
    'booking_change',
    'verification_change',
    'account_delete',
    'admin_action',
    'login',
    'password_reset'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_target ON public.audit_log(target_table, target_id);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and developers can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);

-- No one can update or delete audit logs (append-only)
-- INSERT is handled by SECURITY DEFINER functions below

-- ============================================================
-- SECURITY DEFINER function to insert audit entries
-- This bypasses RLS so triggers/functions can always write logs
-- ============================================================
CREATE OR REPLACE FUNCTION public.write_audit_log(
  _user_id uuid,
  _action public.audit_action,
  _target_table text DEFAULT NULL,
  _target_id uuid DEFAULT NULL,
  _old_value jsonb DEFAULT NULL,
  _new_value jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, target_table, target_id, old_value, new_value, metadata)
  VALUES (_user_id, _action, _target_table, _target_id, _old_value, _new_value, _metadata);
END;
$$;

-- ============================================================
-- TRIGGER: Log role changes on user_roles table
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.user_id,
      'role_change',
      'user_roles',
      NEW.user_id,
      NULL,
      jsonb_build_object('role', NEW.role),
      jsonb_build_object('operation', 'grant')
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.write_audit_log(
      OLD.user_id,
      'role_change',
      'user_roles',
      OLD.user_id,
      jsonb_build_object('role', OLD.role),
      NULL,
      jsonb_build_object('operation', 'revoke')
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.write_audit_log(
      NEW.user_id,
      'role_change',
      'user_roles',
      NEW.user_id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      jsonb_build_object('operation', 'change')
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_role_change ON public.user_roles;
CREATE TRIGGER trg_audit_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();

-- ============================================================
-- TRIGGER: Log coach status field changes (verified, pro, boosted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_coach_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old jsonb := '{}';
  _new jsonb := '{}';
  _changed boolean := false;
BEGIN
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    _old := _old || jsonb_build_object('is_verified', OLD.is_verified);
    _new := _new || jsonb_build_object('is_verified', NEW.is_verified);
    _changed := true;
  END IF;
  IF OLD.is_pro IS DISTINCT FROM NEW.is_pro THEN
    _old := _old || jsonb_build_object('is_pro', OLD.is_pro);
    _new := _new || jsonb_build_object('is_pro', NEW.is_pro);
    _changed := true;
  END IF;
  IF OLD.is_boosted IS DISTINCT FROM NEW.is_boosted THEN
    _old := _old || jsonb_build_object('is_boosted', OLD.is_boosted);
    _new := _new || jsonb_build_object('is_boosted', NEW.is_boosted);
    _changed := true;
  END IF;

  IF _changed THEN
    PERFORM public.write_audit_log(
      auth.uid(),
      'coach_status_change',
      'coach_profiles',
      NEW.id,
      _old,
      _new,
      jsonb_build_object('coach_user_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_coach_status ON public.coach_profiles;
CREATE TRIGGER trg_audit_coach_status
  AFTER UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_coach_status_change();

-- ============================================================
-- TRIGGER: Log profile edits
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_profile_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.write_audit_log(
    NEW.id,
    'profile_edit',
    'profiles',
    NEW.id,
    to_jsonb(OLD) - 'id' - 'created_at' - 'updated_at',
    to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at',
    jsonb_build_object('changed_by', auth.uid())
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_profile_edit ON public.profiles;
CREATE TRIGGER trg_audit_profile_edit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profile_edit();

-- ============================================================
-- TRIGGER: Log booking status changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.user_id,
      'booking_change',
      'bookings',
      NEW.id,
      NULL,
      jsonb_build_object('status', NEW.status, 'coach_id', NEW.coach_id),
      jsonb_build_object('operation', 'create')
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.write_audit_log(
      COALESCE(auth.uid(), NEW.user_id),
      'booking_change',
      'bookings',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object('operation', 'status_change', 'coach_id', NEW.coach_id)
    );
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_booking_change ON public.bookings;
CREATE TRIGGER trg_audit_booking_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_booking_change();

-- ============================================================
-- Log payment access via the existing get_coach_payment_methods fn
-- We wrap the existing function to add audit logging
-- ============================================================
-- Note: We add audit logging to payment access by creating a
-- separate logging function that can be called from the frontend
CREATE OR REPLACE FUNCTION public.log_payment_access(
  _coach_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.write_audit_log(
    auth.uid(),
    'payment_access',
    'coach_profiles',
    _coach_profile_id,
    NULL,
    NULL,
    jsonb_build_object('accessed_by', auth.uid())
  );
END;
$$;
