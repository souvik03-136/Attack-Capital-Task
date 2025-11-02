import { Navbar } from '@/components/Navbar'
import { Dashboard } from '@/components/analytics/Dashboard'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <Dashboard />
      </div>
    </div>
  )
}