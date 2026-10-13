import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface FieldProps {
  label: string;
  icon: string;
  error?: string;
  inputProps: TextInputProps;
}

export default function Field({ label, icon, error, inputProps }: FieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.faint}
          {...inputProps}
        />
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.borderStrong,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  inputRowError: {
    borderBottomColor: COLORS.danger,
  },
  icon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },
  errorIcon: {
    fontSize: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
});
