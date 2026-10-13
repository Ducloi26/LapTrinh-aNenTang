import React from 'react';
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, Track } from '@/constants/moodflow';
import {
  SYNTH_PRESETS,
  SynthPresetId,
} from '@/services/audio-presets';
import Icon from '@/components/moodflow/shared/Icon';
import SoundWave from '@/components/moodflow/player/SoundWave';

interface BottomPlayerProps {
  nowPlaying: Track | null;
  playing: boolean;
  presetId: SynthPresetId;
  volume: number;
  bottomOffset: number;
  error: string | null;
  onTogglePlay: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onPresetChange: (presetId: SynthPresetId) => void;
  onOpenNowPlaying: () => void;
}

export default function BottomPlayer({
  nowPlaying,
  playing,
  presetId,
  volume,
  bottomOffset,
  error,
  onTogglePlay,
  onStop,
  onVolumeChange,
  onPresetChange,
  onOpenNowPlaying,
}: BottomPlayerProps) {
  const volumeTrackRef = React.useRef<View>(null);
  const [volumeWidth, setVolumeWidth] = React.useState(100);
  const [volumeLeft, setVolumeLeft] = React.useState(0);
  if (!nowPlaying) return null;

  const handleVolumeLayout = (event: LayoutChangeEvent) => {
    setVolumeWidth(event.nativeEvent.layout.width);
    volumeTrackRef.current?.measureInWindow((left) => setVolumeLeft(left));
  };

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
              Synth • {nowPlaying.artist}
            </Text>
          </View>
        </Pressable>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Phát hoặc tạm dừng"
            onPress={onTogglePlay}
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
            accessibilityLabel="Dừng và giải phóng audio"
            onPress={onStop}
            style={styles.controlBtn}
          >
            <View style={styles.stopIcon} />
          </Pressable>
          <SoundWave playing={playing} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở màn hình phát nhạc"
          onPress={onOpenNowPlaying}
          style={styles.expandBtn}
        >
          <Icon name="maximize" size={16} color={COLORS.muted} />
        </Pressable>
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
                onPress={() => onPresetChange(id)}
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
            accessibilityLabel="Âm lượng synth"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(volume * 100),
            }}
            ref={volumeTrackRef}
            onLayout={handleVolumeLayout}
            onPress={(event) => {
              const { locationX, pageX } = event.nativeEvent;
              const clickX = Number.isFinite(locationX)
                ? locationX
                : Number.isFinite(pageX)
                  ? pageX - volumeLeft
                  : Number.NaN;
              if (!Number.isFinite(clickX) || volumeWidth <= 0) return;
              const location = Math.max(0, Math.min(volumeWidth, clickX));
              const nextVolume = location / volumeWidth;
              onVolumeChange(Math.max(0, Math.min(1, nextVolume)));
            }}
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

      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 106,
    backgroundColor: 'rgba(17, 22, 42, 0.97)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 35,
    gap: 8,
  },
  mainRow: {
    minHeight: 46,
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
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverPlaying: {
    transform: [{ scale: 1.04 }],
  },
  trackTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  trackArtist: {
    color: COLORS.faint,
    fontSize: 11,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.muted,
  },
  expandBtn: {
    padding: 7,
  },
  settingsRow: {
    flexDirection: 'row',
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
