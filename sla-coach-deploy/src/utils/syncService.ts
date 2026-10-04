// Cloud synchronization service for cross-device persistence (Desktop <-> Mobile Chrome)
import { AssimilProgress, SystemState, UserProfileSummary } from '../types';

export interface UserProgressPayload {
  userEmail?: string;
  displayName?: string;
  currentAssimilLessonNum: number;
  assimilProgress: AssimilProgress;
  systemState?: SystemState;
  lastUpdated?: number;
  allowNavigationReview?: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

type SyncListener = (status: SyncStatus, lastSyncedAt: number | null, userEmail: string) => void;
const listeners = new Set<SyncListener>();
let currentStatus: SyncStatus = 'idle';
let lastSyncedTimestamp: number | null = null;

const STORAGE_KEY_ACTIVE_PROFILE = 'sla_active_profile_email_v1';
const STORAGE_KEY_ACTIVE_NAME = 'sla_active_profile_name_v1';
const STORAGE_KEY_SYNC_CACHE = 'sla_cloud_sync_cache_v1';

export function getActiveProfileEmail(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'AntonioFCM@gmail.com';
}

export function getActiveProfileName(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_NAME);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'Antonio';
}

export function setActiveProfile(email: string, displayName?: string) {
  try {
    const cleanEmail = email.trim();
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, cleanEmail);
    if (displayName) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_NAME, displayName.trim());
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_NAME, cleanEmail.split('@')[0] || 'Antonio');
    }
  } catch {}
  notifyListeners(currentStatus);
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentStatus, lastSyncedTimestamp, getActiveProfileEmail());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(status: SyncStatus) {
  currentStatus = status;
  if (status === 'synced') {
    lastSyncedTimestamp = Date.now();
  }
  const email = getActiveProfileEmail();
  listeners.forEach((fn) => fn(currentStatus, lastSyncedTimestamp, email));
}

export async function fetchServerProgress(userEmail?: string): Promise<UserProgressPayload | null> {
  const targetEmail = (userEmail || getActiveProfileEmail()).trim();
  notifyListeners('syncing');

  try {
    const res = await fetch(`/api/user-progress?email=${encodeURIComponent(targetEmail)}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch server progress: ${res.statusText}`);
    }

    const data = await res.json();
    if (data && data.assimilProgress) {
      try {
        const cacheKey = `${STORAGE_KEY_SYNC_CACHE}_${targetEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY_SYNC_CACHE, JSON.stringify(data));
      } catch {}
      notifyListeners('synced');
      return data;
    }
    notifyListeners('synced');
    return null;
  } catch (err) {
    console.warn('[Sync] Could not reach server for progress sync, falling back to local storage', err);
    notifyListeners('error');
    try {
      const cacheKey = `${STORAGE_KEY_SYNC_CACHE}_${targetEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(STORAGE_KEY_SYNC_CACHE);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return null;
  }
}

let syncTimeout: any = null;

export function triggerServerSyncDebounced(payload: UserProgressPayload, delay = 800) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  notifyListeners('syncing');
  syncTimeout = setTimeout(async () => {
    try {
      await saveServerProgress(payload);
    } catch (e) {
      console.error('[Sync] Error saving progress', e);
    }
  }, delay);
}

export async function saveServerProgress(payload: UserProgressPayload): Promise<UserProgressPayload | null> {
  const userEmail = (payload.userEmail || getActiveProfileEmail()).trim();
  const displayName = payload.displayName || getActiveProfileName();
  notifyListeners('syncing');

  try {
    const res = await fetch('/api/user-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        userEmail,
        displayName,
        lastUpdated: Date.now(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to save progress: ${res.statusText}`);
    }

    const data = await res.json();
    if (data?.progress) {
      try {
        const cacheKey = `${STORAGE_KEY_SYNC_CACHE}_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        localStorage.setItem(cacheKey, JSON.stringify(data.progress));
        localStorage.setItem(STORAGE_KEY_SYNC_CACHE, JSON.stringify(data.progress));
      } catch {}
      notifyListeners('synced');
      return data.progress;
    }
    notifyListeners('synced');
    return null;
  } catch (err) {
    console.warn('[Sync] Failed to persist progress to cloud server', err);
    notifyListeners('error');
    return null;
  }
}

export async function fetchProfilesList(): Promise<{ profiles: UserProfileSummary[]; defaultEmail: string }> {
  try {
    const res = await fetch('/api/profiles');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return {
    profiles: [
      {
        email: 'AntonioFCM@gmail.com',
        displayName: 'Antonio',
        currentLesson: 8,
        completedLessonsCount: 7,
        streakDays: 2,
        lastActive: Date.now(),
        avatarColor: 'from-indigo-600 to-rose-600',
      },
    ],
    defaultEmail: 'AntonioFCM@gmail.com',
  };
}

export async function createNewProfile(email: string, displayName: string): Promise<boolean> {
  try {
    const res = await fetch('/api/profiles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

