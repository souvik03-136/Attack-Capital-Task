export interface SendMessageParams {
  to: string
  content: string
  mediaUrl?: string
  scheduledAt?: Date
}

export interface MessageSender {
  send(params: SendMessageParams): Promise<{ id: string; status: string }>
}

export type Channel = 'sms' | 'whatsapp' | 'email'