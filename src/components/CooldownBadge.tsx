import React from 'react';
import { Timer, ShieldCheck, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CooldownActionKey } from '../hooks/useCooldown';

interface CooldownBadgeProps {
  isCooling: boolean;
  remainingSeconds: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showReadyState?: boolean;
}

export function CooldownBadge({
  isCooling,
  remainingSeconds,
  label,
  size = 'sm',
  showReadyState = false,
}: CooldownBadgeProps) {
  if (!isCooling && !showReadyState) return null;

  if (isCooling) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold tracking-tight rounded-lg border transition-all animate-pulse ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30'
            : size === 'md'
            ? 'px-2.5 py-1 text-xs bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-sm'
            : 'px-3 py-1.5 text-sm bg-amber-500/20 text-amber-200 border-amber-500/40'
        }`}
        title="Cooldown in progress to respect GitHub & AI API rate limits"
      >
        <Timer className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 animate-spin`} />
        <span>{label ? `${label}: ` : ''}{remainingSeconds}s</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold rounded-lg border transition-all ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
      }`}
      title="API rate limits respected and ready for next execution"
    >
      <ShieldCheck className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400`} />
      <span>Ready</span>
    </span>
  );
}

interface CooldownButtonTextProps {
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
}: CooldownButtonTextProps) {
  if (isCooling) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono">
        <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>{coolingText} ({remainingSeconds}s)</span>
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

interface RateLimitStatusHeaderProps {
  isAnyCooling: boolean;
  maxRemainingSeconds: number;
  activeKey?: CooldownActionKey;
  mode: string;
}

export function RateLimitStatusHeader({
  isAnyCooling,
  maxRemainingSeconds,
  activeKey,
  mode,
}: RateLimitStatusHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {isAnyCooling ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Timer className="w-3 h-3 text-amber-400 animate-spin" />
          <span className="font-semibold">Rate Limit Guard:</span>
          <span className="font-bold text-amber-200">{maxRemainingSeconds}s wait</span>
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Rate Limit Guard Active</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 uppercase">{mode}</span>
        </div>
      )}
    </div>
  );
}
