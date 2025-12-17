'use client'

import { useQuery } from '@tanstack/react-query'
import { unitsAPI } from '@/lib/api'
import Link from 'next/link'

// Dashboard Card Component
interface DashboardCardProps {
  icon: JSX.Element
  title: string
  description: string
  href?: string
  onClick?: () => void
}

function DashboardCard({ icon, title, description, href, onClick }: DashboardCardProps) {
  const content = (
    <div className="dashboard-card">
      <div className="dashboard-card-icon">{icon}</div>
      <div className="flex-1" />
      <h3 className="dashboard-card-title">{title}</h3>
      <p className="dashboard-card-description">{description}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="dashboard-card-link">
        {content}
      </Link>
    )
  }

  return (
    <div onClick={onClick} className="dashboard-card-link cursor-pointer">
      {content}
    </div>
  )
}

export default function DashboardPage() {
  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsAPI.getAll(),
  })

  // Get first unit for display (you can enhance this later)
  const currentUnit = units && units.length > 0 ? units[0] : null
  const unitName = currentUnit?.name || 'Chưa chọn đơn vị'
  const schoolYear = '2025-2026' // You can get this from context/state later

  // Icon color
  const iconColor = '#1890ff'

  // SVG Icons
  const iconTimetable = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )

  const iconMagic = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2.828 2.828 0 0 1 2 2l4 10a2 2 0 1 1-4 0l-4-10a2.828 2.828 0 0 1 2-2z"/>
      <path d="m18 18-3-3"/>
      <path d="m6 6-3-3"/>
      <path d="m21 15-3-3"/>
      <path d="m3 9 3 3"/>
      <path d="M12 22a2.828 2.828 0 0 0-2-2l-4-10a2 2 0 1 0 4 0l4 10a2.828 2.828 0 0 0-2 2z"/>
    </svg>
  )

  const iconDatabase = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  )

  const iconUsers = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )

  const iconChart = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="M18.7 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"/>
      <path d="M8.7 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1.7a2 2 0 0 1 2 2z"/>
    </svg>
  )

  const iconSettings = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )

  const iconAI = (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8"/>
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2a2 2 0 0 0 4 0v-2"/>
      <path d="M15 13h4"/>
    </svg>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-10 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="dashboard-title">PHẦN MỀM XẾP THỜI KHÓA BIỂU</h1>
          <p className="dashboard-subtitle">{unitName} - {schoolYear}</p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="dashboard-grid">
          <DashboardCard
            icon={iconTimetable}
            title="Xem Thời Khóa Biểu"
            description="Xem, chỉnh sửa thủ công và in ấn TKB."
            href="/timetable"
          />
          <DashboardCard
            icon={iconMagic}
            title="Xếp Lịch Tự Động"
            description="Thiết lập và chạy thuật toán để tạo TKB mới."
            href="/autoschedule"
          />
          <DashboardCard
            icon={iconDatabase}
            title="Dữ Liệu Nhà Trường"
            description="Quản lý Giáo viên, Lớp học, Môn học."
            href="/data-management"
          />
          <DashboardCard
            icon={iconUsers}
            title="Phân Công Giảng Dạy"
            description="Phân công giáo viên và phòng học chuyên môn."
            href="/assignment"
          />
          <DashboardCard
            icon={iconChart}
            title="Báo Cáo & Đánh Giá"
            description="Xem thống kê, đánh giá chất lượng và xuất file Excel."
            href="/reports"
          />
          <DashboardCard
            icon={iconSettings}
            title="Thiết Lập Nâng Cao"
            description="Quản lý tiết cố định, ngày nghỉ và các ràng buộc."
            href="/settings"
          />
          <DashboardCard
            icon={iconAI}
            title="Trợ lý AI"
            description="Tư vấn, phân tích và gợi ý cải tiến TKB."
            href="/ai-assistant"
          />
        </div>
      </main>
    </div>
  )
}
