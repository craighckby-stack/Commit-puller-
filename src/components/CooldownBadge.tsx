import React from 'react';
import { Timer, ShieldCheck } from 'lucide-react';
import { CooldownActionKey } from '../hooks/useCooldown';

export type CooldownSize = 'sm' | 'md' | 'lg';

// ============================================================================
// Style Maps
// ============================================================================

const COOLING_CONTAINER_STYLES: Record<CooldownSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30',
  md: 'px-2.5 py-1 text-xs bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-sm',
  lg: 'px-3 py-1.5 text-sm bg-amber-500/20 text-amber-200 border-amber-500/40',
};

const READY_CONTAINER_STYLES: Record<CooldownSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  md: 'px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  lg: 'px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
};

const ICON_SIZE_STYLES: Record<CooldownSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-3.5 h-3.5',
};

// ============================================================================
// Components
// ============================================================================

export interface CooldownBadgeProps {
  isCooling: boolean;
  remainingSeconds: number;
  label?: string;
  size?: CooldownSize;
  showReadyState?: boolean;
}

export function CooldownBadge({
  isCooling,
  remainingSeconds,
  label,
  size = 'sm',
  showReadyState = false,
}: CooldownBadgeProps): React.JSX.Element | null {
  if (!isCooling && !showReadyState) {
    return null;
  }

  const iconClass = ICON_SIZE_STYLES[size];

  if (isCooling) {
    const formattedLabel = label ? `${label}: ` : '';

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold tracking-tight rounded-lg border transition-all animate-pulse ${COOLING_CONTAINER_STYLES[size]}`}
        title="Cooldown in progress to respect GitHub & AI API rate limits"
      >
        <Timer className={`${iconClass} text-amber-400 animate-spin`} />
        <span>
          {formattedLabel}
          {remainingSeconds}s
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold rounded-lg border transition-all ${READY_CONTAINER_STYLES[size]}`}
      title="API rate limits respected and ready for next execution"
    >
      <ShieldCheck className={`${iconClass} text-emerald-400`} />
      <span>Ready</span>
    </span>
  );
}

export interface CooldownButtonTextProps {
  isCooling: boolean;
  remainingSeconds: number;
  idleText: React.ReactNode;
  coolingText?: string;
  icon?: React.ReactNode;
}

export function CooldownButtonContent({
  isCooling,
  remainingSeconds,
  idleText,
  coolingText = 'Cooling down',
  icon,
}: CooldownButtonTextProps): React.JSX.Element {
  if (isCooling) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono">
        <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>
          {coolingText} ({remainingSeconds}s)
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span>{idleText}</span>
    </span>
  );
}

export interface RateLimitStatusHeaderProps {
  isAnyCooling: boolean;
  maxRemainingSeconds: number;
  activeKey?: CooldownActionKey;
  mode: string;
}

export function RateLimitStatusHeader({
  isAnyCooling,
  maxRemainingSeconds,
  mode,
}: RateLimitStatusHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {isAnyCooling ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <Timer className="w-3 h-3 text-amber-400 animate-spin" />
          <span className="font-semibold">Rate Limit Guard:</span>
          <span className="font-bold text-amber-200">{maxRemainingSeconds}s wait</span>
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Rate Limit Guard Active</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 uppercase">
            {mode}
          </span>
        </div>
      )}
    </div>
  );
}