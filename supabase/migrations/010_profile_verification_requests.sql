ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;
