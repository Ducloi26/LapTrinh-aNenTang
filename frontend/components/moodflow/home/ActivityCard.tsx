import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, Activity } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface ActivityCardProps {
  activity: Activity;
  selected: boolean;
  onClick: () => void;
}

export default function ActivityCard({
  activity,
  selected,
  onClick,
}: ActivityCardProps) {
  return (
    <Pressable
      onPress={onClick}
      style={[
        styles.card,
        selected ? styles.cardSelected : styles.cardNormal,
      ]}
    >
      <Icon
        name={activity.icon}
        size={20}
        color={selected ? COLORS.text : COLORS.muted}
      />
      <Text
        style={[
          styles.label,
          { color: selected ? COLORS.text : COLORS.muted },
        ]}
      >
        {activity.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardNormal: {
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.text,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
