-- Add email column to profiles and sync from auth.users

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- 2. Backfill existing emails from auth.users
-- This requires security definer or service role to access auth.users
-- Since we are running as migration/admin, we can use a DO block or just a query if permissions allow.
-- In Supabase, you can usually join profiles with auth.users if you have enough permissions.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add trigger to update email in profiles when updated in auth.users
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();
