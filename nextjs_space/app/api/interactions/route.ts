export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const channel = searchParams.get('channel')
    const search = searchParams.get('search')

    const where: any = {}

    if (channel && channel !== 'all') {
      where.channel = channel
    }

    if (search) {
      where.debtor = {
        name: { contains: search, mode: 'insensitive' as const },
      }
    }

    const interactions = await prisma.interaction.findMany({
      where,
      include: {
        debtor: {
          select: { name: true, phoneNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ interactions })
  } catch (err: any) {
    console.error('GET /api/interactions error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}
