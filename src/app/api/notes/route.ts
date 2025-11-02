import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const contactId = req.nextUrl.searchParams.get('contactId')
    
    if (!contactId) {
      return NextResponse.json({ error: 'contactId required' }, { status: 400 })
    }

    const notes = await prisma.note.findMany({
      where: { contactId },
      include: { 
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contactId, userId, content, isPrivate } = await req.json()

    if (!contactId || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mentionRegex = /@(\w+)/g
    const mentions = Array.from(content.matchAll(mentionRegex), (m) => (m as RegExpMatchArray)[1])

    const note = await prisma.note.create({
      data: {
        contactId,
        userId,
        content,
        isPrivate: isPrivate || false,
        mentions
      },
      include: { 
        user: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}