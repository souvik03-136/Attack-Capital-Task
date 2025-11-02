'use client'

import { useEffect, useState } from 'react'
import type { Contact } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { Input } from '../ui/Input'

interface MessageListProps {
  onSelectContact: (id: string) => void
  selectedContactId?: string
  refreshKey?: number
}

export function MessageList({ onSelectContact, selectedContactId, refreshKey }: MessageListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContacts()
  }, [refreshKey])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const url = search ? `/api/contacts?search=${encodeURIComponent(search)}` : '/api/contacts'
      const res = await fetch(url)
      const data = await res.json()
      setContacts(data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) loadContacts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="h-full flex flex-col border-r bg-gray-50">
      <div className="p-3 border-b bg-white">
        <Input
          type="search"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No contacts</div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={`p-4 border-b cursor-pointer transition-colors ${
                selectedContactId === contact.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-100 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {contact.name || contact.phone || contact.email || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {contact.phone}
                  </div>
                  {contact.email && (
                    <div className="text-xs text-gray-400 truncate">
                      {contact.email}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {formatRelativeTime(contact.updatedAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}