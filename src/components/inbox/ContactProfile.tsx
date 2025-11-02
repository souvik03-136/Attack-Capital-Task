'use client'

import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Contact, Note } from '@/types'
import { formatDate } from '@/lib/utils'

interface ContactProfileProps {
  contactId: string
  isOpen: boolean
  onClose: () => void
}

export function ContactProfile({ contactId, isOpen, onClose }: ContactProfileProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contactId || !isOpen) return
    loadData()
  }, [contactId, isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const [contactsRes, notesRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch(`/api/notes?contactId=${contactId}`)
      ])
      const contacts = await contactsRes.json()
      const notesData = await notesRes.json()
      
      setContact(contacts.find((c: Contact) => c.id === contactId))
      setNotes(notesData)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          content: newNote,
          isPrivate,
          userId: 'temp-user-id'
        })
      })

      if (res.ok) {
        setNewNote('')
        setIsPrivate(false)
        loadData()
      }
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  if (!contact && !loading) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Profile" size="lg">
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              {contact?.name || 'Unknown Contact'}
            </h3>
            <div className="space-y-1 text-sm">
              {contact?.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{contact.phone}</span>
                </div>
              )}
              {contact?.email && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{contact.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Created:</span>
                <span>{formatDate(contact?.createdAt!)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center justify-between">
              <span>Notes ({notes.length})</span>
            </h4>
            
            <div className="space-y-3 mb-4 max-h-64 overflow-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No notes yet</p>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg ${
                      note.isPrivate ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-500">
                        {note.user?.name || 'Unknown'} • {formatDate(note.createdAt)}
                      </span>
                      {note.isPrivate && (
                        <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    {note.mentions.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {note.mentions.map((mention, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            @{mention}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note... Use @username to mention"
                className="w-full border rounded-md p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="rounded"
                  />
                  <span>Private note</span>
                </label>
                <Button onClick={addNote} disabled={!newNote.trim()}>
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}