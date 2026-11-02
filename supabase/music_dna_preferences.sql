CREATE TABLE IF NOT EXISTS public.user_dna_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  energy_offset SMALLINT NOT NULL DEFAULT 0
    CHECK (energy_offset BETWEEN -20 AND 20),
  tempo_offset SMALLINT NOT NULL DEFAULT 0
    CHECK (tempo_offset BETWEEN -20 AND 20),
  vocal_preference SMALLINT NOT NULL DEFAULT 50
    CHECK (vocal_preference BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_dna_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_dna_preferences FROM anon, authenticated;
GRANT ALL ON public.user_dna_preferences TO service_role;
