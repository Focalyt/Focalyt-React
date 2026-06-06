import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeAuthUser } from './normalizeAuthUser';
import type { AuthUser } from './authTypes';

const KEY = 'user';

export async function loadUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return normalizeAuthUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

