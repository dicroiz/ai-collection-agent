"use client"

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface EnvKey {
  key: string
  label: string
  configured: boolean
}

export function EnvBanner() {
  const [missing, setMissing] = useState<EnvKey[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/env-status')
      .then((r) => r.json())
      .then((data: any) => {
        const keys = (data?.keys ?? []) as EnvKey[]
        setMissing(keys.filter((k: EnvKey) => !k.configured))
      })
      .catch(() => {})
  }, [])

  if (dismissed || (missing?.length ?? 0) === 0) return null

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-3">
      <div className="mx-auto flex max-w-[1200px] items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-300">
              {missing.length} API key{missing.length > 1 ? 's' : ''} not configured
            </p>
            <p className="mt-0.5 text-xs text-yellow-400/80">
              Missing: {missing.map((k: EnvKey) => k.label).join(', ')}.
              Actions will run in demo mode.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-yellow-400/60 hover:text-yellow-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
