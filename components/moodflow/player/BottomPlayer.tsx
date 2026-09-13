import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Track } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';
import SoundWave from '@/components/moodflow/player/SoundWave';

interface BottomPlayerProps {
  nowPlaying: Track | null;
  playing: boolean;
  setPlaying: () => void;
  stageInfo?: { index: number; total: number; title: string };
  onOpenNowPlaying: () => void;
}

export default function BottomPlayer({
  nowPlaying,
  playing,
  setPlaying,
  stageInfo,
  onOpenNowPlaying,
}: BottomPlayerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (playing) {
      loop = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    } else {
      spinValue.stopAnimation();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [playing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!nowPlaying) return null;

  return (
    <View style={styles.footer}>
      {/* Track Left Info */}
      <Pressable onPress={onOpenNowPlaying} style={styles.trackInfo}>
        <View style={styles.coverWrap}>
          {nowPlaying.cover ? (
            <Animated.Image
              source={{ uri: nowPlaying.cover }}
              style={[
                styles.coverImg,
                playing && { transform: [{ rotate: spin }] },
              ]}
            />
          ) : (
            <Icon name="music" size={17} color={COLORS.muted} />
          )}
        </View>
        <View style={styles.trackTextWrap}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {nowPlaying.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {nowPlaying.artist}
          </Text>
        </View>
      </Pressable>

      {/* Center Controls & Progress */}
      <View style={styles.centerSection}>
        <View style={styles.controlRow}>
          <Pressable style={styles.iconBtn}>
            <Icon name="skipback" size={16} color={COLORS.muted} />
          </Pressable>
          <Pressable onPress={setPlaying} style={styles.playBtn}>
            <Icon
              name={playing ? 'pause' : 'play'}
              size={15}
              color="#0A0D16"
            />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Icon name="skipforward" size={16} color={COLORS.muted} />
          </Pressable>
          <SoundWave playing={playing} />
        </View>

        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={['#67E8F9', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: playing ? '60%' : '35%' }]}
          />
        </View>
      </View>

      {/* Right Controls */}
      <View style={styles.rightSection}>
        {stageInfo && (
          <Text style={styles.stageText}>
            Giai đoạn {stageInfo.index + 1}/{stageInfo.total} — {stageInfo.title}
          </Text>
        )}
        <Pressable style={styles.rightBtn}>
          <Icon name="volume" size={16} color={COLORS.muted} />
        </Pressable>
        <Pressable onPress={onOpenNowPlaying} style={styles.rightBtn}>
          <Icon name="maximize" size={16} color={COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 82,
    backgroundColor: 'rgba(17, 22, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 30,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240,
    gap: 12,
  },
  coverWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  trackTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  trackArtist: {
    fontSize: 11.5,
    color: COLORS.faint,
    marginTop: 2,
  },
  centerSection: {
    flex: 1,
    maxWidth: 480,
    alignItems: 'center',
    marginHorizontal: 'auto',
    gap: 6,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 6,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240,
    justifyContent: 'flex-end',
    gap: 14,
  },
  stageText: {
    fontSize: 11.5,
    color: COLORS.faint,
  },
  rightBtn: {
    padding: 4,
  },
});
