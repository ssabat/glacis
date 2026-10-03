'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scenes, SCENE_SECONDS, TOTAL_SECONDS } from '@/lib/explainer-scenes'
import { cn } from '@/lib/utils'

const TICK_MS = 100

function formatTime(seconds: number) {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function ExplainerPlayer() {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [voice, setVoice] = useState(true)
  const spokenScene = useRef(-1)

  const sceneIndex = Math.min(Math.floor(elapsed / SCENE_SECONDS), scenes.length - 1)
  const scene = scenes[sceneIndex]
  const finished = elapsed >= TOTAL_SECONDS

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setElapsed((t) => {
        const next = t + TICK_MS / 1000
        if (next >= TOTAL_SECONDS) {
          setPlaying(false)
          return TOTAL_SECONDS
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [playing])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    if (!playing || !voice) {
      synth.cancel()
      spokenScene.current = -1
      return
    }
    if (spokenScene.current === sceneIndex) return
    spokenScene.current = sceneIndex
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(scene.narration)
    utterance.rate = 1.02
    utterance.lang = 'en-US'
    synth.speak(utterance)
  }, [playing, voice, sceneIndex, scene.narration])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const togglePlay = useCallback(() => {
    if (finished) setElapsed(0)
    setPlaying((p) => !p)
  }, [finished])

  const seekToScene = (index: number) => {
    spokenScene.current = -1
    setElapsed(index * SCENE_SECONDS)
  }

  const restart = () => {
    spokenScene.current = -1
    setElapsed(0)
    setPlaying(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay])

  const sceneProgress = Math.min((elapsed - sceneIndex * SCENE_SECONDS) / SCENE_SECONDS, 1)

  return (
    <section aria-label="GlacierGuard explainer video" className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {scenes.map((s, i) => (
          <div
            key={s.kicker}
            aria-hidden={i !== sceneIndex}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000',
              i === sceneIndex ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={s.image || '/placeholder.svg'}
              alt={s.imageAlt}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover transition-transform ease-linear"
              style={{
                transform: `scale(${i === sceneIndex ? 1.04 + sceneProgress * 0.12 : 1.04})`,
                transitionDuration: `${TICK_MS}ms`,
              }}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{scene.kicker}</p>
          <h2 className="max-w-3xl text-2xl font-semibold leading-tight text-white text-balance md:text-4xl">
            {scene.title}
          </h2>
          <p aria-live="polite" className="max-w-3xl text-sm leading-relaxed text-white/85 text-pretty md:text-base">
            {scene.narration}
          </p>
          <ul className="flex flex-wrap gap-2">
            {scene.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white backdrop-blur"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 focus-visible:outline-none"
            aria-label={finished ? 'Replay video' : elapsed > 0 ? 'Resume video' : 'Play video'}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:size-20">
              {finished ? <RotateCcw className="size-7" /> : <Play className="ml-1 size-8" />}
            </span>
          </button>
        )}
      </div>

      <div className="flex gap-1.5" role="group" aria-label="Chapters">
        {scenes.map((s, i) => {
          const fill = i < sceneIndex ? 1 : i === sceneIndex ? sceneProgress : 0
          return (
            <button
              key={s.kicker}
              type="button"
              onClick={() => seekToScene(i)}
              aria-label={`Jump to chapter ${i + 1}: ${s.title}`}
              aria-current={i === sceneIndex}
              className="group flex flex-1 flex-col gap-1.5 text-left"
            >
              <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <span className="block h-full bg-primary" style={{ width: `${fill * 100}%` }} />
              </span>
              <span
                className={cn(
                  'hidden truncate text-xs md:block',
                  i === sceneIndex ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {s.kicker}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={togglePlay}>
          {playing ? <Pause /> : <Play />}
          {playing ? 'Pause' : finished ? 'Replay' : 'Play'}
        </Button>
        <Button size="sm" variant="outline" onClick={restart}>
          <RotateCcw />
          Restart
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setVoice((v) => !v)}
          aria-pressed={voice}
        >
          {voice ? <Volume2 /> : <VolumeX />}
          {voice ? 'Narration on' : 'Narration off'}
        </Button>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {formatTime(elapsed)} / {formatTime(TOTAL_SECONDS)}
        </span>
        <Link
          href="/"
          className="inline-flex h-8 items-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Open dashboard
        </Link>
      </div>
    </section>
  )
}
