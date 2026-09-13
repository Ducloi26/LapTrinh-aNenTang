import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SoundWaveProps {
  playing: boolean;
  color?: string;
}

export default function SoundWave({ playing, color = '#67E8F9' }: SoundWaveProps) {
  const anim1 = useRef(new Animated.Value(4)).current;
  const anim2 = useRef(new Animated.Value(12)).current;
  const anim3 = useRef(new Animated.Value(8)).current;
  const anim4 = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!playing) {
      anim1.setValue(4);
      anim2.setValue(4);
      anim3.setValue(4);
      anim4.setValue(4);
      return;
    }

    const createLoop = (anim: Animated.Value, toVal: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: toVal,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 4,
            duration,
            useNativeDriver: false,
          }),
        ])
      );
    };

    const l1 = createLoop(anim1, 18, 400);
    const l2 = createLoop(anim2, 22, 600);
    const l3 = createLoop(anim3, 14, 500);
    const l4 = createLoop(anim4, 20, 700);

    l1.start();
    l2.start();
    l3.start();
    l4.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
      l4.stop();
    };
  }, [playing]);

  return (
    <View style={styles.container}>
      {[anim1, anim2, anim3, anim4].map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    gap: 3,
    marginLeft: 10,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
