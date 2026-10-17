import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface GhostButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}

export default function GhostButton({ children, onClick, active }: GhostButtonProps) {
  return (
    <Pressable
      onPress={onClick}
      style={[styles.button, active ? styles.buttonActive : styles.buttonInactive]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  buttonActive: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buttonInactive: {
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  textActive: {
    color: COLORS.text,
  },
  textInactive: {
    color: COLORS.muted,
  },
});
