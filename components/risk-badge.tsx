import { cn } from '@/lib/utils'
import { RISK_STYLES, type RiskLevel } from '@/lib/glacier'

export function RiskBadge({ level, score, className }: { level: RiskLevel; score?: number; className?: string }) {
  const style = RISK_STYLES[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        style.border,
        style.text,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.bg)} aria-hidden="true" />
      {style.label}
      {score !== undefined && <span className="font-mono tabular-nums opacity-80">{score}</span>}
    </span>
  )
}
