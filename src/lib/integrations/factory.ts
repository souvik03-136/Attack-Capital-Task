import type { Channel, MessageSender } from './types'
import { TwilioSMSSender, TwilioWhatsAppSender } from './twilio'
import { EmailSender } from './email'

export function createSender(channel: Channel): MessageSender {
  switch (channel) {
    case 'sms':
      return new TwilioSMSSender()
    case 'whatsapp':
      return new TwilioWhatsAppSender()
    case 'email':
      return new EmailSender()
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
}