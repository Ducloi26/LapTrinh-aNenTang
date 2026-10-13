import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPasswordStrength } from '@/utils/validation';

interface Props {
  password: string;
}

export default function PasswordStrength({ password }: Props) {
  const result = getPasswordStrength(password);
  if (!result) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= result.index ? result.color : 'rgba(255,255,255,0.1)' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: result.color }]}>{result.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -8,
    marginBottom: 18,
  },
  barRow: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    height: 3,
    flex: 1,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
});
