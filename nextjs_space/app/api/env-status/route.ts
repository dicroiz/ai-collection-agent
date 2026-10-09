export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { checkEnvKeys } from '@/lib/env-check'

export async function GET() {
  const keys = checkEnvKeys()
  const missing = keys.filter((k: any) => !k.configured)
  return NextResponse.json({
    allConfigured: missing.length === 0,
    keys,
    missingCount: missing.length,
  })
}
