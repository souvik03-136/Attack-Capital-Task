import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string
    const numMedia = parseInt(formData.get('NumMedia') as string || '0')
    
    const channel = from.includes('whatsapp') ? 'whatsapp' : 'sms'
    const phoneNumber = from.replace('whatsapp:', '')

    let mediaUrl = null
    if (numMedia > 0) {
      mediaUrl = formData.get('MediaUrl0') as string
    }

    let contact = await prisma.contact.findFirst({
      where: { phone: phoneNumber }
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: { phone: phoneNumber }
      })
    }

    await prisma.message.create({
      data: {
        contactId: contact.id,
        channel,
        direction: 'inbound',
        content: body || '',
        status: 'received',
        mediaUrl,
        sentAt: new Date(),
        metadata: { sid: messageSid }
      }
    })

    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}