SET search_path = public, extensions;

-- One-time owner-only bootstrap. Call this from a direct DATABASE_URL
-- connection after the intended Neon Auth account has signed up. It fails if
-- any admin already exists. The Data API roles cannot execute this function.
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Use a direct database owner connection for first-admin setup'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(20181210, 1);

  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles AS p WHERE p.id = target_user_id
  ) THEN
    RAISE EXCEPTION 'The target account must sign up first'
      USING ERRCODE = '23503';
  END IF;

  EXECUTE 'ALTER TABLE public.profiles DISABLE TRIGGER guard_profile_privileges';

  UPDATE public.profiles
  SET role = 'admin',
      is_verified = TRUE,
      verified_at = NOW(),
      verified_by = target_user_id
  WHERE id = target_user_id;

  EXECUTE 'ALTER TABLE public.profiles ENABLE TRIGGER guard_profile_privileges';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(UUID)
  FROM PUBLIC, anonymous, authenticated;
