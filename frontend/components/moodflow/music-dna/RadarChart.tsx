import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface RadarChartProps {
  data: Array<{ genre: string; value: number }>;
}

export default function RadarChart({ data }: RadarChartProps) {
  if (Platform.OS === 'web') {
    const center = 110;
    const radius = 75;
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

    const points = data
      .map((d, i) => {
        const r = (d.value / 50) * radius;
        const x = center + r * Math.cos(angles[i] - Math.PI / 2);
        const y = center + r * Math.sin(angles[i] - Math.PI / 2);
        return `${x},${y}`;
      })
      .join(' ');

    const SvgElement = 'svg' as any;
    const PolygonElement = 'polygon' as any;
    const LineElement = 'line' as any;
    const TextElement = 'text' as any;

    return (
      <View style={{ alignItems: 'center' }}>
        <SvgElement width="220" height="220">
          {[0.3, 0.6, 1].map((scale, i) => (
            <PolygonElement
              key={i}
              points={angles
                .map(
                  (a) =>
                    `${center + radius * scale * Math.cos(a - Math.PI / 2)},${
                      center + radius * scale * Math.sin(a - Math.PI / 2)
                    }`
                )
                .join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}
          {angles.map((a, i) => (
            <LineElement
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(a - Math.PI / 2)}
              y2={center + radius * Math.sin(a - Math.PI / 2)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
          ))}
          <PolygonElement
            points={points}
            fill="#67E8F9"
            fillOpacity="0.28"
            stroke="#67E8F9"
            strokeWidth="2"
          />
          {data.map((d, i) => {
            const labelDist = radius + 18;
            const x = center + labelDist * Math.cos(angles[i] - Math.PI / 2);
            const y = center + labelDist * Math.sin(angles[i] - Math.PI / 2);
            return (
              <TextElement
                key={d.genre}
                x={x}
                y={y}
                fill="#8890A8"
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="central"
                fontWeight="600"
              >
                {d.genre}
              </TextElement>
            );
          })}
        </SvgElement>
      </View>
    );
  }

  // Fallback native
  return (
    <View style={styles.fallbackContainer}>
      {data.map((item) => (
        <View key={item.genre} style={styles.fallbackRow}>
          <Text style={styles.fallbackLabel}>{item.genre}</Text>
          <View style={styles.fallbackBarBg}>
            <View
              style={[
                styles.fallbackBarFill,
                { width: `${(item.value / 50) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.fallbackVal}>{item.value}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 10,
    gap: 12,
  },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fallbackLabel: {
    width: 60,
    color: COLORS.muted,
    fontSize: 13,
  },
  fallbackBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fallbackBarFill: {
    height: '100%',
    backgroundColor: '#67E8F9',
    borderRadius: 4,
  },
  fallbackVal: {
    width: 40,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
});
