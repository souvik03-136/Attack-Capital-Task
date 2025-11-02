import { Resend } from 'resend'
import type { MessageSender, SendMessageParams } from './types'

const resend = new Resend(process.env.RESEND_API_KEY!)

export class EmailSender implements MessageSender {
  async send(params: SendMessageParams) {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: params.to,
      subject: 'New Message',
      text: params.content
    })
    
    if (error) throw error
    return { id: data!.id, status: 'sent' }
  }
}