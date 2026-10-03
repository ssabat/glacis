export type ExplainerScene = {
  kicker: string
  title: string
  narration: string
  image: string
  imageAlt: string
  chips: string[]
}

export const SCENE_SECONDS = 15

export const scenes: ExplainerScene[] = [
  {
    kicker: '01 · The threat',
    title: 'Himalayan glaciers are melting into unstable lakes',
    narration:
      'Across Nepal, India and Bhutan, retreating glaciers leave behind thousands of lakes held back by fragile moraine dams. When a dam bursts, a glacial lake outburst flood can wipe out valleys downstream within minutes.',
    image: '/lakes/south-lhonak.png',
    imageAlt: 'South Lhonak glacial lake in Sikkim, India',
    chips: ['25,000+ glacial lakes', 'South Lhonak GLOF, 2023', 'Minutes to impact'],
  },
  {
    kicker: '02 · Continuous watch',
    title: 'GlacierGuard monitors the most dangerous lakes',
    narration:
      'GlacierGuard tracks high-risk lakes like Imja Tsho and Tsho Rolpa in Nepal. It combines satellite imagery, lake area growth, water levels and weather into one live dashboard for each site.',
    image: '/lakes/imja-tsho.png',
    imageAlt: 'Imja Tsho glacial lake below Everest region peaks',
    chips: ['Satellite imagery', 'Lake area trend', 'Downstream population'],
  },
  {
    kicker: '03 · Multimodal native',
    title: 'Nemotron 3 Nano Omni sees the glacier change',
    narration:
      'Nemotron 3 Nano Omni is built for multimodal agentic reasoning. Instead of a separate vision pipeline, one model reads the imagery and sensor data together, and correlates changes over time.',
    image: '/lakes/tsho-rolpa.png',
    imageAlt: 'Tsho Rolpa glacial lake in the Rolwaling valley, Nepal',
    chips: ['Image + sensor fusion', 'Temporal change detection', 'One model, no glue code'],
  },
  {
    kicker: '04 · Agentic risk analysis',
    title: 'From signals to evacuation decisions',
    narration:
      'Pick a scenario such as a cloudburst or an earthquake. The agent returns a risk level, the key drivers behind it, and concrete actions: alert villages, open shelters, and lower the lake through controlled drainage.',
    image: '/lakes/thorthormi.png',
    imageAlt: 'Thorthormi glacial lake in Bhutan',
    chips: ['Risk level: low to critical', 'Key risk drivers', 'Evacuation actions'],
  },
  {
    kicker: '05 · Predictable economics',
    title: 'Transparent per-token pricing on Nebius Token Factory',
    narration:
      'Agentic loops consume many tokens, so cost must be predictable. GlacierGuard runs on Nebius Token Factory, uses compact prompts and caches repeat results, and shows tokens and cost for every session.',
    image: '/lakes/imja-tsho.png',
    imageAlt: 'Imja Tsho glacial lake',
    chips: ['Per-token pricing', 'Compact prompts + cache', 'Live session cost'],
  },
  {
    kicker: '06 · Speed saves lives',
    title: 'Big-model knowledge at small-model speed',
    narration:
      'Nemotron Nano gives big-model knowledge at small-model speed, so checks can run often without frontier-model latency. Faster warnings mean more time to evacuate. Open the dashboard and run your first analysis.',
    image: '/lakes/south-lhonak.png',
    imageAlt: 'South Lhonak glacial lake',
    chips: ['Low latency', 'Frequent monitoring', 'Earlier warnings'],
  },
]

export const TOTAL_SECONDS = scenes.length * SCENE_SECONDS
