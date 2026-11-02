import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { COLORS, Track } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface MusicCardProps {
  track: Track;
  onPlay: () => void;
  initialLiked?: boolean;
  onToggleLike?: (track: Track, isLiked: boolean) => void;
}

export default function MusicCard({
  track,
  onPlay,
  initialLiked = false,
  onToggleLike,
}: MusicCardProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [loadingLike, setLoadingLike] = useState(false);

  const handleToggleLike = async () => {
    const nextState = !liked;
    setLiked(nextState);
    if (onToggleLike) onToggleLike(track, nextState);

    try {
      setLoadingLike(true);
      await fetch('http://localhost:5000/api/tracks/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      });
    } catch (err) {
      console.error('Lỗi lưu thích bài hát:', err);
    } finally {
      setLoadingLike(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Cover Art */}
      <View style={styles.coverWrap}>
        {track.cover ? (
          <Image source={{ uri: track.cover }} style={styles.coverImg} />
        ) : (
          <Icon name="music" size={19} color={COLORS.faint} />
        )}
      </View>

      {/* Track Info & Actions */}
      <View style={styles.infoWrap}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>
              {track.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta} numberOfLines={1}>
                {track.artist} · {track.genre} · {track.duration}
              </Text>
              {track.bpm ? (
                <View style={styles.bpmBadge}>
                  <Text style={styles.bpmText}>🥁 {track.bpm} BPM</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={onPlay} style={styles.actionBtn}>
              <Icon name="play" size={12} color="#FFF" />
            </Pressable>
            <Pressable
              onPress={handleToggleLike}
              disabled={loadingLike}
              style={styles.actionBtnTransparent}
            >
              <Icon
                name="heart"
                size={14}
                color={liked ? '#F472B6' : COLORS.faint}
              />
            </Pressable>
            <Pressable style={styles.actionBtnTransparent}>
              <Icon name="plus" size={14} color={COLORS.faint} />
            </Pressable>
          </View>
        </View>

        {/* Psychological effect */}
        {track.psychologicalEffect ? (
          <View style={styles.effectBadge}>
            <Text style={styles.effectText}>🧠 {track.psychologicalEffect}</Text>
          </View>
        ) : null}

        {/* Reason */}
        {track.reason ? (
          <Text style={styles.reasonText}>"{track.reason}"</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  coverWrap: {
    width: 52,
    height: 52,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#2A3155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  infoWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  meta: {
    fontSize: 12.5,
    color: COLORS.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  bpmBadge: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
  },
  bpmText: {
    fontSize: 11,
    color: '#22D3EE',
    fontWeight: '700',
  },
  effectBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    alignSelf: 'flex-start',
  },
  effectText: {
    fontSize: 11.5,
    color: '#C084FC',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTransparent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    marginTop: 6,
    fontSize: 11.5,
    color: COLORS.faint,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
