import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { COLORS, NAV_ITEMS } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface MobileNavProps {
  page: string;
  setPage: (p: string) => void;
  onLogout?: () => void;
}

export default function MobileNav({ page, setPage, onLogout }: MobileNavProps) {
  const items = NAV_ITEMS.slice(0, 5);

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = page === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => setPage(item.id)}
            style={styles.tab}
          >
            <Icon
              name={item.icon}
              size={20}
              color={active ? COLORS.text : COLORS.faint}
            />
          </Pressable>
        );
      })}
      <Pressable onPress={() => setPage('settings')} style={styles.tab}>
        <Icon
          name="settings"
          size={20}
          color={page === 'settings' ? COLORS.text : COLORS.faint}
        />
      </Pressable>
      {onLogout && (
        <Pressable onPress={onLogout} style={styles.tab}>
          <Icon name="logout" size={18} color={COLORS.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 40,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});
