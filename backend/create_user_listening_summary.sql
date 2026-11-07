CREATE OR REPLACE VIEW public.user_listening_summary AS
WITH listening_totals AS (
  SELECT user_id, SUM(GREATEST(listened_sec, 0))::bigint AS total_listening_seconds
  FROM public.listening_history
  GROUP BY user_id
),
ranked_genres AS (
  SELECT history.user_id, tracks.genre,
    ROW_NUMBER() OVER (
      PARTITION BY history.user_id
      ORDER BY SUM(GREATEST(history.listened_sec, 0)) DESC, COUNT(*) DESC, tracks.genre
    ) AS rank
  FROM public.listening_history AS history
  JOIN public.tracks AS tracks ON tracks.id = history.track_id
  WHERE tracks.genre IS NOT NULL AND tracks.genre <> ''
  GROUP BY history.user_id, tracks.genre
),
ranked_artists AS (
  SELECT history.user_id, artists.name AS artist,
    ROW_NUMBER() OVER (
      PARTITION BY history.user_id
      ORDER BY SUM(GREATEST(history.listened_sec, 0)) DESC, COUNT(*) DESC, artists.name
    ) AS rank
  FROM public.listening_history AS history
  JOIN public.tracks AS tracks ON tracks.id = history.track_id
  JOIN public.artists AS artists ON artists.id = tracks.artist_id
  WHERE artists.name IS NOT NULL AND artists.name <> ''
  GROUP BY history.user_id, artists.name
),
ranked_moods AS (
  SELECT history.user_id, COALESCE(journeys.mood_to, journeys.mood_from) AS mood_id,
    ROW_NUMBER() OVER (
      PARTITION BY history.user_id
      ORDER BY SUM(GREATEST(history.listened_sec, 0)) DESC, COUNT(*) DESC,
        COALESCE(journeys.mood_to, journeys.mood_from)
    ) AS rank
  FROM public.listening_history AS history
  JOIN public.journeys AS journeys ON journeys.id = history.journey_id
  WHERE COALESCE(journeys.mood_to, journeys.mood_from) IS NOT NULL
  GROUP BY history.user_id, COALESCE(journeys.mood_to, journeys.mood_from)
)
SELECT app_users.id AS user_id,
  COALESCE(listening_totals.total_listening_seconds, 0)::bigint AS total_listening_seconds,
  ranked_genres.genre AS top_genre,
  ranked_artists.artist AS top_artist,
  ranked_moods.mood_id AS top_mood_id
FROM public.app_users
LEFT JOIN listening_totals ON listening_totals.user_id = app_users.id
LEFT JOIN ranked_genres ON ranked_genres.user_id = app_users.id AND ranked_genres.rank = 1
LEFT JOIN ranked_artists ON ranked_artists.user_id = app_users.id AND ranked_artists.rank = 1
LEFT JOIN ranked_moods ON ranked_moods.user_id = app_users.id AND ranked_moods.rank = 1;

GRANT SELECT ON public.user_listening_summary TO service_role;
