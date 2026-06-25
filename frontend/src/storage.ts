import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AppData, DEFAULT_CASH_COUNTS, DEFAULT_KASA_SETTINGS } from './types';

const KEY = 'cari_app_data_v1';

const empty: AppData = {
  companies: [],
  banks: [],
  cards: [],
  transactions: [],
  cashCounts: { ...DEFAULT_CASH_COUNTS },
  kasaEntries: [],
  kasaTransactions: [],
  kasaSettings: { ...DEFAULT_KASA_SETTINGS },
};

// On web (preview) prefer localStorage to avoid IndexedDB init delays.
function webGet(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(KEY);
    }
  } catch {}
  return null;
}

function webSet(value: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(KEY, value);
    }
  } catch {}
}

export async function loadData(): Promise<AppData> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = webGet();
    } else {
      raw = await AsyncStorage.getItem(KEY);
    }
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      companies: parsed.companies || [],
      banks: parsed.banks || [],
      cards: parsed.cards || [],
      transactions: parsed.transactions || [],
      cashCounts: { ...DEFAULT_CASH_COUNTS, ...(parsed.cashCounts || {}) },
      kasaEntries: parsed.kasaEntries || [],
      kasaTransactions: parsed.kasaTransactions || [],
      kasaSettings: { ...DEFAULT_KASA_SETTINGS, ...(parsed.kasaSettings || {}) },
    };
  } catch (e) {
    console.warn('loadData failed', e);
    return empty;
  }
}

export async function saveData(data: AppData): Promise<void> {
  const json = JSON.stringify(data);
  if (Platform.OS === 'web') {
    webSet(json);
    return;
  }
  await AsyncStorage.setItem(KEY, json);
}

export async function clearData(): Promise<void> {
  if (Platform.OS === 'web') {
    try { window.localStorage.removeItem(KEY); } catch {}
    return;
  }
  await AsyncStorage.removeItem(KEY);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
