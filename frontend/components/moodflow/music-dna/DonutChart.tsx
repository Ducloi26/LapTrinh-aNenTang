import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface DonutChartProps {
  data: Array<{ genre: string; value: number }>;
  colors: string[];
}

export default function DonutChart({ data, colors }: DonutChartProps) {
  if (Platform.OS === 'web') {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulative = 0;
    const size = 150;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const SvgElement = 'svg' as any;
    const CircleElement = 'circle' as any;

    return (
      <View style={{ alignItems: 'center' }}>
        <SvgElement
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {data.map((d, i) => {
            const strokeDasharray = `${(d.value / total) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulative * circumference;
            cumulative += d.value / total;
            return (
              <CircleElement
                key={d.genre}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={colors[i % colors.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </SvgElement>
      </View>
    );
  }

  // Fallback native
  return (
    <View style={styles.container}>
      <View style={styles.donutPlaceholder}>
        <Text style={styles.donutText}>100%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 10,
  },
  donutPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 20,
    borderColor: '#67E8F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
