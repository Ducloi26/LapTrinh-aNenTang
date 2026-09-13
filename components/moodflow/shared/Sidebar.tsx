import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, NAV_ITEMS, Mood, moodById } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  currentMood: Mood;
  userName: string;
  onLogout?: () => void;
}

export default function Sidebar({
  page,
  setPage,
  collapsed,
  setCollapsed,
  currentMood,
  userName,
  onLogout,
}: SidebarProps) {
  return (
    <View style={[styles.aside, { width: collapsed ? 76 : 232 }]}>
      {/* Brand Header */}
      <View style={styles.header}>
        {!collapsed && (
          <View style={styles.brandRow}>
            <LinearGradient
              colors={currentMood.colors}
              style={styles.brandIcon}
            />
            <Text style={styles.brandText}>MoodFlow</Text>
          </View>
        )}
        {collapsed && (
          <LinearGradient
            colors={currentMood.colors}
            style={[styles.brandIcon, { marginHorizontal: 'auto' }]}
          />
        )}
        <Pressable
          onPress={() => setCollapsed(!collapsed)}
          style={[styles.collapseBtn, collapsed && { display: 'none' }]}
        >
          <Icon name="chevronleft" size={16} color={COLORS.faint} />
        </Pressable>
      </View>

      {collapsed && (
        <Pressable
          onPress={() => setCollapsed(false)}
          style={{ alignItems: 'center', marginBottom: 10 }}
        >
          <Icon name="chevronright" size={16} color={COLORS.faint} />
        </Pressable>
      )}

      {/* Navigation Items */}
      <View style={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPage(item.id)}
              style={[
                styles.navItem,
                {
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  paddingHorizontal: collapsed ? 0 : 12,
                  backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                },
              ]}
            >
              {active && !collapsed && (
                <LinearGradient
                  colors={currentMood.colors}
                  style={styles.activeIndicator}
                />
              )}
              <Icon
                name={item.icon}
                size={17}
                color={active ? COLORS.text : COLORS.muted}
              />
              {!collapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: active ? COLORS.text : COLORS.muted,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* User Footer */}
      <View
        style={[
          styles.footer,
          { justifyContent: collapsed ? 'center' : 'flex-start' },
        ]}
      >
        <LinearGradient
          colors={moodById('dreamy').colors}
          style={styles.userAvatar}
        >
          <Text style={styles.userInitial}>
            {(userName || 'L').charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>

        {!collapsed && (
          <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName || 'Lợi'}
            </Text>
            <Text style={styles.userSub}>Music DNA · 82%</Text>
          </View>
        )}

        {!collapsed && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable onPress={() => setPage('settings')} style={{ padding: 4 }}>
              <Icon name="settings" size={16} color={COLORS.faint} />
            </Pressable>
            {onLogout && (
              <Pressable
                onPress={onLogout}
                style={{
                  padding: 5,
                  borderRadius: 6,
                  backgroundColor: 'rgba(251, 113, 133, 0.1)',
                }}
              >
                <Icon name="logout" size={15} color={COLORS.danger} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aside: {
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    flexDirection: 'column',
    height: '100%',
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  brandText: {
    fontSize: 19,
    fontWeight: '500',
    color: COLORS.text,
  },
  collapseBtn: {
    padding: 4,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 4,
  },
  navLabel: {
    fontSize: 14,
    marginLeft: 12,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  userSub: {
    fontSize: 11.5,
    color: COLORS.faint,
  },
});
