'use client'

import { useEffect, useState } from 'react'
import type { Analytics } from '@/types'

export function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      const analyticsData = await res.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Failed to load analytics</div>
      </div>
    )
  }

  const avgSeconds = data.avgResponseTime?.[0]?.avg_seconds
  const avgResponseMinutes = avgSeconds ? Math.round(avgSeconds / 60) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Messages</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totalMessages}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Contacts</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totalContacts}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Avg Response Time</h3>
          <p className="text-3xl font-bold text-gray-900">
            {avgResponseMinutes > 0 ? `${avgResponseMinutes}m` : 'N/A'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Channels</h3>
          <p className="text-3xl font-bold text-gray-900">{data.byChannel.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Messages by Channel</h3>
          <div className="space-y-3">
            {data.byChannel.map(item => (
              <div key={item.channel} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{item.channel}</span>
                <span className="font-semibold text-gray-900">{item._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Messages by Status</h3>
          <div className="space-y-3">
            {data.byStatus.map(item => (
              <div key={item.status} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{item.status}</span>
                <span className="font-semibold text-gray-900">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.dailyActivity && Object.keys(data.dailyActivity).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
          <div className="space-y-2">
            {Object.entries(data.dailyActivity).map(([date, count]) => (
              <div key={date} className="flex justify-between items-center">
                <span className="text-gray-700">{date}</span>
                <span className="font-semibold text-gray-900">{typeof count === 'number' ? count : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}