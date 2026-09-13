import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Track, Mood } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface NowPlayingModalProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentMood: Mood;
  stageInfo?: { index: number; total: number; title: string };
  onClose: () => void;
}

export default function NowPlayingModal({
  track,
  isPlaying,
  onTogglePlay,
  currentMood,
  stageInfo,
  onClose,
}: NowPlayingModalProps) {
  if (!track) return null;

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <Icon name="sparkles" size={18} color="#67E8F9" />
            <Text style={styles.headerLabel}>NOW PLAYING EXPERIENCE</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={16} color="#FFF" />
          </Pressable>
        </View>

        {/* Center Content */}
        <View style={styles.centerWrap}>
          {/* Big Album Art */}
          <View
            style={[
              styles.albumCard,
              {
                shadowColor: currentMood.colors[0],
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 30,
              },
            ]}
          >
            <Image
              source={{ uri: track.cover }}
              style={styles.bigCover}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.coverGradient}
            />
          </View>

          {/* Right Info */}
          <View style={styles.infoCol}>
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>
                GIAI ĐOẠN: {stageInfo?.title || 'Focus State'}
              </Text>
            </View>

            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.trackMeta}>
              {track.artist} • {track.genre} • {track.duration}
            </Text>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonHeader}>
                VÌ SAO GIAI ĐIỆU NÀY DÀNH CHO BẠN:
              </Text>
              <Text style={styles.reasonText}>"{track.reason}"</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable onPress={onTogglePlay} style={styles.mainPlayBtn}>
                <LinearGradient
                  colors={currentMood.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mainPlayGradient}
                >
                  <Icon
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color="#0A0D16"
                  />
                  <Text style={styles.mainPlayText}>
                    {isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 18, 0.96)',
    padding: 36,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  albumCard: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  bigCover: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  infoCol: {
    flex: 1,
    minWidth: 280,
  },
  stagePill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  stagePillText: {
    color: '#67E8F9',
    fontWeight: '700',
    fontSize: 12.5,
  },
  trackTitle: {
    fontSize: 34,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  trackMeta: {
    fontSize: 17,
    color: COLORS.muted,
    marginBottom: 20,
  },
  reasonCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 26,
  },
  reasonHeader: {
    fontSize: 11.5,
    color: COLORS.faint,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reasonText: {
    color: COLORS.muted,
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mainPlayBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  mainPlayGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainPlayText: {
    color: '#0A0D16',
    fontWeight: '800',
    fontSize: 15,
  },
});
