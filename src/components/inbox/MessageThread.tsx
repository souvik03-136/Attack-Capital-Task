'use client'

import { useEffect, useState, useRef } from 'react'
import type { Message } from '@/types'
import { formatDate } from '@/lib/utils'

interface MessageThreadProps {
  contactId: string
  refreshKey?: number
}

export function MessageThread({ contactId, refreshKey }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contactId) return
    loadMessages()
  }, [contactId, refreshKey])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?contactId=${contactId}`)
      const data = await res.json()
      setMessages(data.reverse())
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Loading messages...
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No messages yet. Start a conversation!
        </div>
      ) : (
        messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md px-4 py-3 rounded-lg shadow-sm ${
                msg.direction === 'outbound'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 text-xs opacity-75 mb-1">
                <span className={`px-2 py-0.5 rounded ${
                  msg.direction === 'outbound' ? 'bg-blue-500' : 'bg-gray-200'
                }`}>
                  {msg.channel}
                </span>
                <span>{formatDate(msg.createdAt)}</span>
                {msg.status !== 'sent' && msg.status !== 'received' && (
                  <span className="font-medium">({msg.status})</span>
                )}
              </div>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              {msg.mediaUrl && (
                <div className="mt-2">
                  <img 
                    src={msg.mediaUrl} 
                    alt="Media" 
                    className="rounded max-w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}