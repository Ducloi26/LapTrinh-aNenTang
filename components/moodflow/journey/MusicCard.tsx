import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { COLORS, Track } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface MusicCardProps {
  track: Track;
  onPlay: () => void;
}

export default function MusicCard({ track, onPlay }: MusicCardProps) {
  const [liked, setLiked] = useState(false);

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
            <Text style={styles.meta} numberOfLines={1}>
              {track.artist} · {track.genre} · {track.duration}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={onPlay} style={styles.actionBtn}>
              <Icon name="play" size={12} color="#FFF" />
            </Pressable>
            <Pressable
              onPress={() => setLiked(!liked)}
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
    marginTop: 2,
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
    marginTop: 8,
    fontSize: 12,
    color: COLORS.faint,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
