export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body ?? {}

    if (!message) {
      return NextResponse.json({ status: 'ok' })
    }

    const msgType = message?.type ?? ''

    // Handle end-of-call report
    if (msgType === 'end-of-call-report') {
      const callId = message?.call?.id ?? ''
      const transcript = message?.transcript ?? ''
      const summary = message?.summary ?? ''
      const endedReason = message?.endedReason ?? 'unknown'

      if (callId) {
        // Find the interaction by vapi call ID
        const interaction = await prisma.interaction.findFirst({
          where: { vapiCallId: callId },
        })

        if (interaction) {
          await prisma.interaction.update({
            where: { id: interaction.id },
            data: {
              transcript: transcript || summary || 'No transcript available',
              outcome: endedReason === 'assistant-ended' ? 'completed' : endedReason,
            },
          })

          // Update debtor status
          const debtor = await prisma.debtor.findUnique({
            where: { id: interaction.debtorId },
          })
          if (debtor && (debtor.status === 'new' || debtor.status === 'contacted')) {
            await prisma.debtor.update({
              where: { id: debtor.id },
              data: { status: 'in_negotiation' },
            })
          }
        }
      }
    }

    // Handle status updates
    if (msgType === 'status-update') {
      const callId = message?.call?.id ?? ''
      const status = message?.status ?? ''

      if (callId && status === 'ended') {
        const interaction = await prisma.interaction.findFirst({
          where: { vapiCallId: callId },
        })
        if (interaction && interaction.outcome === 'initiated') {
          await prisma.interaction.update({
            where: { id: interaction.id },
            data: { outcome: 'call_ended' },
          })
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('Vapi webhook error:', err)
    return NextResponse.json({ status: 'ok' })
  }
}
