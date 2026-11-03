import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function read(key: string): Promise<string | null> {
  return Platform.OS === 'web'
    ? (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
    : AsyncStorage.getItem(key);
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') throw new Error('Bộ nhớ phiên chưa sẵn sàng.');
    localStorage.setItem(key, value);
  } else await AsyncStorage.setItem(key, value);
}

export async function cacheUser(user: CurrentUser): Promise<void> {
  await write('moodflow_user', JSON.stringify(user));
}

export async function saveSession(token: string, user: CurrentUser): Promise<void> {
  if (typeof token !== 'string' || !token) throw new Error('Máy chủ chưa cấp phiên đăng nhập.');
  await write('moodflow_token', token);
  await cacheUser(user);
}

export async function clearSession(): Promise<void> {
  for (const key of ['moodflow_token', 'moodflow_user']) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } else await AsyncStorage.removeItem(key);
  }
}

export async function request<T = Record<string, unknown>>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  let token: string | null = null;
  if (authenticated) {
    token = await read('moodflow_token');
    if (!token) throw new ApiError('Vui lòng đăng nhập để tiếp tục.', 401, 'MISSING_SESSION');
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`http://localhost:5000/api${path}`, {
      ...options, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const data = await response.json();
    if (!response.ok || data.success !== true) {
      throw new ApiError(data.error || 'Không thể kết nối database.', response.status, data.code);
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new Error('Kết nối quá thời gian chờ. Kiểm tra dữ liệu trước khi thử lưu lại.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
