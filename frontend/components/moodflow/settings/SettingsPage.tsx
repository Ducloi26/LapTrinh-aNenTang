import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import Icon from '@/components/moodflow/shared/Icon';
import { audioSynth } from '@/services/audio-service';
import type { ReferenceTuning } from '@/services/audio-service';

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
  const [referenceTuning, setReferenceTuning] = useState<ReferenceTuning>(
    audioSynth.selectedReferenceTuning,
  );
  const [tuningError, setTuningError] = useState<string | null>(null);

  const handleTuningChange = async (tuning: ReferenceTuning) => {
    try {
      await audioSynth.setReferenceTuning(tuning);
      setReferenceTuning(tuning);
      setTuningError(null);
    } catch (error) {
      setTuningError(
        error instanceof Error
          ? error.message
          : 'Không thể lưu cài đặt tần số tham chiếu.',
      );
    }
  };

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

        <View style={styles.tuningSection}>
          <Text style={styles.tuningTitle}>Tần số tham chiếu</Text>
          <Text style={styles.tuningDescription}>
            Chọn chuẩn A4 dùng để căn chỉnh binaural beats và hợp âm nền.
          </Text>
          {Platform.OS === 'web' ? (
            <View style={styles.tuningOptions}>
              {([432, 440] as const).map((tuning) => {
                const selected = referenceTuning === tuning;
                return (
                  <Pressable
                    key={tuning}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => void handleTuningChange(tuning)}
                    style={[
                      styles.tuningOption,
                      selected && styles.tuningOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tuningOptionText,
                        selected && styles.tuningOptionTextActive,
                      ]}
                    >
                      {tuning} Hz
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.tuningDescription}>
              Web Audio không khả dụng trên thiết bị này; lớp binaural dùng file có sẵn.
            </Text>
          )}
          {tuningError && (
            <Text accessibilityRole="alert" style={styles.tuningError}>
              {tuningError}
            </Text>
          )}
        </View>

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
  tuningSection: {
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tuningTitle: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  tuningDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  tuningOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tuningOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tuningOptionActive: {
    borderColor: COLORS.ok,
    backgroundColor: 'rgba(103,232,249,0.12)',
  },
  tuningOptionText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tuningOptionTextActive: {
    color: COLORS.ok,
  },
  tuningError: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 8,
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
