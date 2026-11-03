import { JourneySelection, isActivityId, isDurationMinutes, isMoodId } from '@/constants/moodflow';
import { CurrentUser, request } from './api-client';

export const DEFAULT_JOURNEY_DEFAULTS: JourneySelection = {
  moodFrom: 'deep_focus', moodTo: 'calm_unwind', activity: 'deep_work', duration: 30,
};

export interface SettingsDocument {
  journeyDefaults: JourneySelection;
  privacy: { defaultJourneyVisibility: JourneyVisibility };
  updatedAt: string | null;
}

export type JourneyVisibility = 'private' | 'public';
export const PRIVACY_CHOICES: { id: JourneyVisibility; label: string }[] = [
  { id: 'private', label: 'Chỉ mình tôi' },
  { id: 'public', label: 'Cho phép chia sẻ lên cộng đồng' },
];

function userFromResponse(user: CurrentUser): CurrentUser {
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string'
    || typeof user.displayName !== 'string' || !['user', 'admin'].includes(user.role)) {
    throw new Error('Thông tin tài khoản không hợp lệ.');
  }
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
}

function settingsFromResponse(data: SettingsDocument): SettingsDocument {
  const value = data.journeyDefaults;
  if (!value || !isMoodId(value.moodFrom) || !isMoodId(value.moodTo)
    || !isActivityId(value.activity) || !isDurationMinutes(value.duration)
    || !(data.updatedAt === null || (typeof data.updatedAt === 'string' && Number.isFinite(Date.parse(data.updatedAt))))) {
    throw new Error('Cài đặt từ máy chủ không đúng đặc tả.');
  }
  return { journeyDefaults: { moodFrom: value.moodFrom, moodTo: value.moodTo, activity: value.activity, duration: value.duration },
    privacy: { defaultJourneyVisibility: data.privacy?.defaultJourneyVisibility === 'public' ? 'public' : 'private' },
    updatedAt: data.updatedAt };
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const data = await request<{ user: CurrentUser }>('/auth/me', { signal });
  return userFromResponse(data.user);
}

export async function renameCurrentUser(displayName: string, signal?: AbortSignal): Promise<CurrentUser> {
  const data = await request<{ user: CurrentUser }>('/auth/me', {
    method: 'PATCH', body: JSON.stringify({ displayName: displayName.trim() }), signal,
  });
  return userFromResponse(data.user);
}

export async function getSettings(signal?: AbortSignal): Promise<SettingsDocument> {
  return settingsFromResponse(await request<SettingsDocument>('/settings', { signal }));
}

export async function saveSettings(journeyDefaults: JourneySelection, expectedUpdatedAt: string | null,
  signal?: AbortSignal): Promise<SettingsDocument> {
  return settingsFromResponse(await request<SettingsDocument>('/settings', {
    method: 'PATCH', body: JSON.stringify({ journeyDefaults, expectedUpdatedAt }), signal,
  }));
}

export async function savePrivacyDefault(defaultJourneyVisibility: JourneyVisibility, expectedUpdatedAt: string | null,
  signal?: AbortSignal): Promise<SettingsDocument> {
  return settingsFromResponse(await request<SettingsDocument>('/settings', {
    method: 'PATCH', body: JSON.stringify({ privacy: { defaultJourneyVisibility }, expectedUpdatedAt }), signal,
  }));
}
