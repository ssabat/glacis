'use client'

import useSWR from 'swr'
import { Mountain } from 'lucide-react'
import { fetcher, type Health } from '@/lib/glacier'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const { data: health, error } = useSWR<Health>('/api/py/health', fetcher)
  const session = health?.session

  return (
    <header className="border-b border-border bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Mountain className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight text-balance">GlacierGuard</h1>
            <p className="text-xs text-muted-foreground">GLOF early warning · Nepal · India · Bhutan</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="max-w-48 truncate font-mono" title={health?.model}>
              {health?.model.split('/').pop() ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mode</dt>
            <dd className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 rounded-full',
                  error ? 'bg-risk-critical' : health?.live ? 'bg-risk-low' : 'bg-risk-moderate',
                )}
              />
              {error ? 'Backend offline' : health?.live ? 'Live · Nebius' : 'Mock (no API key)'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Session tokens</dt>
            <dd className="font-mono tabular-nums">
              {session ? `${session.tokens_in + session.tokens_out}` : '—'}
              {session && <span className="text-muted-foreground"> · {session.cache_hits} cached</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Session cost</dt>
            <dd className="font-mono tabular-nums">{session ? `$${session.cost_usd.toFixed(6)}` : '—'}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}
