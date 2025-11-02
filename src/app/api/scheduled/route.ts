import { NextResponse } from 'next/server'
import { processScheduledMessages } from '@/lib/scheduler'

export async function POST() {
  try {
    await processScheduledMessages()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Scheduler error:', error)
    return NextResponse.json({ error: 'Failed to process scheduled messages' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db')
    const scheduled = await prisma.message.findMany({
      where: { status: 'scheduled' },
      include: { contact: true },
      orderBy: { scheduledAt: 'asc' }
    })
    return NextResponse.json(scheduled)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}