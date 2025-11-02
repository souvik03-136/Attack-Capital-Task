import twilio from 'twilio'
import type { MessageSender, SendMessageParams } from './types'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export class TwilioSMSSender implements MessageSender {
  async send(params: SendMessageParams) {
    const message = await client.messages.create({
      body: params.content,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: params.to,
      mediaUrl: params.mediaUrl ? [params.mediaUrl] : undefined
    })
    return { id: message.sid, status: message.status }
  }
}

export class TwilioWhatsAppSender implements MessageSender {
  async send(params: SendMessageParams) {
    const message = await client.messages.create({
      body: params.content,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER!}`,
      to: `whatsapp:${params.to}`,
      mediaUrl: params.mediaUrl ? [params.mediaUrl] : undefined
    })
    return { id: message.sid, status: message.status }
  }
}