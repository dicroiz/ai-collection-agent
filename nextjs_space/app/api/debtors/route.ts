export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const debtors = await prisma.debtor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { interactions: true },
        },
      },
    })
    return NextResponse.json({ debtors })
  } catch (err: any) {
    console.error('GET /api/debtors error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to fetch debtors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phoneNumber, debtAmount, dueDate } = body ?? {}

    if (!name || !phoneNumber || debtAmount == null || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, phoneNumber, debtAmount, dueDate' },
        { status: 400 }
      )
    }

    const debtor = await prisma.debtor.create({
      data: {
        name,
        phoneNumber: String(phoneNumber),
        debtAmount: Number(debtAmount),
        dueDate: new Date(dueDate),
        status: 'new',
      },
    })

    // Also create a conversation record for this debtor
    await prisma.conversation.create({
      data: {
        debtorId: debtor.id,
        messages: [],
      },
    })

    return NextResponse.json({ debtor }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/debtors error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create debtor' },
      { status: 500 }
    )
  }
}
