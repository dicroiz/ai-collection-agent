export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerOutboundCall, isVapiConfigured } from '@/lib/vapi'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { debtorId } = body ?? {}

    if (!debtorId) {
      return NextResponse.json({ error: 'debtorId is required' }, { status: 400 })
    }

    const debtor = await prisma.debtor.findUnique({ where: { id: debtorId } })
    if (!debtor) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 })
    }

    const dueDateStr = debtor.dueDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    if (!isVapiConfigured()) {
      // Demo mode
      await prisma.interaction.create({
        data: {
          debtorId: debtor.id,
          channel: 'voice',
          direction: 'outbound',
          content: `Mock call to ${debtor.name} (${debtor.phoneNumber}) about R$ ${debtor.debtAmount} debt`,
          outcome: 'mock_initiated',
        },
      })

      await prisma.debtor.update({
        where: { id: debtor.id },
        data: { status: 'contacted' },
      })

      return NextResponse.json({
        success: true,
        mock: true,
        message: 'Vapi.ai not configured — call logged in demo mode.',
      })
    }

    const result = await triggerOutboundCall({
      phoneNumber: debtor.phoneNumber,
      debtorName: debtor.name,
      debtAmount: debtor.debtAmount,
      dueDate: dueDateStr,
    })

    await prisma.interaction.create({
      data: {
        debtorId: debtor.id,
        channel: 'voice',
        direction: 'outbound',
        content: `Call initiated to ${debtor.phoneNumber}`,
        outcome: result.success ? 'initiated' : 'failed',
        vapiCallId: result.callId,
      },
    })

    if (result.success) {
      await prisma.debtor.update({
        where: { id: debtor.id },
        data: { status: 'contacted' },
      })
    }

    return NextResponse.json({
      success: result.success,
      mock: false,
      callId: result.callId,
      error: result.error,
    })
  } catch (err: any) {
    console.error('POST /api/calls/trigger error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to trigger call' },
      { status: 500 }
    )
  }
}
