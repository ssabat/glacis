export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'
export type Scenario = 'baseline' | 'cloudburst' | 'earthquake' | 'heatwave'

export interface Sensors {
  temp_anom_c: number
  rain_72h_mm: number
  level_24h_cm: number
  seepage: number
  seismic_m: number
}

export interface Analysis {
  level: RiskLevel
  score: number
  drivers: string[]
  actions: string[]
  evac_h: number | null
}

export interface Lake {
  id: string
  name: string
  country: string
  region: string
  lat: number
  lon: number
  elev_m: number
  dam: string
  downstream_pop: number
  first_village: string
  distance_km: number
  visual: string[]
  image: string
  years: number[]
  area_km2: number[]
  growth_pct_yr: number
  sensors: Sensors
  baseline: Analysis
}

export interface Health {
  model: string
  provider: string
  live: boolean
  search: boolean
  price_in_per_m: number
  price_out_per_m: number
  max_out_tokens: number
  session: { calls: number; cache_hits: number; tokens_in: number; tokens_out: number; cost_usd: number }
}

export interface AnalyzeResponse {
  lake_id: string
  scenario: Scenario
  sensors: Sensors
  prompt: string
  model: string
  source: 'nemotron' | 'mock' | 'heuristic-fallback'
  analysis: Analysis
  tokens_in: number
  tokens_out: number
  latency_ms: number
  cost_usd: number
  image_sent: boolean
  cached: boolean
  estimated?: boolean
  error?: string
  intel?: Intel | null
}

export interface Intel {
  digest: string
  sources: { title: string; url: string }[]
  error?: string
}

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export async function analyzeLake(
  url: string,
  { arg }: { arg: { scenario: Scenario; attach_image: boolean; use_search: boolean } },
): Promise<AnalyzeResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`)
  return res.json()
}

export const RISK_STYLES: Record<RiskLevel, { text: string; bg: string; border: string; label: string }> = {
  low: { text: 'text-risk-low', bg: 'bg-risk-low', border: 'border-risk-low/40', label: 'Low' },
  moderate: { text: 'text-risk-moderate', bg: 'bg-risk-moderate', border: 'border-risk-moderate/40', label: 'Moderate' },
  high: { text: 'text-risk-high', bg: 'bg-risk-high', border: 'border-risk-high/40', label: 'High' },
  critical: { text: 'text-risk-critical', bg: 'bg-risk-critical', border: 'border-risk-critical/40', label: 'Critical' },
}
