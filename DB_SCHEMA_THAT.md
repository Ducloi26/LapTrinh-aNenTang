-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
id uuid NOT NULL,
display_name character varying NOT NULL DEFAULT 'Người nghe'::character varying,
avatar_url text,
bio character varying,
listener_type character varying DEFAULT 'Flow Seeker'::character varying,
settings jsonb NOT NULL DEFAULT '{"freq": 432, "binaural": true, "volume_binaural": 15}'::jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT profiles_pkey PRIMARY KEY (id),
CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.moods (
id character varying NOT NULL,
label character varying NOT NULL,
emoji character varying NOT NULL,
colors jsonb NOT NULL,
tagline character varying NOT NULL,
target_energy integer NOT NULL CHECK (target_energy >= 0 AND target_energy <= 100),
target_valence integer NOT NULL CHECK (target_valence >= 0 AND target_valence <= 100),
display_order integer DEFAULT 0,
CONSTRAINT moods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.activities (
id character varying NOT NULL,
label character varying NOT NULL,
icon character varying NOT NULL,
target_bpm_min integer NOT NULL,
target_bpm_max integer NOT NULL,
allow_vocal boolean DEFAULT true,
display_order integer DEFAULT 0,
CONSTRAINT activities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.artists (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name character varying NOT NULL,
avatar_url text,
birth_year integer,
country character varying DEFAULT 'VN'::character varying,
vocal_gender character varying CHECK (vocal_gender::text = ANY (ARRAY['male'::character varying, 'female'::character varying, 'duo'::character varying, 'band'::character varying, 'none'::character varying]::text[])),
vocal_timbre character varying,
vocal_range character varying CHECK (vocal_range::text = ANY (ARRAY['low'::character varying, 'mid'::character varying, 'high'::character varying]::text[])),
main_genres jsonb DEFAULT '{}'::jsonb,
signature_moods ARRAY DEFAULT '{}'::text[],
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT artists_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tracks (
id uuid NOT NULL DEFAULT gen_random_uuid(),
artist_id uuid,
title character varying NOT NULL,
genre character varying NOT NULL,
duration_sec integer NOT NULL,
cover_url text NOT NULL,
audio_url text NOT NULL,
play_count bigint DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT tracks_pkey PRIMARY KEY (id),
CONSTRAINT tracks_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id)
);
CREATE TABLE public.track_features (
track_id uuid NOT NULL,
bpm integer NOT NULL DEFAULT 80,
energy integer NOT NULL CHECK (energy >= 0 AND energy <= 100),
valence integer NOT NULL CHECK (valence >= 0 AND valence <= 100),
acousticness integer DEFAULT 50 CHECK (acousticness >= 0 AND acousticness <= 100),
instrumentalness integer DEFAULT 50 CHECK (instrumentalness >= 0 AND instrumentalness <= 100),
vocal_intensity integer DEFAULT 50 CHECK (vocal_intensity >= 0 AND vocal_intensity <= 100),
vocal_density integer DEFAULT 50 CHECK (vocal_density >= 0 AND vocal_density <= 100),
lyrics_sentiment character varying,
lyrics_keywords ARRAY DEFAULT '{}'::text[],
psychological_effect text,
is_estimated boolean DEFAULT false,
CONSTRAINT track_features_pkey PRIMARY KEY (track_id),
CONSTRAINT track_features_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id)
);
CREATE TABLE public.track_mood_scores (
track_id uuid NOT NULL,
mood_id character varying NOT NULL,
score numeric NOT NULL CHECK (score >= 0::numeric AND score <= 100::numeric),
CONSTRAINT track_mood_scores_pkey PRIMARY KEY (track_id, mood_id),
CONSTRAINT track_mood_scores_mood_id_fkey FOREIGN KEY (mood_id) REFERENCES public.moods(id),
CONSTRAINT track_mood_scores_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id)
);
CREATE TABLE public.journeys (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
title character varying NOT NULL,
mood_from character varying,
mood_to character varying,
activity character varying,
duration_min integer NOT NULL DEFAULT 30,
is_public boolean DEFAULT false,
saves_count integer DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT journeys_pkey PRIMARY KEY (id),
CONSTRAINT journeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT journeys_mood_from_fkey FOREIGN KEY (mood_from) REFERENCES public.moods(id),
CONSTRAINT journeys_mood_to_fkey FOREIGN KEY (mood_to) REFERENCES public.moods(id),
CONSTRAINT journeys_activity_fkey FOREIGN KEY (activity) REFERENCES public.activities(id)
);
CREATE TABLE public.journey_tracks (
journey_id uuid NOT NULL,
track_id uuid,
stage_key character varying NOT NULL,
position integer NOT NULL,
CONSTRAINT journey_tracks_pkey PRIMARY KEY (journey_id, position),
CONSTRAINT journey_tracks_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES public.journeys(id),
CONSTRAINT journey_tracks_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id)
);
CREATE TABLE public.user_favorites (
user_id uuid NOT NULL,
track_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_favorites_pkey PRIMARY KEY (user_id, track_id),
CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT user_favorites_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id)
);
CREATE TABLE public.listening_history (
id bigint NOT NULL DEFAULT nextval('listening_history_id_seq'::regclass),
user_id uuid,
track_id uuid,
journey_id uuid,
listened_sec integer NOT NULL DEFAULT 0,
completed boolean DEFAULT false,
skipped boolean DEFAULT false,
played_at timestamp with time zone DEFAULT now(),
CONSTRAINT listening_history_pkey PRIMARY KEY (id),
CONSTRAINT listening_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT listening_history_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id),
CONSTRAINT listening_history_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES public.journeys(id)
);
CREATE TABLE public.user_dna_stats (
user_id uuid NOT NULL,
energy_score integer DEFAULT 50 CHECK (energy_score >= 0 AND energy_score <= 100),
depth_score integer DEFAULT 50 CHECK (depth_score >= 0 AND depth_score <= 100),
frequency_score integer DEFAULT 50 CHECK (frequency_score >= 0 AND frequency_score <= 100),
rhythm_score integer DEFAULT 50 CHECK (rhythm_score >= 0 AND rhythm_score <= 100),
focus_score integer DEFAULT 50 CHECK (focus_score >= 0 AND focus_score <= 100),
genre_distribution jsonb DEFAULT '{"Lo-fi": 40, "Ambient": 30, "Acoustic": 5, "Classical": 15, "Synthwave": 10}'::jsonb,
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT user_dna_stats_pkey PRIMARY KEY (user_id),
CONSTRAINT user_dna_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.community_posts (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid,
journey_id uuid,
content character varying NOT NULL,
like_count integer DEFAULT 0,
comment_count integer DEFAULT 0,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT community_posts_pkey PRIMARY KEY (id),
CONSTRAINT community_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
CONSTRAINT community_posts_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES public.journeys(id)
);
CREATE TABLE public.post_likes (
post_id uuid NOT NULL,
user_id uuid NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id),
CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.post_comments (
id uuid NOT NULL DEFAULT gen_random_uuid(),
post_id uuid,
user_id uuid,
content character varying NOT NULL,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT post_comments_pkey PRIMARY KEY (id),
CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ai_prompt_logs (
id bigint NOT NULL DEFAULT nextval('ai_prompt_logs_id_seq'::regclass),
user_id uuid,
prompt_text text NOT NULL,
parsed_result jsonb NOT NULL,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT ai_prompt_logs_pkey PRIMARY KEY (id),
CONSTRAINT ai_prompt_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.app_users (
id uuid NOT NULL DEFAULT gen_random_uuid(),
email character varying NOT NULL UNIQUE,
password_hash character varying NOT NULL,
display_name character varying NOT NULL DEFAULT 'Người nghe'::character varying,
avatar_url text,
role character varying DEFAULT 'user'::character varying,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT app_users_pkey PRIMARY KEY (id)
);
