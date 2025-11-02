import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [totalMessages, totalContacts, byChannel, byStatus] = await Promise.all([
      prisma.message.count(),
      prisma.contact.count(),
      prisma.message.groupBy({
        by: ['channel'],
        _count: { id: true }
      }),
      prisma.message.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ])

    const recentMessages = await prisma.message.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, channel: true }
    })

    interface RecentMessage {
      createdAt: Date
      channel: string
    }

    interface DailyActivity {
      [date: string]: number
    }

    const dailyActivity: DailyActivity = recentMessages.reduce(
      (acc: DailyActivity, msg: RecentMessage) => {
        const date: string = msg.createdAt.toISOString().split('T')[0]
        if (!acc[date]) acc[date] = 0
        acc[date]++
        return acc
      },
      {} as DailyActivity
    )

    const avgResponseTime = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (m2."createdAt" - m1."createdAt"))) as avg_seconds
      FROM "Message" m1
      JOIN "Message" m2 ON m1."contactId" = m2."contactId"
      WHERE m1.direction = 'inbound' 
      AND m2.direction = 'outbound'
      AND m2."createdAt" > m1."createdAt"
      AND m2."createdAt" < m1."createdAt" + INTERVAL '1 day'
    `

    return NextResponse.json({
      totalMessages,
      totalContacts,
      byChannel,
      byStatus,
      dailyActivity,
      avgResponseTime
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}