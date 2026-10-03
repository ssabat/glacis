import { AlertTriangle, Coins, Cpu, Loader2, Siren, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RISK_STYLES, type AnalyzeResponse, type Lake, type Scenario } from '@/lib/glacier'
import { RiskBadge } from './risk-badge'

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'baseline', label: 'Baseline' },
  { value: 'cloudburst', label: 'Cloudburst' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'heatwave', label: 'Heatwave' },
]

const SOURCE_LABEL: Record<AnalyzeResponse['source'], string> = {
  nemotron: 'Nemotron Nano',
  mock: 'Mock (heuristic)',
  'heuristic-fallback': 'Fallback (heuristic)',
}

export function AnalysisPanel({
  lake,
  scenario,
  onScenarioChange,
  attachImage,
  onAttachImageChange,
  onRun,
  running,
  result,
  error,
}: {
  lake: Lake
  scenario: Scenario
  onScenarioChange: (s: Scenario) => void
  attachImage: boolean
  onAttachImageChange: (v: boolean) => void
  onRun: () => void
  running: boolean
  result?: AnalyzeResponse
  error?: Error
}) {
  const analysis = result?.analysis
  const style = analysis ? RISK_STYLES[analysis.level] : null

  return (
    <aside aria-labelledby="analysis-title" className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 id="analysis-title" className="text-sm font-semibold">
          Agentic risk check
        </h2>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Compresses telemetry + visual cues into ~100 tokens and asks Nemotron for a strict JSON verdict.
        </p>

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs text-muted-foreground">Scenario</legend>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={scenario === s.value}
                onClick={() => onScenarioChange(s.value)}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  scenario === s.value
                    ? 'border-primary/60 bg-primary/15 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            checked={attachImage}
            onChange={(e) => onAttachImageChange(e.target.checked)}
            className="mt-0.5 accent-[var(--primary)]"
          />
          <span>
            Attach satellite image
            <span className="block text-muted-foreground">
              For the Omni variant. Off by default: images cost far more tokens than text features.
            </span>
          </span>
        </label>

        <Button className="mt-4 w-full" size="lg" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Cpu aria-hidden="true" />}
          {running ? 'Analyzing…' : `Analyze ${lake.name}`}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-risk-critical/40 bg-risk-critical/10 p-3 text-sm">
          {error.message}
        </p>
      )}

      <div aria-live="polite">
        {analysis && style && result ? (
          <div className={cn('rounded-xl border bg-card p-4', style.border)}>
            <div className="flex items-center justify-between">
              <RiskBadge level={analysis.level} />
              <span className="text-xs text-muted-foreground">{SOURCE_LABEL[result.source]}</span>
            </div>
            <p className={cn('mt-3 font-mono text-4xl font-semibold tabular-nums', style.text)}>
              {analysis.score}
              <span className="text-base text-muted-foreground">/100</span>
            </p>

            {analysis.evac_h !== null && analysis.evac_h !== undefined && (
              <p className="mt-3 flex items-center gap-2 rounded-md bg-risk-critical/15 px-3 py-2 text-sm">
                <Siren className="size-4 text-risk-critical" aria-hidden="true" />
                Flood wave reaches {lake.first_village} in ~{analysis.evac_h} h
              </p>
            )}

            <h3 className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Drivers</h3>
            <ul className="mt-1 flex flex-col gap-1 text-sm">
              {analysis.drivers.map((d) => (
                <li key={d} className="flex gap-2">
                  <AlertTriangle className={cn('mt-0.5 size-3.5 shrink-0', style.text)} aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>

            <h3 className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</h3>
            <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5 text-sm">
              {analysis.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>

            {result.error && (
              <p className="mt-3 text-xs text-risk-high">Upstream error, used fallback: {result.error}</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Baseline heuristic: <RiskBadge level={lake.baseline.level} score={lake.baseline.score} />
            <p className="mt-2 text-xs">Run a check to get the model verdict.</p>
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Token receipt</h3>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">In / Out</dt>
              <dd className="font-mono tabular-nums">
                {result.tokens_in}/{result.tokens_out}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="size-3" aria-hidden="true" />
                Latency
              </dt>
              <dd className="font-mono tabular-nums">{result.cached ? 'cache' : `${result.latency_ms}ms`}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="size-3" aria-hidden="true" />
                Cost
              </dt>
              <dd className="font-mono tabular-nums">${result.cost_usd.toFixed(7)}</dd>
            </div>
          </dl>
          {result.estimated && <p className="mt-2 text-xs text-muted-foreground">Estimated — mock mode.</p>}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">Compact prompt sent</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed">
              {result.prompt}
            </pre>
          </details>
        </div>
      )}
    </aside>
  )
}
