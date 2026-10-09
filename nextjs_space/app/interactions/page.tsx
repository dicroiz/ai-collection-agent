import { EnvBanner } from '../_components/env-banner'
import { Header } from '../_components/header'
import { InteractionsClient } from './_components/interactions-client'

export default function InteractionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <EnvBanner />
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Interaction Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All WhatsApp messages and voice call transcripts, sorted by most recent.
          </p>
        </div>
        <InteractionsClient />
      </main>
    </div>
  )
}
