import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExplainerPlayer } from '@/components/explainer-player'

export const metadata: Metadata = {
  title: 'Explainer video · GlacierGuard',
  description:
    'A 90-second walkthrough of how GlacierGuard uses Nemotron 3 Nano Omni on Nebius Token Factory to give early warning of Himalayan glacial lake outburst floods.',
}

export default function ExplainerPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-balance md:text-3xl">How GlacierGuard saves lives</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          A 90-second explainer. Narration uses your browser&apos;s built-in voice, so playback uses zero AI tokens.
        </p>
      </div>
      <ExplainerPlayer />
    </main>
  )
}
