import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface DonutChartProps {
  data: { genre: string; value: number }[];
  colors: string[];
}

export default function DonutChart({ data, colors }: DonutChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (Platform.OS === 'web') {
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
          {total === 0 && (
            <CircleElement
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={strokeWidth}
            />
          )}
          {data.map((d, i) => {
            if (total === 0 || d.value <= 0) return null;
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
      <View style={styles.barBackground}>
        {total > 0 &&
          data.map((item, index) =>
            item.value > 0 ? (
              <View
                key={item.genre}
                style={[
                  styles.barSegment,
                  {
                    flexGrow: item.value,
                    backgroundColor: colors[index % colors.length],
                  },
                ]}
              />
            ) : null
          )}
      </View>
      <Text style={styles.donutText}>
        {total > 0 ? `${Math.round(total)}%` : 'Chưa có dữ liệu'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 10,
  },
  barBackground: {
    height: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  barSegment: {
    flexBasis: 0,
  },
  donutText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
