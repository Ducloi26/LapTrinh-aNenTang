import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ACTIVITIES, COLORS, DURATIONS, JourneySelection, MOODS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import Icon from '@/components/moodflow/shared/Icon';
import { CurrentUser } from '@/services/api-client';
import { DEFAULT_JOURNEY_DEFAULTS, JourneyVisibility, PRIVACY_CHOICES, SettingsDocument, getSettings, renameCurrentUser, savePrivacyDefault, saveSettings } from '@/services/settings-service';

interface SettingsPageProps {
  user: CurrentUser;
  onUserChanged: (user: CurrentUser) => void;
  onDefaultsChanged: (value: JourneySelection) => void;
  onLogout: () => void;
}

const MOOD_CHOICES = MOODS.map((mood) => ({ id: mood.id, label: `${mood.emoji} ${mood.label}` }));
const equalDefaults = (a: JourneySelection, b: JourneySelection) =>
  a.moodFrom === b.moodFrom && a.moodTo === b.moodTo && a.activity === b.activity && a.duration === b.duration;

function Choices<T extends string | number>({ label, options, value, onChange, disabled }: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => (
          <Pressable key={option.id} disabled={disabled} accessibilityRole="button"
            accessibilityState={{ selected: option.id === value, disabled }}
            onPress={() => onChange(option.id)}
            style={[styles.choice, option.id === value && styles.selected, disabled && styles.disabled]}>
            <Text style={[styles.choiceText, option.id === value && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SettingsPage({ user, onUserChanged, onDefaultsChanged, onLogout }: SettingsPageProps) {
  const [name, setName] = useState(user.displayName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [document, setDocument] = useState<SettingsDocument | null>(null);
  const [draft, setDraft] = useState<JourneySelection>({ ...DEFAULT_JOURNEY_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<JourneyVisibility>('private');
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const scope = useRef<AbortController | null>(null);

  const load = useCallback(async (signal: AbortSignal, preserveDraft = false) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await getSettings(signal);
      if (signal.aborted) return;
      setDocument(result);
      if (!preserveDraft) {
        setDraft(result.journeyDefaults);
        setPrivacy(result.privacy.defaultJourneyVisibility);
      }
      setPrivacyError(null);
    } catch (failure) {
      if (!signal.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được cài đặt.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const saveName = async () => {
    const signal = scope.current?.signal;
    if (!signal || signal.aborted || nameSaving) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) {
      setNameError('Tên hiển thị phải có từ 1 đến 100 ký tự.');
      return;
    }
    setNameSaving(true);
    setNameError(null);
    setNameMessage(null);
    try {
      const result = await renameCurrentUser(trimmed, signal);
      if (signal.aborted) return;
      setName(result.displayName);
      onUserChanged(result);
      setNameMessage('Đã lưu tên hiển thị.');
    } catch (failure) {
      if (!signal.aborted) setNameError(failure instanceof Error ? failure.message : 'Không lưu được tên.');
    } finally {
      if (!signal.aborted) setNameSaving(false);
    }
  };

  const saveDefaults = async () => {
    const signal = scope.current?.signal;
    if (!document || !signal || signal.aborted || saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await saveSettings(draft, document.updatedAt, signal);
      if (signal.aborted) return;
      setDocument(result);
      setDraft(result.journeyDefaults);
      onDefaultsChanged(result.journeyDefaults);
      setMessage('Đã lưu gu mặc định. Bạn có thể áp dụng lại ở Trang chủ; journey đang nghe được giữ nguyên.');
    } catch (failure) {
      if (!signal.aborted) setError(failure instanceof Error ? failure.message : 'Không lưu được cài đặt.');
    } finally {
      if (!signal.aborted) setSaving(false);
    }
  };

  const change = <K extends keyof JourneySelection>(key: K, value: JourneySelection[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };
  const savePrivacy = async () => {
    const signal = scope.current?.signal;
    if (!document || !signal || signal.aborted || saving || privacySaving) return;
    setPrivacySaving(true); setPrivacyError(null); setPrivacyMessage(null);
    try {
      const result = await savePrivacyDefault(privacy, document.updatedAt, signal);
      if (signal.aborted) return;
      setDocument(result); setPrivacy(result.privacy.defaultJourneyVisibility);
      setPrivacyMessage('Đã lưu. Quyền mặc định chỉ áp dụng cho journey tạo sau đó.');
    } catch (failure) {
      if (!signal.aborted) setPrivacyError(failure instanceof Error ? failure.message : 'Không lưu được quyền mặc định.');
    } finally { if (!signal.aborted) setPrivacySaving(false); }
  };
  const busy = loading || saving || privacySaving;
  const dirty = document && !equalDefaults(draft, document.journeyDefaults);

  return (
    <View style={styles.container}>
      <SectionTitle title="Cài đặt" subtitle="Tùy chỉnh tài khoản và lựa chọn cho journey của bạn." />
      <View style={styles.card}>
        <Text style={styles.heading}>Tài khoản</Text>
        <Text style={styles.label}>Email đăng nhập</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.label}>Tên hiển thị</Text>
        <TextInput accessibilityLabel="Tên hiển thị" value={name} maxLength={100} editable={!nameSaving}
          onChangeText={(value) => { setName(value); setNameMessage(null); setNameError(null); }}
          style={styles.input} placeholder="Nhập tên của bạn" placeholderTextColor={COLORS.faint} />
        {nameError ? <Text accessibilityRole="alert" style={styles.error}>{nameError}</Text> : null}
        {nameMessage ? <Text style={styles.success}>{nameMessage}</Text> : null}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={saveName}
            disabled={nameSaving || name.trim() === user.displayName}
            style={[styles.primary, (nameSaving || name.trim() === user.displayName) && styles.disabled]}>
            <Text style={styles.primaryText}>{nameSaving ? 'Đang lưu tên...' : 'Lưu tên'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={nameSaving} style={styles.secondary}
            onPress={() => { setName(user.displayName); setNameError(null); setNameMessage(null); }}>
            <Text style={styles.text}>Hủy thay đổi tên</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Gu journey mặc định</Text>
        <Text style={styles.hint}>Dùng khi bắt đầu phiên mới hoặc khi bạn chọn áp dụng gu mặc định trên Trang chủ.</Text>
        {loading ? <ActivityIndicator accessibilityLabel="Đang tải cài đặt" color="#22D3EE" /> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!loading && error ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => scope.current && void load(scope.current.signal, !!document)} style={styles.secondary}>
            <Text style={styles.text}>Tải lại cài đặt</Text>
          </Pressable>
        ) : null}
        {document && (
          <>
            <Choices label="Tâm trạng ban đầu" options={MOOD_CHOICES} value={draft.moodFrom}
              onChange={(value) => change('moodFrom', value)} disabled={busy} />
            <Choices label="Tâm trạng mục tiêu" options={MOOD_CHOICES} value={draft.moodTo}
              onChange={(value) => change('moodTo', value)} disabled={busy} />
            <Choices label="Hoạt động" options={ACTIVITIES} value={draft.activity}
              onChange={(value) => change('activity', value)} disabled={busy} />
            <Choices label="Thời lượng" options={DURATIONS} value={draft.duration}
              onChange={(value) => change('duration', value)} disabled={busy} />
            {message ? <Text style={styles.success}>{message}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={busy || !dirty} onPress={saveDefaults}
                style={[styles.primary, (busy || !dirty) && styles.disabled]}>
                <Text style={styles.primaryText}>{saving ? 'Đang lưu gu...' : 'Lưu gu mặc định'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary}
                onPress={() => { setDraft(document.journeyDefaults); setError(null); setMessage(null); }}>
                <Text style={styles.text}>Hủy thay đổi gu</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary}
                onPress={() => { setDraft({ ...DEFAULT_JOURNEY_DEFAULTS }); setMessage('Đã chọn cấu hình gốc. Nhấn Lưu gu mặc định để xác nhận.'); }}>
                <Text style={styles.text}>Khôi phục mặc định</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {document && <View style={styles.card}>
        <Text style={styles.heading}>Quyền riêng tư journey</Text>
        <Text style={styles.hint}>Chỉ áp dụng cho journey tạo mới. Cho phép chia sẻ không tự đăng bài lên cộng đồng.</Text>
        <Choices label="Quyền mặc định" options={PRIVACY_CHOICES} value={privacy}
          disabled={busy} onChange={(value) => { setPrivacy(value); setPrivacyMessage(null); }} />
        {privacy === 'public' && <Text style={styles.hint}>Khi chủ động đăng bài, tiêu đề, Mood, hoạt động, thời lượng và danh sách bài hát sẽ được chia sẻ.</Text>}
        {privacyError && <Text accessibilityRole="alert" style={styles.error}>{privacyError}</Text>}
        {privacyMessage && <Text style={styles.success}>{privacyMessage}</Text>}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy || privacy === document.privacy.defaultJourneyVisibility}
            style={[styles.primary, (busy || privacy === document.privacy.defaultJourneyVisibility) && styles.disabled]} onPress={savePrivacy}>
            <Text style={styles.primaryText}>{privacySaving ? 'Đang lưu quyền...' : 'Lưu quyền mặc định'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary}
            onPress={() => { setPrivacy(document.privacy.defaultJourneyVisibility); setPrivacyError(null); setPrivacyMessage(null); }}>
            <Text style={styles.text}>Hủy thay đổi quyền</Text>
          </Pressable>
          {privacyError && <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary}
            onPress={() => scope.current && void load(scope.current.signal, true)}>
            <Text style={styles.text}>Tải lại cài đặt</Text>
          </Pressable>}
        </View>
      </View>}

      <View style={styles.card}>
        <Text style={styles.heading}>Tính năng khác</Text>
        {['Thông báo', 'Kết nối YouTube', 'Ngôn ngữ'].map((label) => (
          <View key={label} style={styles.row}>
            <Text style={styles.text}>{label}</Text><Text style={styles.hint}>Chưa hỗ trợ</Text>
          </View>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={onLogout} style={styles.logout}>
        <Icon name="logout" size={16} color={COLORS.danger} />
        <Text style={styles.error}>Đăng xuất khỏi MoodFlow</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 760, alignSelf: 'center', width: '100%', paddingBottom: 60, gap: 20 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 20, gap: 12 },
  heading: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  label: { color: COLORS.muted, fontSize: 13 },
  email: { color: COLORS.text, fontSize: 15, marginBottom: 8 },
  text: { color: COLORS.text, fontSize: 14 },
  input: { color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15 },
  group: { gap: 8, marginTop: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10 },
  choiceText: { color: COLORS.muted, fontSize: 13 },
  selected: { backgroundColor: 'rgba(34,211,238,0.10)', borderColor: '#22D3EE' },
  selectedText: { color: '#22D3EE' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  primary: { backgroundColor: '#22D3EE', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: COLORS.bg, fontWeight: '700', fontSize: 14 },
  secondary: { paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10 },
  disabled: { opacity: 0.45 },
  hint: { color: COLORS.faint, fontSize: 12, lineHeight: 19 },
  success: { color: '#67E8F9', fontSize: 13, lineHeight: 20 },
  error: { color: COLORS.danger, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  logout: { borderWidth: 1, borderColor: 'rgba(251,113,133,0.35)', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
});
