import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSender } from '@/lib/integrations/factory'
import type { Channel } from '@/lib/integrations/types'

export async function GET(req: NextRequest) {
  try {
    const contactId = req.nextUrl.searchParams.get('contactId')
    const channel = req.nextUrl.searchParams.get('channel')
    const status = req.nextUrl.searchParams.get('status')
    
    const where: any = {}
    if (contactId) where.contactId = contactId
    if (channel) where.channel = channel
    if (status) where.status = status

    const messages = await prisma.message.findMany({
      where,
      include: { 
        contact: true, 
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contactId, channel, content, scheduledAt, userId, mediaUrl } = await req.json()

    if (!contactId || !channel || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (scheduledAt) {
      const message = await prisma.message.create({
        data: {
          contactId,
          userId,
          channel,
          direction: 'outbound',
          content,
          status: 'scheduled',
          scheduledAt: new Date(scheduledAt),
          mediaUrl
        },
        include: { contact: true }
      })
      return NextResponse.json(message)
    }

    const sender = createSender(channel as Channel)
    const recipient = channel === 'email' ? contact.email! : contact.phone!

    if (!recipient) {
      return NextResponse.json({ 
        error: `Contact missing ${channel === 'email' ? 'email' : 'phone'}`
      }, { status: 400 })
    }

    const result = await sender.send({ 
      to: recipient, 
      content,
      mediaUrl
    })

    const message = await prisma.message.create({
      data: {
        contactId,
        userId,
        channel,
        direction: 'outbound',
        content,
        status: result.status,
        sentAt: new Date(),
        mediaUrl,
        metadata: { externalId: result.id }
      },
      include: { contact: true }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}