'use client'

import { useQuery } from '@tanstack/react-query'
import { unitsAPI } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsAPI.getAll(),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Timetable Card */}
          <Link href="/timetable">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">Thời Khóa Biểu</h2>
              <p className="text-gray-600">Xem và quản lý thời khóa biểu</p>
            </div>
          </Link>

          {/* Data Management Card */}
          <Link href="/data-management">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">Quản Lý Dữ Liệu</h2>
              <p className="text-gray-600">Quản lý giáo viên, môn học, lớp học</p>
            </div>
          </Link>

          {/* Auto Schedule Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Xếp Tự Động</h2>
            <p className="text-gray-600">Xếp thời khóa biểu tự động</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 text-center">Đang tải...</div>
        ) : (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Đơn vị</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {units?.map((unit: any) => (
                  <li key={unit.id} className="px-6 py-4">
                    {unit.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

