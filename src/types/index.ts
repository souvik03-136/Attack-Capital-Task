export interface Message {
  id: string
  contactId: string
  userId?: string
  channel: string
  direction: 'inbound' | 'outbound'
  content: string
  status: string
  mediaUrl?: string
  scheduledAt?: Date
  sentAt?: Date
  createdAt: Date
  contact?: Contact
  user?: User
}

export interface Contact {
  id: string
  name?: string
  phone?: string
  email?: string
  socialHandles?: any
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  contactId: string
  userId: string
  content: string
  isPrivate: boolean
  mentions: string[]
  createdAt: Date
  updatedAt: Date
  user?: User
}

export interface User {
  id: string
  email: string
  name?: string
  role: string
}

export interface Analytics {
  totalMessages: number
  totalContacts: number
  byChannel: { channel: string; _count: number }[]
  byStatus: { status: string; _count: number }[]
  avgResponseTime: any[]
  dailyActivity: Record<string, number>
}