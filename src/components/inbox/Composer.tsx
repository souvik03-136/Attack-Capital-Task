'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface ComposerProps {
  contactId: string
  onSent: () => void
}

export function Composer({ contactId, onSent }: ComposerProps) {
  const [content, setContent] = useState('')
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms')
  const [scheduledAt, setScheduledAt] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          channel,
          content,
          scheduledAt: scheduledAt || undefined,
          mediaUrl: mediaUrl || undefined,
          userId: 'temp-user-id'
        })
      })

      if (res.ok) {
        setContent('')
        setScheduledAt('')
        setMediaUrl('')
        onSent()
      } else {
        const error = await res.json()
        alert(`Failed to send: ${error.error}`)
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t bg-white p-4 space-y-3">
      <div className="flex gap-2">
        <select
          value={channel}
          onChange={e => setChannel(e.target.value as any)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
        <Input
          type="datetime-local"
          placeholder="Schedule time"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          className="flex-1"
        />
      </div>
      <Input
        placeholder="Media URL (optional)"
        value={mediaUrl}
        onChange={e => setMediaUrl(e.target.value)}
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type your message..."
        className="w-full border rounded-md p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend()
          }
        }}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {scheduledAt ? 'Will send at scheduled time' : 'Press Cmd+Enter to send'}
        </span>
        <Button onClick={handleSend} disabled={sending || !content.trim()}>
          {sending ? 'Sending...' : scheduledAt ? 'Schedule' : 'Send'}
        </Button>
      </div>
    </div>
  )
}