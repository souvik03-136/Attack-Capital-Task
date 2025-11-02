'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { MessageList } from '@/components/inbox/MessageList'
import { MessageThread } from '@/components/inbox/MessageThread'
import { Composer } from '@/components/inbox/Composer'
import { ContactProfile } from '@/components/inbox/ContactProfile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export default function InboxPage() {
  const [selectedContact, setSelectedContact] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showNewContact, setShowNewContact] = useState(false)
  const [newContactData, setNewContactData] = useState({ 
    name: '', 
    phone: '', 
    email: '' 
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState('')

  const handleCreateContact = async () => {
    setError('')
    
    if (!newContactData.phone && !newContactData.email) {
      setError('Please provide at least phone or email')
      return
    }

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContactData)
      })

      if (res.ok) {
        setShowNewContact(false)
        setNewContactData({ name: '', phone: '', email: '' })
        setRefreshKey(k => k + 1)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create contact')
      }
    } catch (err) {
      setError('Failed to create contact')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0">
          <div className="p-4 border-b bg-white">
            <Button onClick={() => setShowNewContact(true)} className="w-full">
              + New Contact
            </Button>
          </div>
          <MessageList 
            key={refreshKey}
            onSelectContact={setSelectedContact}
            selectedContactId={selectedContact}
            refreshKey={refreshKey}
          />
        </div>

        {selectedContact ? (
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4 flex justify-between items-center bg-white">
              <h2 className="font-semibold text-lg">Conversation</h2>
              <Button onClick={() => setShowProfile(true)} variant="secondary" size="sm">
                View Profile
              </Button>
            </div>
            <MessageThread 
              contactId={selectedContact} 
              refreshKey={refreshKey}
            />
            <Composer
              contactId={selectedContact}
              onSent={() => setRefreshKey(k => k + 1)}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-gray-500">Select a contact to view messages</p>
            </div>
          </div>
        )}
      </div>

      {showProfile && selectedContact && (
        <ContactProfile
          contactId={selectedContact}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      <Modal
        isOpen={showNewContact}
        onClose={() => {
          setShowNewContact(false)
          setError('')
          setNewContactData({ name: '', phone: '', email: '' })
        }}
        title="New Contact"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="John Doe"
            value={newContactData.name}
            onChange={e => setNewContactData(d => ({ ...d, name: e.target.value }))}
          />
          <Input
            label="Phone"
            placeholder="+1234567890"
            value={newContactData.phone}
            onChange={e => setNewContactData(d => ({ ...d, phone: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={newContactData.email}
            onChange={e => setNewContactData(d => ({ ...d, email: e.target.value }))}
          />
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowNewContact(false)
                setError('')
                setNewContactData({ name: '', phone: '', email: '' })
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateContact}>
              Create Contact
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}