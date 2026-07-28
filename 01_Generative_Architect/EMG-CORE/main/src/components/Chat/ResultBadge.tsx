import React, { memo, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ResultStatus = 'OK' | 'DRIFT' | 'ERR' | 'PENDING';

interface ResultBadgeProps {
  status: ResultStatus;
  confidence: number;
  provider: string;
  className?: string;
}

const STATUS_CONFIG = {
  OK: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', spin: false },
  DRIFT: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', spin: false },
  ERR: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', spin: false },
  PENDING: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', spin: true },
} as const;

export const ResultBadge = memo(({ status, confidence, provider, className }: ResultBadgeProps) => {
  const config = useMemo(() => STATUS_CONFIG[status], [status]);
  const Icon = config.icon;

  const confidenceLabel = useMemo(() => 
    confidence < 0.5 ? 'LOW_CONFIDENCE' : 'HIGH_CONFIDENCE',
    [confidence]
  );

  return (
    <div 
      role="status"
      aria-live="polite"
      aria-label={`System status: ${status}, Confidence: ${(confidence * 100).toFixed(0)}%`}
      className={twMerge(
        'flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all duration-300',
        config.bg, 
        config.color, 
        config.border,
        status === 'DRIFT' && 'animate-pulse',
        className
      )}
    >
      <Icon className={clsx('w-3 h-3', config.spin && 'animate-spin')} />
      <span className="font-bold uppercase tracking-wider">{provider}</span>
      <span className="opacity-40">|</span>
      <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
      {confidence < 0.6 && (
        <ShieldAlert className="w-3 h-3 ml-1 opacity-60" title={confidenceLabel} />
      )}
    </div>
  );
});

ResultBadge.displayName = 'ResultBadge';