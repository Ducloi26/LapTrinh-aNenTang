import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  type LayoutChangeEvent,
} from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface DnaSliderProps {
  label: string;
  left: string;
  right: string;
  value: number;
  min?: number;
  max?: number;
  steps?: number[];
  formatValue?: (value: number) => string;
  onChange?: (value: number) => void;
}

export default function DnaSlider({
  label,
  left,
  right,
  value,
  min = 0,
  max = 100,
  steps = [20, 40, 60, 80, 100],
  formatValue,
  onChange,
}: DnaSliderProps) {
  const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const trackRef = useRef<View>(null);
  const trackBounds = useRef({ x: 0, width: 0 });
  const sliderConfig = useRef({ min, max, onChange });
  sliderConfig.current = { min, max, onChange };

  const updateTrackBounds = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackRef.current?.measureInWindow((x) => {
      trackBounds.current = { x, width };
    });
  };

  const updateValueFromPageX = (pageX: number) => {
    const { x, width } = trackBounds.current;
    const { min: sliderMin, max: sliderMax, onChange: change } =
      sliderConfig.current;
    if (!change || width <= 0 || sliderMax <= sliderMin) return;

    const ratio = Math.min(1, Math.max(0, (pageX - x) / width));
    change(Math.round(sliderMin + ratio * (sliderMax - sliderMin)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_event, gestureState) =>
        updateValueFromPageX(gestureState.moveX),
      onPanResponderMove: (_event, gestureState) =>
        updateValueFromPageX(gestureState.moveX),
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valText}>
          {formatValue ? formatValue(value) : `${value}%`}
        </Text>
      </View>

      {onChange ? (
        <View
          ref={trackRef}
          onLayout={updateTrackBounds}
          {...panResponder.panHandlers}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value }}
          style={styles.interactiveTrack}
        >
          <View style={[styles.trackBar, styles.interactiveTrackBar]}>
            <View style={[styles.fillBar, { width: `${percentage}%` }]} />
          </View>
          <View
            pointerEvents="none"
            style={[styles.sliderThumb, { left: `${percentage}%` }]}
          />
        </View>
      ) : (
        <>
          <View style={styles.trackBar}>
            <View style={[styles.fillBar, { width: `${percentage}%` }]} />
          </View>
          <View style={styles.stepButtons}>
            {steps.map((step) => (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  value >= step && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomRow}>
        <Text style={styles.subText}>{left}</Text>
        <Text style={styles.subText}>{right}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  valText: {
    fontSize: 13,
    color: '#67E8F9',
    fontWeight: '700',
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  fillBar: {
    height: '100%',
    backgroundColor: '#67E8F9',
    borderRadius: 3,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  interactiveTrack: {
    height: 36,
    position: 'relative',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'none',
  },
  interactiveTrackBar: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
  },
  sliderThumb: {
    position: 'absolute',
    top: 11,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#67E8F9',
    zIndex: 1,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 0,
  },
  stepDotActive: {
    backgroundColor: '#FFF',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  subText: {
    fontSize: 12,
    color: COLORS.faint,
  },
});
