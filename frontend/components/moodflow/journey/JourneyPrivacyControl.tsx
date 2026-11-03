import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import { ApiError } from '@/services/api-client';
import { JourneyPrivacy, getSavedJourneys, updateJourneyPrivacy } from '@/services/journey-service';
import { JourneyVisibility, PRIVACY_CHOICES } from '@/services/settings-service';

export default function JourneyPrivacyControl({ id, privacy, onChanged }: {
  id: string; privacy: JourneyPrivacy; onChanged: (privacy: JourneyPrivacy) => void;
}) {
  const [target, setTarget] = useState<JourneyVisibility | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const scope = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    return () => controller.abort();
  }, [id]);

  const save = async () => {
    const signal = scope.current?.signal;
    if (!target || !signal || signal.aborted || busy || conflict) return;
    setBusy(true); setError(null);
    try {
      const result = await updateJourneyPrivacy(id, target, privacy, signal);
      if (signal.aborted) return;
      onChanged(result); setTarget(null);
    } catch (failure) {
      if (signal.aborted) return;
      setConflict(failure instanceof ApiError && failure.status === 409);
      setError(failure instanceof Error ? failure.message : 'Không đổi được quyền.');
    } finally { if (!signal.aborted) setBusy(false); }
  };
  const reload = async () => {
    const signal = scope.current?.signal;
    if (!signal || signal.aborted || busy) return;
    setBusy(true);
    try {
      const saved = (await getSavedJourneys(signal)).find((item) => item.id === id);
      if (signal.aborted) return;
      if (!saved) throw new Error('Hành trình không còn trong thư viện.');
      onChanged(saved); setConflict(false); setError(null);
    } catch (failure) {
      if (!signal.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được quyền.');
    } finally { if (!signal.aborted) setBusy(false); }
  };
  if (!Number.isSafeInteger(privacy.share_version)) return null;
  return (
    <View style={{ gap: 10, marginVertical: 12 }}>
      <Text style={{ color: COLORS.muted }}>{privacy.is_public ? PRIVACY_CHOICES[1].label : PRIVACY_CHOICES[0].label}</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setTarget(privacy.is_public ? 'private' : 'public')}>
        <Text style={{ color: '#22D3EE' }}>Đổi quyền journey</Text>
      </Pressable>
      {target && <View style={{ gap: 10 }}>
        <Text style={{ color: COLORS.text }}>{target === 'private'
          ? 'Thu hồi các bài đã chia sẻ. Bật chia sẻ lại sẽ không khôi phục bài cũ; bạn cần đăng bài mới.'
          : 'Cho phép chia sẻ tiêu đề, Mood, hoạt động, thời lượng và danh sách bài hát. Bạn vẫn cần chủ động đăng bài lên cộng đồng.'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
          <Pressable accessibilityRole="button" disabled={busy || conflict} onPress={save}>
            <Text style={{ color: busy || conflict ? COLORS.faint : '#22D3EE' }}>{busy ? 'Đang cập nhật...' : 'Xác nhận đổi quyền'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setTarget(null); setError(null); }}>
            <Text style={{ color: COLORS.muted }}>Hủy đổi quyền</Text>
          </Pressable>
        </View>
      </View>}
      {error && <Text accessibilityRole="alert" style={{ color: COLORS.danger }}>{error}</Text>}
      {conflict && <Pressable accessibilityRole="button" disabled={busy} onPress={reload}>
        <Text style={{ color: '#22D3EE' }}>Tải lại quyền hiện tại</Text>
      </Pressable>}
    </View>
  );
}
