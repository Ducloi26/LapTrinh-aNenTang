import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import Icon from '@/components/moodflow/shared/Icon';

interface SettingsPageProps {
  onLogout?: () => void;
  userName?: string;
}

const SETTINGS_ROWS = [
  'Tài khoản',
  'Gu âm nhạc mặc định',
  'Thông báo',
  'Quyền riêng tư',
  'Kết nối YouTube',
  'Ngôn ngữ',
];

export default function SettingsPage({ onLogout, userName }: SettingsPageProps) {
  return (
    <View style={styles.container}>
      <SectionTitle
        title="Cài đặt"
        subtitle={userName ? `Đăng nhập với tên: ${userName}` : undefined}
      />

      <View style={styles.list}>
        {SETTINGS_ROWS.map((row) => (
          <View key={row} style={styles.row}>
            <Text style={styles.rowText}>{row}</Text>
            <Icon name="chevronright" size={16} color={COLORS.faint} />
          </View>
        ))}

        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={16} color={COLORS.danger} />
          <Text style={styles.logoutText}>Đăng xuất khỏi MoodFlow</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowText: {
    color: COLORS.text,
    fontSize: 14.5,
  },
  logoutBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
  },
});
