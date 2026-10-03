import { cn } from '@/lib/utils'
import type { Lake } from '@/lib/glacier'
import { RiskBadge } from './risk-badge'

export function LakeList({
  lakes,
  selectedId,
  onSelect,
}: {
  lakes: Lake[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav aria-label="Monitored glacial lakes">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Monitored lakes ({lakes.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {lakes.map((lake) => {
          const active = lake.id === selectedId
          return (
            <li key={lake.id}>
              <button
                type="button"
                onClick={() => onSelect(lake.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary/50 bg-accent' : 'border-border bg-card hover:bg-accent/60',
                )}
              >
                <img
                  src={lake.image || '/placeholder.svg'}
                  alt=""
                  className="size-12 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{lake.name}</span>
                    <RiskBadge level={lake.baseline.level} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {lake.region}, {lake.country}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    +{lake.growth_pct_yr}%/yr · {lake.downstream_pop.toLocaleString()} at risk
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
