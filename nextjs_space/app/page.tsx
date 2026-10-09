import { EnvBanner } from './_components/env-banner'
import { Header } from './_components/header'
import { DashboardClient } from './_components/dashboard-client'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <EnvBanner />
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Operator Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage debtors, send collection messages, and trigger outbound calls.
          </p>
        </div>
        <DashboardClient />
      </main>
    </div>
  )
}
