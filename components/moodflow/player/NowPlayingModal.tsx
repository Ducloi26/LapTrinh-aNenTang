import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, Track, Mood } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';
import SoundWave from '@/components/moodflow/player/SoundWave';

interface NowPlayingModalProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  elapsedSeconds: number;
  durationSeconds: number;
  onSeek: (seconds: number) => void;
  currentMood: Mood;
  stageInfo?: { index: number; total: number; title: string };
  onClose: () => void;
}

export default function NowPlayingModal({
  track,
  isPlaying,
  onTogglePlay,
  elapsedSeconds,
  durationSeconds,
  onSeek,
  currentMood,
  stageInfo,
  onClose,
}: NowPlayingModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const rotation = useSharedValue(0);
  const progressRef = useRef<View>(null);
  const [progressWidth, setProgressWidth] = useState(1);
  const [progressLeft, setProgressLeft] = useState(0);
  const safeDuration = durationSeconds;
  const safeElapsed = Math.min(elapsedSeconds, safeDuration);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
    }
    return () => cancelAnimation(rotation);
  }, [isPlaying, rotation]);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const seekFromPageX = useCallback((pageX: number) => {
    if (!Number.isFinite(pageX) || progressWidth <= 0 || safeDuration <= 0) return;
    const offset = Math.max(0, Math.min(progressWidth, pageX - progressLeft));
    onSeek((offset / progressWidth) * safeDuration);
  }, [onSeek, progressLeft, progressWidth, safeDuration]);

  const seekResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gesture) => seekFromPageX(gesture.x0),
    onPanResponderMove: (_, gesture) => seekFromPageX(gesture.moveX),
  }), [seekFromPageX]);

  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      isMobile && gesture.dy > 16 && gesture.dy > Math.abs(gesture.dx) * 1.2,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 90) onClose();
    },
  }), [isMobile, onClose]);

  if (!track) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[...currentMood.colors]}
        style={styles.gradient}
      >
      <View
        style={styles.overlay}
        {...swipeResponder.panHandlers}
      >
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
        <ScrollView
          contentContainerStyle={[
            styles.centerWrap,
            isMobile && styles.centerWrapMobile,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Big Album Art */}
          <Animated.View
            style={[
              styles.albumCard,
              isMobile && styles.albumCardMobile,
              vinylStyle,
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
            <View style={styles.vinylLabel}>
              <View style={styles.vinylHole} />
            </View>
          </Animated.View>

          {/* Right Info */}
          <View style={[styles.infoCol, isMobile && styles.infoColMobile]}>
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>
                GIAI ĐOẠN {stageInfo ? `${stageInfo.index + 1}/${stageInfo.total} · ` : ''}
                {stageInfo?.title || 'Focus State'}
              </Text>
            </View>

            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.trackMeta}>
              {track.artist} • {track.genre} • BPM {track.bpm ?? '—'}
            </Text>

            <View style={styles.progressSection}>
              <View
                ref={progressRef}
                onLayout={(event) => {
                  setProgressWidth(event.nativeEvent.layout.width);
                  progressRef.current?.measureInWindow((left) => setProgressLeft(left));
                }}
                style={styles.progressTrack}
                accessibilityRole="adjustable"
                accessibilityLabel="Tiến trình phát"
                accessibilityValue={{
                  min: 0,
                  max: safeDuration,
                  now: safeElapsed,
                }}
                {...seekResponder.panHandlers}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${safeDuration > 0
                        ? Math.min(100, (safeElapsed / safeDuration) * 100)
                        : 0}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    {
                      left: `${safeDuration > 0
                        ? Math.min(100, (safeElapsed / safeDuration) * 100)
                        : 0}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(safeElapsed)}</Text>
                <SoundWave playing={isPlaying} />
                <Text style={styles.timeText}>{formatTime(safeDuration)}</Text>
              </View>
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonHeader}>
                VÌ SAO GIAI ĐIỆU NÀY DÀNH CHO BẠN:
              </Text>
              <Text style={styles.reasonText}>&quot;{track.reason}&quot;</Text>
            </View>

            <View style={styles.therapyCard}>
              <Text style={styles.therapyHeader}>KHOẢNH KHẮC CHO BẠN</Text>
              <Text style={styles.therapyText}>
                {getTherapeuticMessage(stageInfo?.index ?? 0, safeElapsed)}
              </Text>
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
        </ScrollView>
      </View>
      </LinearGradient>
    </Modal>
  );
}

const therapeuticMessages = [
  [
    'Hãy để vai được thả lỏng, bạn không cần giải quyết mọi thứ cùng lúc.',
    'Chậm lại một nhịp. Cảm nhận bàn chân đang chạm xuống mặt đất.',
    'Bạn đang an toàn trong khoảnh khắc này; hãy nhẹ nhàng trở về với hơi thở.',
    'Thử thở ra dài hơn một chút và để những căng thẳng trôi qua.',
  ],
  [
    'Hít sâu 4 giây, thở ra 6 giây. Lặp lại và để cơ thể chuyển nhịp thật êm.',
    'Không cần vội vàng. Mỗi nhịp thở là một bước nhỏ tiến về phía trước.',
    'Nhận biết cảm xúc đang có mặt, rồi nhẹ nhàng chọn điều bạn muốn hướng đến.',
    'Hãy dành cho mình một khoảng nghỉ giữa điều vừa qua và điều sắp tới.',
  ],
  [
    'Chọn một việc quan trọng nhất và dành sự chú ý cho đúng việc đó.',
    'Khi tâm trí đi lạc, hãy nhận ra rồi dịu dàng đưa sự tập trung quay lại.',
    'Bạn không cần hoàn hảo; chỉ cần hiện diện với bước tiếp theo.',
    'Thả lỏng hàm và vai, rồi tiếp tục với nhịp độ vừa sức.',
  ],
  [
    'Ghi nhận điều bạn vừa hoàn thành, dù đó là một bước nhỏ.',
    'Để nhịp thở chậm dần và cho tâm trí thời gian nghỉ ngơi.',
    'Bạn có thể khép lại công việc lúc này; phần còn lại sẽ chờ được.',
    'Hãy giữ lại cảm giác bình yên này khi bạn chuyển sang hoạt động tiếp theo.',
  ],
];

function getTherapeuticMessage(stageIndex: number, elapsedSeconds: number) {
  const messages = therapeuticMessages[Math.min(stageIndex, therapeuticMessages.length - 1)];
  return messages[Math.floor(elapsedSeconds / 20) % messages.length];
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 18, 0.88)',
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
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  centerWrapMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: 24,
  },
  albumCard: {
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 8,
    borderColor: 'rgba(10, 13, 22, 0.88)',
  },
  albumCardMobile: {
    width: 220,
    height: 220,
    borderRadius: 110,
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
  vinylLabel: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    left: '50%',
    top: '50%',
    marginLeft: -39,
    marginTop: -39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 13, 22, 0.82)',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  vinylHole: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F3F8',
  },
  infoCol: {
    flex: 1,
    minWidth: 280,
  },
  infoColMobile: {
    flex: 0,
    minWidth: 0,
    width: '100%',
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
  progressSection: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 16,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.ok,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: COLORS.ok,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    minWidth: 38,
    color: COLORS.muted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
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
  therapyCard: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.22)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  therapyHeader: {
    color: COLORS.ok,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  therapyText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
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
