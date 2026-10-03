import type { Lake, Sensors } from '@/lib/glacier'
import { AreaTrend } from './area-trend'

const SENSOR_LABELS: { key: keyof Sensors; label: string; unit: string; prefix?: string }[] = [
  { key: 'level_24h_cm', label: 'Water level Δ24h', unit: 'cm', prefix: '+' },
  { key: 'rain_72h_mm', label: 'Rainfall 72h', unit: 'mm' },
  { key: 'temp_anom_c', label: 'Temp anomaly', unit: '°C', prefix: '+' },
  { key: 'seepage', label: 'Moraine seepage', unit: 'idx' },
  { key: 'seismic_m', label: 'Max seismic', unit: 'M' },
]

export function LakeDetail({ lake, sensors }: { lake: Lake; sensors: Sensors }) {
  return (
    <section aria-labelledby="lake-title" className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative aspect-[16/9] w-full">
          <img
            src={lake.image || '/placeholder.svg'}
            alt={`Mock satellite view of ${lake.name} glacial lake`}
            className="size-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-4">
            <h2 id="lake-title" className="text-xl font-semibold text-balance">
              {lake.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lake.region}, {lake.country} · {lake.elev_m.toLocaleString()} m ·{' '}
              <span className="font-mono">
                {lake.lat.toFixed(3)}°N {lake.lon.toFixed(3)}°E
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-3">
          {lake.visual.map((cue) => (
            <span key={cue} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {cue}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Temporal change</h3>
          <p className="mt-1 font-mono text-2xl tabular-nums">
            {lake.area_km2.at(-1)} km²
            <span className="ml-2 text-sm text-risk-high">+{lake.growth_pct_yr}%/yr</span>
          </p>
          <AreaTrend years={lake.years} values={lake.area_km2} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exposure</h3>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Downstream pop.</dt>
              <dd className="font-mono tabular-nums">{lake.downstream_pop.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Nearest village</dt>
              <dd>{lake.first_village}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Distance</dt>
              <dd className="font-mono tabular-nums">{lake.distance_km} km</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dam type</dt>
              <dd className="capitalize">{lake.dam}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live sensors (mock)</h3>
        <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SENSOR_LABELS.map(({ key, label, unit, prefix }) => {
            const changed = sensors[key] !== lake.sensors[key]
            return (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className={`font-mono text-lg tabular-nums ${changed ? 'text-risk-critical' : ''}`}>
                  {unit === 'M' ? `M${sensors[key]}` : `${prefix ?? ''}${sensors[key]}`}
                  {unit !== 'M' && <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
