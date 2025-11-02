import { prisma } from './db'
import { createSender } from './integrations/factory'
import type { Channel } from './integrations/types'

export async function processScheduledMessages() {
  const messages = await prisma.message.findMany({
    where: {
      scheduledAt: { lte: new Date() },
      status: 'scheduled'
    },
    include: { contact: true }
  })

  for (const message of messages) {
    try {
      const sender = createSender(message.channel as Channel)
      const recipient = message.channel === 'email' 
        ? message.contact.email! 
        : message.contact.phone!

      await sender.send({
        to: recipient,
        content: message.content,
        mediaUrl: message.mediaUrl || undefined
      })

      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'sent', sentAt: new Date() }
      })
    } catch (error) {
      console.error('Failed to send scheduled message:', error)
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'failed' }
      })
    }
  }
}