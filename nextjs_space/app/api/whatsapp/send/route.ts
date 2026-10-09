export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, isWhatsAppConfigured } from '@/lib/whatsapp'

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
    const amountStr = debtor.debtAmount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const message = `Olá ${debtor.name}, identificamos um débito de R$ ${amountStr} com vencimento em ${dueDateStr}. Podemos conversar sobre uma solução? Responda esta mensagem.`

    if (!isWhatsAppConfigured()) {
      // Demo mode: log interaction as mock
      await prisma.interaction.create({
        data: {
          debtorId: debtor.id,
          channel: 'whatsapp',
          direction: 'outbound',
          content: message,
          outcome: 'mock_sent',
        },
      })

      await prisma.debtor.update({
        where: { id: debtor.id },
        data: { status: debtor.status === 'new' ? 'contacted' : debtor.status },
      })

      // Also store in conversation
      const conv = await prisma.conversation.findFirst({ where: { debtorId: debtor.id } })
      if (conv) {
        const msgs = Array.isArray(conv.messages) ? conv.messages : []
        await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            messages: [
              ...msgs,
              { role: 'assistant', content: message, timestamp: new Date().toISOString() },
            ],
          },
        })
      }

      return NextResponse.json({
        success: true,
        mock: true,
        message: 'WhatsApp API not configured — message logged in demo mode.',
        sentMessage: message,
      })
    }

    // Real send
    const result = await sendWhatsAppMessage(debtor.phoneNumber, message)

    await prisma.interaction.create({
      data: {
        debtorId: debtor.id,
        channel: 'whatsapp',
        direction: 'outbound',
        content: message,
        outcome: result.success ? 'sent' : 'failed',
      },
    })

    if (result.success) {
      await prisma.debtor.update({
        where: { id: debtor.id },
        data: { status: debtor.status === 'new' ? 'contacted' : debtor.status },
      })

      const conv = await prisma.conversation.findFirst({ where: { debtorId: debtor.id } })
      if (conv) {
        const msgs = Array.isArray(conv.messages) ? conv.messages : []
        await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            messages: [
              ...msgs,
              { role: 'assistant', content: message, timestamp: new Date().toISOString() },
            ],
          },
        })
      }
    }

    return NextResponse.json({
      success: result.success,
      mock: false,
      messageId: result.messageId,
      error: result.error,
      sentMessage: message,
    })
  } catch (err: any) {
    console.error('POST /api/whatsapp/send error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}
