export function AreaTrend({ years, values }: { years: number[]; values: number[] }) {
  const width = 320
  const height = 96
  const pad = 6
  const min = Math.min(...values) * 0.98
  const max = Math.max(...values) * 1.02
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - min) / (max - min)) * (height - pad * 2)
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(values.length - 1)},${height} L${x(0)},${height} Z`

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full"
        role="img"
        aria-label={`Lake area from ${values[0]} km² in ${years[0]} to ${values.at(-1)} km² in ${years.at(-1)}`}
      >
        <path d={area} className="fill-primary/15" />
        <path d={line} className="fill-none stroke-primary" strokeWidth={2} strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={years[i]} cx={x(i)} cy={y(v)} r={2.5} className="fill-primary" />
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{years[0]}</span>
        <span>Lake area (km²)</span>
        <span>{years.at(-1)}</span>
      </figcaption>
    </figure>
  )
}
