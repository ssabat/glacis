'use client'

import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { analyzeLake, fetcher, type AnalyzeResponse, type Lake, type Scenario } from '@/lib/glacier'
import { AnalysisPanel } from './analysis-panel'
import { LakeDetail } from './lake-detail'
import { LakeList } from './lake-list'

export function Dashboard() {
  const { data: lakes, error } = useSWR<Lake[]>('/api/py/lakes', fetcher)
  const { mutate } = useSWRConfig()
  const [selectedId, setSelectedId] = useState<string>()
  const [scenario, setScenario] = useState<Scenario>('baseline')
  const [attachImage, setAttachImage] = useState(false)
  const [useSearch, setUseSearch] = useState(false)
  const [results, setResults] = useState<Record<string, AnalyzeResponse>>({})

  const lake = lakes?.find((l) => l.id === selectedId) ?? lakes?.[0]
  const { trigger, isMutating, error: runError } = useSWRMutation(
    lake ? `/api/py/lakes/${lake.id}/analyze` : null,
    analyzeLake,
  )

  if (error) {
    return (
      <p role="alert" className="mx-auto max-w-7xl p-6 text-sm text-risk-critical">
        Python backend unreachable. Make sure the FastAPI server is running on port 8000.
      </p>
    )
  }

  if (!lakes || !lake) {
    return (
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:p-6 lg:grid-cols-[260px_1fr_320px]" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    )
  }

  const resultKey = `${lake.id}:${scenario}:${attachImage}:${useSearch}`
  const result = results[resultKey]
  const sensors = result?.sensors ?? lake.sensors

  const run = async () => {
    const res = await trigger({ scenario, attach_image: attachImage, use_search: useSearch })
    setResults((prev) => ({ ...prev, [resultKey]: res }))
    mutate('/api/py/health')
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 p-4 md:p-6 lg:grid-cols-[260px_1fr_320px]">
      <LakeList lakes={lakes} selectedId={lake.id} onSelect={setSelectedId} />
      <LakeDetail lake={lake} sensors={sensors} />
      <AnalysisPanel
        lake={lake}
        scenario={scenario}
        onScenarioChange={setScenario}
        attachImage={attachImage}
        onAttachImageChange={setAttachImage}
        useSearch={useSearch}
        onUseSearchChange={setUseSearch}
        onRun={run}
        running={isMutating}
        result={result}
        error={runError}
      />
    </div>
  )
}
