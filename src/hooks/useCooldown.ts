import { useState, useEffect, useCallback } from 'react';

export type CooldownActionKey = 
  | 'fetch_repo' 
  | 'load_repos' 
  | 'verify_pat' 
  | 'run_analysis' 
  | 'push_github' 
  | 'load_sample'
  | 'quick_scan';

export interface CooldownItem {
  key: CooldownActionKey;
  label: string;
  defaultSeconds: number;
  endTime: number;
  totalDuration: number;
}

export type CooldownMode = 'relaxed' | 'standard' | 'strict' | 'custom';

const DEFAULT_COOLDOWNS: Record<CooldownActionKey, { label: string; standardSec: number; relaxedSec: number; strictSec: number }> = {
  fetch_repo: { label: 'Repository History Scan', standardSec: 6, relaxedSec: 3, strictSec: 12 },
  load_repos: { label: 'Discover Repositories', standardSec: 5, relaxedSec: 2, strictSec: 10 },
  verify_pat: { label: 'Token Verification', standardSec: 4, relaxedSec: 2, strictSec: 8 },
  run_analysis: { label: 'AI Archaeological Engine', standardSec: 5, relaxedSec: 2, strictSec: 10 },
  push_github: { label: 'GitHub Deliverable Export', standardSec: 8, relaxedSec: 4, strictSec: 15 },
  load_sample: { label: 'Sample Data Loader', standardSec: 3, relaxedSec: 1, strictSec: 6 },
  quick_scan: { label: 'Quick Preset Scan', standardSec: 5, relaxedSec: 2, strictSec: 10 },
};

interface CooldownRecord {
  endTime: number;
  totalDuration: number;
}

export function useCooldown() {
  const [cooldownMode, setCooldownMode] = useState<CooldownMode>(() => {
    return (localStorage.getItem('cae_cooldown_mode') as CooldownMode) || 'standard';
  });

  const [customDurationMultiplier, setCustomDurationMultiplier] = useState<number>(() => {
    return parseFloat(localStorage.getItem('cae_cooldown_custom_multiplier') || '1.0');
  });

  const [activeCooldowns, setActiveCooldowns] = useState<Record<string, CooldownRecord>>({});
  const [, setTick] = useState<number>(0);

  // Load cooldown settings change
  const updateCooldownMode = (mode: CooldownMode, multiplier?: number) => {
    setCooldownMode(mode);
    localStorage.setItem('cae_cooldown_mode', mode);
    if (multiplier !== undefined) {
      setCustomDurationMultiplier(multiplier);
      localStorage.setItem('cae_cooldown_custom_multiplier', multiplier.toString());
    }
  };

  // High-precision clock ticker for smooth timer rendering
  useEffect(() => {
    const items: CooldownRecord[] = Object.values(activeCooldowns);
    const hasActive = items.some((item: CooldownRecord) => item.endTime > Date.now());
    if (!hasActive) return;

    const interval = setInterval(() => {
      setTick(t => (t + 1) % 10000);
      
      // Prune expired cooldowns
      setActiveCooldowns((prev: Record<string, CooldownRecord>) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, CooldownRecord> = {};
        for (const [k, v] of Object.entries(prev) as [string, CooldownRecord][]) {
          if (v && v.endTime > now) {
            next[k] = v;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeCooldowns]);

  // Compute duration in seconds based on active mode
  const getActionDuration = useCallback((key: CooldownActionKey, customSec?: number): number => {
    if (customSec !== undefined && customSec > 0) return customSec;
    const config = DEFAULT_COOLDOWNS[key];
    if (!config) return 5;

    switch (cooldownMode) {
      case 'relaxed':
        return config.relaxedSec;
      case 'strict':
        return config.strictSec;
      case 'custom':
        return Math.max(1, Math.round(config.standardSec * customDurationMultiplier));
      case 'standard':
      default:
        return config.standardSec;
    }
  }, [cooldownMode, customDurationMultiplier]);

  // Trigger a cooldown timer for an action
  const startCooldown = useCallback((key: CooldownActionKey, customSec?: number) => {
    const durationSec = getActionDuration(key, customSec);
    const durationMs = durationSec * 1000;
    const endTime = Date.now() + durationMs;

    setActiveCooldowns(prev => ({
      ...prev,
      [key]: { endTime, totalDuration: durationMs }
    }));
  }, [getActionDuration]);

  // Check if an action is currently in cooldown
  const isCooling = useCallback((key: CooldownActionKey): boolean => {
    const item = activeCooldowns[key];
    if (!item) return false;
    return item.endTime > Date.now();
  }, [activeCooldowns]);

  // Get remaining seconds (formatted to 1 decimal if < 3s or integer)
  const getRemainingSeconds = useCallback((key: CooldownActionKey): number => {
    const item = activeCooldowns[key];
    if (!item) return 0;
    const remainingMs = Math.max(0, item.endTime - Date.now());
    return Math.ceil(remainingMs / 1000);
  }, [activeCooldowns]);

  // Get remaining progress fraction (1.0 = full cooldown remaining, 0.0 = ready)
  const getCooldownProgress = useCallback((key: CooldownActionKey): number => {
    const item = activeCooldowns[key];
    if (!item) return 0;
    const remainingMs = Math.max(0, item.endTime - Date.now());
    if (remainingMs === 0 || !item.totalDuration) return 0;
    return Math.min(1, remainingMs / item.totalDuration);
  }, [activeCooldowns]);

  // Check any active cooldown
  const anyActiveKey = (Object.keys(activeCooldowns) as CooldownActionKey[]).find(k => {
    const v = activeCooldowns[k];
    return v && v.endTime > Date.now();
  });

  const allRecords: CooldownRecord[] = Object.values(activeCooldowns);
  const maxRemainingSeconds: number = allRecords.reduce((max: number, item: CooldownRecord) => {
    const rem = Math.max(0, item.endTime - Date.now());
    return Math.max(max, Math.ceil(rem / 1000));
  }, 0);

  return {
    cooldownMode,
    setCooldownMode: updateCooldownMode,
    updateCooldownMode,
    customDurationMultiplier,
    startCooldown,
    isCooling,
    getRemainingSeconds,
    getCooldownProgress,
    isAnyCooling: Boolean(anyActiveKey),
    activeKey: anyActiveKey,
    maxRemainingSeconds,
    config: DEFAULT_COOLDOWNS,
  };
}
