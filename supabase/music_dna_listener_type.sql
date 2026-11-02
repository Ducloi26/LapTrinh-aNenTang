ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS listener_type TEXT
CHECK (
  listener_type IS NULL OR listener_type IN (
    'deep_thinker',
    'flow_seeker',
    'energy_chaser',
    'night_dreamer',
    'soul_healer',
    'creative_explorer'
  )
);
