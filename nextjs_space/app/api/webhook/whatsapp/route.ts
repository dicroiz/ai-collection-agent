export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { getAgentReply } from '@/lib/negotiation-agent'

// GET: Webhook verification for Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge ?? '', { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: Receive incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Meta sends a complex webhook payload — extract the message
    const entry = (body?.entry as any[])?.[0]
    const changes = (entry?.changes as any[])?.[0]
    const value = changes?.value
    const messageObj = (value?.messages as any[])?.[0]

    if (!messageObj) {
      // Might be a status update — acknowledge
      return NextResponse.json({ status: 'ok' })
    }

    const senderPhone = messageObj?.from ?? ''
    const messageText = messageObj?.text?.body ?? ''
    const messageType = messageObj?.type ?? ''

    if (messageType !== 'text' || !messageText) {
      return NextResponse.json({ status: 'ok — non-text message ignored' })
    }

    // Find debtor by phone number
    const cleanPhone = senderPhone.replace(/\D/g, '')
    const debtor = await prisma.debtor.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanPhone },
          { phoneNumber: `+${cleanPhone}` },
          { phoneNumber: { contains: cleanPhone.slice(-11) } },
        ],
      },
    })

    if (!debtor) {
      console.warn(`Incoming WhatsApp from unknown number: ${senderPhone}`)
      return NextResponse.json({ status: 'ok — unknown sender' })
    }

    // Log inbound message
    await prisma.interaction.create({
      data: {
        debtorId: debtor.id,
        channel: 'whatsapp',
        direction: 'inbound',
        content: messageText,
        outcome: 'received',
      },
    })

    // Get or create conversation
    let conv = await prisma.conversation.findFirst({ where: { debtorId: debtor.id } })
    if (!conv) {
      conv = await prisma.conversation.create({
        data: { debtorId: debtor.id, messages: [] },
      })
    }

    const history = Array.isArray(conv.messages) ? (conv.messages as any[]) : []

    // Get AI reply
    const dueDateStr = debtor.dueDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const agentResult = await getAgentReply(
      {
        name: debtor.name,
        debtAmount: debtor.debtAmount,
        dueDate: dueDateStr,
      },
      history,
      messageText
    )

    if (!agentResult.success || !agentResult.reply) {
      console.error('Agent reply failed:', agentResult.error)
      return NextResponse.json({ status: 'ok — agent error logged' })
    }

    // Update conversation
    const updatedMessages = [
      ...history,
      { role: 'user', content: messageText, timestamp: new Date().toISOString() },
      { role: 'assistant', content: agentResult.reply, timestamp: new Date().toISOString() },
    ]

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { messages: updatedMessages },
    })

    // Send reply via WhatsApp
    const sendResult = await sendWhatsAppMessage(senderPhone, agentResult.reply)

    // Log outbound reply
    await prisma.interaction.create({
      data: {
        debtorId: debtor.id,
        channel: 'whatsapp',
        direction: 'outbound',
        content: agentResult.reply,
        outcome: sendResult.success ? 'sent' : 'failed',
      },
    })

    // Update debtor status
    if (debtor.status === 'new' || debtor.status === 'contacted') {
      await prisma.debtor.update({
        where: { id: debtor.id },
        data: { status: 'in_negotiation' },
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ status: 'ok — error logged' })
  }
}
