import React from 'react';
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '@/constants/moodflow';
import { SYNTH_PRESETS, SynthPresetId } from '@/services/audio-presets';
import { usePlayer } from '@/contexts/PlayerContext';
import Icon from '@/components/moodflow/shared/Icon';
import SoundWave from '@/components/moodflow/player/SoundWave';

<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
interface BottomPlayerProps {
  bottomOffset: number;
  onOpenNowPlaying: () => void;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}
=======
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
// interface BottomPlayerProps {
//   nowPlaying: Track | null;
//   playing: boolean;
//   setPlaying: () => void;
//   stageInfo?: { index: number; total: number; title: string };
//   onOpenNowPlaying: () => void;
// }

// export default function BottomPlayer({
//   nowPlaying,
//   playing,
//   setPlaying,
//   stageInfo,
//   onOpenNowPlaying,
// }: BottomPlayerProps) {
//   const spinValue = useRef(new Animated.Value(0)).current;
=======
interface BottomPlayerProps {
  nowPlaying: Track | null;
  playing: boolean;
  setPlaying: () => void;
  stageInfo?: { index: number; total: number; title: string };
  onOpenNowPlaying: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onFinishJourney?: () => void;
}

export default function BottomPlayer({
  nowPlaying,
  playing,
  setPlaying,
  stageInfo,
  onOpenNowPlaying,
  onNext,
  onPrev,
  onFinishJourney,
}: BottomPlayerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
>>>>>>> bd07347ee7ce77263b32c5ea829322bb9a8e0027:frontend/components/moodflow/player/BottomPlayer.tsx
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx

export default function BottomPlayer({
  bottomOffset,
  onOpenNowPlaying,
}: BottomPlayerProps) {
  const {
    nowPlaying,
    stageInfo,
    playing,
    presetId,
    volume,
    error,
    isBuffering,
    historyError,
    historyEnabled,
    retryHistory,
    startGuestSession,
    guestSessionLoading,
    guestSessionError,
    elapsedSeconds,
    durationSeconds,
    togglePlay,
    stop,
    setVolume,
    setPreset,
    seekTo,
    previousTrack,
    nextTrack,
  } = usePlayer();
  const progressRef = React.useRef<View>(null);
  const volumeTrackRef = React.useRef<View>(null);
  const [progressWidth, setProgressWidth] = React.useState(1);
  const [progressLeft, setProgressLeft] = React.useState(0);
  const [volumeWidth, setVolumeWidth] = React.useState(100);
  const [volumeLeft, setVolumeLeft] = React.useState(0);

  if (!nowPlaying) return null;

  const handleProgressLayout = (event: LayoutChangeEvent) => {
    setProgressWidth(event.nativeEvent.layout.width);
    progressRef.current?.measureInWindow((left) => setProgressLeft(left));
  };

  const handleVolumeLayout = (event: LayoutChangeEvent) => {
    setVolumeWidth(event.nativeEvent.layout.width);
    volumeTrackRef.current?.measureInWindow((left) => setVolumeLeft(left));
  };

<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
  const handleProgressPress = (event: { nativeEvent: { locationX: number; pageX: number } }) => {
    const { locationX, pageX } = event.nativeEvent;
    const clickX = Number.isFinite(locationX)
      ? locationX
      : Number.isFinite(pageX)
        ? pageX - progressLeft
        : Number.NaN;
    if (!Number.isFinite(clickX) || progressWidth <= 0 || durationSeconds <= 0) return;
    const position = Math.max(0, Math.min(progressWidth, clickX));
    seekTo((position / progressWidth) * durationSeconds);
  };
=======
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
//       {/* Center Controls & Progress */}
//       <View style={styles.centerSection}>
//         <View style={styles.controlRow}>
//           <Pressable style={styles.iconBtn}>
//             <Icon name="skipback" size={16} color={COLORS.muted} />
//           </Pressable>
//           <Pressable onPress={setPlaying} style={styles.playBtn}>
//             <Icon
//               name={playing ? 'pause' : 'play'}
//               size={15}
//               color="#0A0D16"
//             />
//           </Pressable>
//           <Pressable style={styles.iconBtn}>
//             <Icon name="skipforward" size={16} color={COLORS.muted} />
//           </Pressable>
//           <SoundWave playing={playing} />
//         </View>
=======
      {/* Center Controls & Progress */}
      <View style={styles.centerSection}>
        <View style={styles.controlRow}>
          <Pressable onPress={onPrev} style={styles.iconBtn}>
            <Icon name="skipback" size={16} color={COLORS.muted} />
          </Pressable>
          <Pressable onPress={setPlaying} style={styles.playBtn}>
            <Icon
              name={playing ? 'pause' : 'play'}
              size={15}
              color="#0A0D16"
            />
          </Pressable>
          <Pressable onPress={onNext} style={styles.iconBtn}>
            <Icon name="skipforward" size={16} color={COLORS.muted} />
          </Pressable>
          <SoundWave playing={playing} />
        </View>
>>>>>>> bd07347ee7ce77263b32c5ea829322bb9a8e0027:frontend/components/moodflow/player/BottomPlayer.tsx
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx

  const handleVolumePress = (event: { nativeEvent: { locationX: number; pageX: number } }) => {
    const { locationX, pageX } = event.nativeEvent;
    const clickX = Number.isFinite(locationX)
      ? locationX
      : Number.isFinite(pageX)
        ? pageX - volumeLeft
        : Number.NaN;
    if (!Number.isFinite(clickX) || volumeWidth <= 0) return;
    setVolume(Math.max(0, Math.min(1, clickX / volumeWidth)));
  };

<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
  return (
    <View style={[styles.footer, { bottom: bottomOffset }]}>
      <View style={styles.mainRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở màn hình đang phát"
          onPress={onOpenNowPlaying}
          style={styles.trackInfo}
        >
          <View style={styles.coverWrap}>
            <Image
              source={{ uri: nowPlaying.cover }}
              style={[styles.coverImg, playing && styles.coverPlaying]}
            />
          </View>
          <View style={styles.trackTextWrap}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {nowPlaying.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {nowPlaying.artist} · BPM {nowPlaying.bpm ?? '—'}
            </Text>
            <Text style={styles.stageText} numberOfLines={1}>
              Giai đoạn {stageInfo ? `${stageInfo.index + 1}/${stageInfo.total} · ${stageInfo.title}` : '—'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={elapsedSeconds > 3 ? 'Quay lại đầu bài' : 'Bài trước'}
            onPress={previousTrack}
            style={styles.controlBtn}
          >
            <Icon name="skipback" size={17} color={COLORS.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isBuffering ? 'Đang tải nhạc, bấm để tạm dừng' : 'Phát hoặc tạm dừng'}
            onPress={togglePlay}
            style={styles.playBtn}
          >
            <Icon
              name={playing ? 'pause' : 'play'}
              size={15}
              color="#0A0D16"
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bài tiếp theo"
            onPress={nextTrack}
            style={styles.controlBtn}
          >
            <Icon name="skipforward" size={17} color={COLORS.muted} />
          </Pressable>
          <SoundWave playing={playing} />
        </View>

        <View style={styles.rightControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dừng phát"
            onPress={() => void stop()}
            style={styles.controlBtn}
          >
            <View style={styles.stopIcon} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở màn hình phát nhạc"
            onPress={onOpenNowPlaying}
            style={styles.expandBtn}
          >
            <Icon name="maximize" size={16} color={COLORS.muted} />
          </Pressable>
        </View>
      </View>

      {isBuffering && <Text style={styles.stageText}>Đang tải nhạc…</Text>}
      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{formatTime(elapsedSeconds)}</Text>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="Tiến trình phát"
          accessibilityValue={{
            min: 0,
            max: durationSeconds,
            now: Math.min(elapsedSeconds, durationSeconds),
          }}
          ref={progressRef}
          onLayout={handleProgressLayout}
          onPress={handleProgressPress}
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${durationSeconds > 0
                  ? Math.min(100, (elapsedSeconds / durationSeconds) * 100)
                  : 0}%`,
              },
            ]}
          />
        </Pressable>
        <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
      </View>

      <View style={styles.settingsRow}>
        <View style={styles.presetList}>
          {(Object.keys(SYNTH_PRESETS) as SynthPresetId[]).map((id) => {
            const selected = id === presetId;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => void setPreset(id)}
                style={[styles.presetButton, selected && styles.presetButtonActive]}
              >
                <Text
                  style={[
                    styles.presetText,
                    selected && styles.presetTextActive,
                  ]}
                >
                  {SYNTH_PRESETS[id].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

          <View style={styles.volumeControl}>
            <Icon name="volume" size={15} color={COLORS.muted} />
            <Pressable
              accessibilityRole="adjustable"
              accessibilityLabel="Âm lượng nhạc"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(volume * 100),
              }}
              ref={volumeTrackRef}
              onLayout={handleVolumeLayout}
              onPress={handleVolumePress}
              style={styles.volumeTrack}
            >
              <View
                style={[styles.volumeFill, { width: `${volume * 100}%` }]}
              />
              <View
                style={[
                  styles.volumeThumb,
                  { left: `${volume * 100}%` },
                ]}
              />
            </Pressable>
            <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
          </View>
      </View>

      {!historyEnabled && <View>
        <Pressable disabled={guestSessionLoading} onPress={() => { void startGuestSession(); }} accessibilityRole="button">
          <Text style={styles.stageText}>{guestSessionLoading ? 'Đang tạo phiên khách…' : 'Dùng chế độ khách để lưu lịch sử nghe'}</Text>
        </Pressable>
        {guestSessionError && <Text accessibilityRole="alert" style={styles.errorText}>{guestSessionError}</Text>}
      </View>}
      {historyEnabled && historyError && <View>
        <Text accessibilityRole="alert" style={styles.errorText}>{historyError}</Text>
        <Pressable onPress={() => { void retryHistory(); }}>
          <Text style={styles.stageText}>Thử lưu lại</Text>
        </Pressable>
      </View>}
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
=======
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
//       {/* Right Controls */}
//       <View style={styles.rightSection}>
//         {stageInfo && (
//           <Text style={styles.stageText}>
//             Giai đoạn {stageInfo.index + 1}/{stageInfo.total} — {stageInfo.title}
//           </Text>
//         )}
//         <Pressable style={styles.rightBtn}>
//           <Icon name="volume" size={16} color={COLORS.muted} />
//         </Pressable>
//         <Pressable onPress={onOpenNowPlaying} style={styles.rightBtn}>
//           <Icon name="maximize" size={16} color={COLORS.muted} />
//         </Pressable>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   footer: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     height: 82,
//     backgroundColor: 'rgba(17, 22, 42, 0.95)',
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     zIndex: 30,
//   },
//   trackInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: 240,
//     gap: 12,
//   },
//   coverWrap: {
//     width: 46,
//     height: 46,
//     borderRadius: 10,
//     overflow: 'hidden',
//     backgroundColor: COLORS.surface2,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   coverImg: {
//     width: '100%',
//     height: '100%',
//   },
//   trackTextWrap: {
//     flex: 1,
//     minWidth: 0,
//   },
//   trackTitle: {
//     fontSize: 13.5,
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   trackArtist: {
//     fontSize: 11.5,
//     color: COLORS.faint,
//     marginTop: 2,
//   },
//   centerSection: {
//     flex: 1,
//     maxWidth: 480,
//     alignItems: 'center',
//     marginHorizontal: 'auto',
//     gap: 6,
//   },
//   controlRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 16,
//   },
//   iconBtn: {
//     padding: 6,
//   },
//   playBtn: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     backgroundColor: COLORS.text,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   progressBarBg: {
//     width: '100%',
//     height: 3,
//     borderRadius: 3,
//     backgroundColor: COLORS.surface2,
//     overflow: 'hidden',
//   },
//   progressBarFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   rightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: 240,
//     justifyContent: 'flex-end',
//     gap: 14,
//   },
//   stageText: {
//     fontSize: 11.5,
//     color: COLORS.faint,
//   },
//   rightBtn: {
//     padding: 4,
//   },
// });
=======
      {/* Right Controls */}
      <View style={styles.rightSection}>
        {onFinishJourney && (
          <Pressable onPress={onFinishJourney} style={styles.finishBtn}>
            <Text style={styles.finishBtnText}>🏁 Đánh giá</Text>
          </Pressable>
        )}
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
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
=======
  finishBtn: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.4)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  finishBtnText: {
    color: '#22D3EE',
    fontSize: 11.5,
    fontWeight: '700',
  },
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
    minHeight: 132,
    backgroundColor: 'rgba(17, 22, 42, 0.97)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 35,
    gap: 6,
  },
  mainRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverWrap: {
    width: 42,
    height: 42,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
=======
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
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
  coverPlaying: {
    transform: [{ scale: 1.04 }],
  },
=======
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx
  trackTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  trackArtist: {
    color: COLORS.faint,
    fontSize: 10,
    marginTop: 1,
  },
  stageText: {
    color: COLORS.ok,
    fontSize: 10,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
=======
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
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
<<<<<<< HEAD:components/moodflow/player/BottomPlayer.tsx
  stopIcon: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: COLORS.muted,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandBtn: {
    padding: 7,
  },
  progressRow: {
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 18,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: COLORS.borderStrong,
    justifyContent: 'center',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.ok,
  },
  timeText: {
    color: COLORS.faint,
    fontSize: 9,
    width: 28,
    textAlign: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  presetList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  presetButtonActive: {
    backgroundColor: 'rgba(103,232,249,0.13)',
    borderColor: 'rgba(103,232,249,0.5)',
  },
  presetText: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: '600',
  },
  presetTextActive: {
    color: COLORS.ok,
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeTrack: {
    width: 100,
    height: 18,
    justifyContent: 'center',
  },
  volumeFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.ok,
  },
  volumeThumb: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    backgroundColor: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.ok,
  },
  volumeText: {
    color: COLORS.muted,
    fontSize: 10,
    width: 30,
    textAlign: 'right',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
  },
});
=======
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
>>>>>>> bd07347ee7ce77263b32c5ea829322bb9a8e0027:frontend/components/moodflow/player/BottomPlayer.tsx
>>>>>>> main:frontend/components/moodflow/player/BottomPlayer.tsx
