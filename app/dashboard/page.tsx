'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unitsAPI, timetableAPI } from '@/lib/api'
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
  const queryClient = useQueryClient()
  
  // State cho đơn vị và năm học
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  const [unitName, setUnitName] = useState<string>('')
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026')
  const [showUnitInput, setShowUnitInput] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')
  
  // State cho quản lý đợt TKB
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')

  // Fetch units
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsAPI.getAll(),
  })

  // Fetch sessions khi đã chọn unit và school year
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['timetable-sessions', selectedUnitId, schoolYear],
    queryFn: () => {
      if (!selectedUnitId) return []
      return timetableAPI.getSessions(selectedUnitId, schoolYear)
    },
    enabled: !!selectedUnitId && !!schoolYear,
  })

  // Mutation để tạo đơn vị mới
  const createUnitMutation = useMutation({
    mutationFn: (name: string) => unitsAPI.create(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      setSelectedUnitId(data.id)
      setUnitName(data.name)
      setShowUnitInput(false)
      setNewUnitName('')
      alert(`✅ Đã thêm đơn vị "${data.name}" thành công!`)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi khi thêm đơn vị'
      alert(`❌ Lỗi: ${errorMessage}`)
    },
  })

  // Mutation để xóa đơn vị
  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) => unitsAPI.delete(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      // Nếu đơn vị đang được chọn bị xóa, reset selection
      if (selectedUnitId) {
        setSelectedUnitId(null)
        setUnitName('')
      }
      alert('✅ Đã xóa đơn vị thành công!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi khi xóa đơn vị'
      alert(`❌ Lỗi: ${errorMessage}`)
    },
  })

  // Mutation để tạo đợt TKB mới
  const createSessionMutation = useMutation({
    mutationFn: async (sessionName: string) => {
      if (!selectedUnitId) throw new Error('Chưa chọn đơn vị')
      if (!schoolYear.trim()) throw new Error('Chưa nhập năm học')
      try {
        const result = await timetableAPI.createSession(selectedUnitId, schoolYear, {
          session_name: sessionName,
          effective_date: new Date().toISOString().split('T')[0],
          timetable: {},
        })
        return result
      } catch (error: any) {
        throw new Error(error.response?.data?.detail || 'Lỗi khi tạo đợt TKB')
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timetable-sessions'] })
      setShowSessionDialog(false)
      const sessionName = data?.session_name || newSessionName
      setNewSessionName('')
      alert(`✅ Đã tạo đợt TKB "${sessionName}" thành công!`)
    },
    onError: (error: any) => {
      alert(error.message || 'Lỗi khi tạo đợt TKB')
    },
  })

  // Mutation để khóa/mở khóa đợt TKB
  const toggleLockMutation = useMutation({
    mutationFn: async ({ sessionId, isLocked }: { sessionId: number; isLocked: boolean }) => {
      return timetableAPI.toggleLock(sessionId, isLocked)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timetable-sessions'] })
      const message = variables.isLocked 
        ? '✅ Đã khóa đợt TKB. Không thể chỉnh sửa được nữa.'
        : '✅ Đã mở khóa đợt TKB. Có thể chỉnh sửa được.'
      alert(message)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi khi thay đổi trạng thái khóa'
      alert(`❌ Lỗi: ${errorMessage}`)
    },
  })

  // Mutation để xóa đợt TKB
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => timetableAPI.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-sessions'] })
      alert('✅ Đã xóa đợt TKB thành công!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi khi xóa đợt TKB'
      alert(`❌ Lỗi: ${errorMessage}`)
    },
  })

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

  const handleCreateUnit = () => {
    if (!newUnitName.trim()) {
      alert('⚠️ Vui lòng nhập tên đơn vị')
      return
    }
    createUnitMutation.mutate(newUnitName.trim())
  }

  const handleDeleteUnit = (unitId: number, unitName: string) => {
    if (confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA đơn vị "${unitName}"?\n\nHành động này sẽ XÓA VĨNH VIỄN:\n- Tất cả giáo viên\n- Tất cả lớp học\n- Tất cả môn học\n- Tất cả đợt TKB\n- Và tất cả dữ liệu liên quan\n\nHành động này KHÔNG THỂ hoàn tác!\n\nNhấn OK để xác nhận xóa.`)) {
      deleteUnitMutation.mutate(unitId)
    }
  }

  const handleCreateSession = () => {
    if (!newSessionName.trim()) {
      alert('Vui lòng nhập tên đợt TKB')
      return
    }
    if (!selectedUnitId) {
      alert('Vui lòng chọn đơn vị trước')
      return
    }
    if (!schoolYear.trim()) {
      alert('Vui lòng nhập năm học trước')
      return
    }
    createSessionMutation.mutate(newSessionName.trim())
  }

  const handleToggleLock = (sessionId: number, currentLockStatus: boolean) => {
    const action = currentLockStatus ? 'mở khóa' : 'khóa'
    const message = currentLockStatus 
      ? 'Bạn có chắc muốn mở khóa đợt TKB này? Sau khi mở khóa, có thể chỉnh sửa được.'
      : 'Bạn có chắc muốn khóa đợt TKB này? Sau khi khóa, không thể chỉnh sửa được nữa.'
    
    if (confirm(message)) {
      toggleLockMutation.mutate({ sessionId, isLocked: !currentLockStatus })
    }
  }

  const handleDeleteSession = (sessionId: number, sessionName: string) => {
    if (confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA đợt TKB "${sessionName}"?\n\nHành động này sẽ XÓA VĨNH VIỄN toàn bộ dữ liệu TKB của đợt này và KHÔNG THỂ hoàn tác!\n\nNhấn OK để xác nhận xóa.`)) {
      deleteSessionMutation.mutate(sessionId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-10 py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="dashboard-title">PHẦN MỀM XẾP THỜI KHÓA BIỂU</h1>
          <p className="dashboard-subtitle">{unitName || 'Chưa chọn đơn vị'} - {schoolYear}</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="space-y-4">
            {/* Hàng 1: Đơn vị và Năm học */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="font-semibold">Đơn vị:</label>
                {!showUnitInput ? (
                  <>
                    <select
                      value={selectedUnitId || ''}
                      onChange={(e) => {
                        const unitId = e.target.value ? parseInt(e.target.value) : null
                        setSelectedUnitId(unitId)
                        const unit = units?.find((u: any) => u.id === unitId)
                        setUnitName(unit?.name || '')
                      }}
                      className="border rounded px-3 py-1 min-w-[200px]"
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {units?.map((unit: any) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowUnitInput(true)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      + Thêm mới
                    </button>
                    {selectedUnitId && (
                      <button
                        onClick={() => {
                          const unit = units?.find((u: any) => u.id === selectedUnitId)
                          if (unit) {
                            handleDeleteUnit(selectedUnitId, unit.name)
                          }
                        }}
                        disabled={deleteUnitMutation.isPending}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        title="Xóa đơn vị đang chọn"
                      >
                        🗑️ Xóa đơn vị
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      placeholder="Nhập tên đơn vị mới"
                      className="border rounded px-3 py-1 min-w-[200px]"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateUnit()}
                    />
                    <button
                      onClick={handleCreateUnit}
                      disabled={createUnitMutation.isPending}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setShowUnitInput(false)
                        setNewUnitName('')
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="font-semibold">Năm học:</label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="2025-2026"
                  className="border rounded px-3 py-1 w-32"
                  onKeyPress={(e) => e.key === 'Enter' && alert('Năm học đã được cập nhật: ' + schoolYear)}
                />
                <button
                  onClick={() => {
                    if (schoolYear.trim()) {
                      alert('Năm học đã được cập nhật: ' + schoolYear)
                    } else {
                      alert('Vui lòng nhập năm học')
                    }
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Lưu năm học
                </button>
              </div>
            </div>

            {/* Hàng 2: Quản lý đợt TKB */}
            <div className="flex items-center gap-4 border-t pt-4">
              <label className="font-semibold">Đợt TKB:</label>
              <select
                value=""
                onChange={(e) => {
                  // Có thể thêm logic chọn đợt TKB ở đây
                }}
                className="border rounded px-3 py-1 min-w-[250px]"
                disabled={!selectedUnitId}
              >
                <option value="">-- Chọn đợt TKB --</option>
                {sessions?.map((session: any) => (
                  <option key={session.id} value={session.id}>
                    {session.session_name} {session.is_locked ? '(Đã khóa)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!selectedUnitId) {
                    alert('Vui lòng chọn đơn vị trước')
                    return
                  }
                  if (!schoolYear.trim()) {
                    alert('Vui lòng nhập năm học trước')
                    return
                  }
                  setShowSessionDialog(true)
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                + Thêm đợt TKB mới
              </button>
            </div>

            {/* Danh sách đợt TKB - Luôn hiển thị */}
            <div className="border-t pt-4">
              <label className="font-semibold block mb-2">Danh sách đợt TKB:</label>
              {sessionsLoading ? (
                <div className="text-gray-500">Đang tải...</div>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session.session_name}
                        </span>
                        {session.is_locked && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-semibold">
                            ĐÃ KHÓA
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleLock(session.id, session.is_locked)}
                          className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium"
                          title={session.is_locked ? 'Mở khóa để có thể chỉnh sửa' : 'Khóa để không thể chỉnh sửa'}
                        >
                          {session.is_locked ? '🔓 Mở khóa' : '🔒 Khóa'}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id, session.session_name)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 font-medium"
                          title="Xóa vĩnh viễn đợt TKB này"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 p-4 bg-gray-50 rounded border">
                  {selectedUnitId && schoolYear.trim() 
                    ? 'Chưa có đợt TKB nào. Nhấn nút "+ Thêm đợt TKB mới" để tạo đợt đầu tiên.'
                    : 'Vui lòng chọn đơn vị và nhập năm học để xem danh sách đợt TKB.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Cards Grid - Các chức năng cần thiết */}
        <div className="dashboard-grid">
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
            icon={iconMagic}
            title="Xếp Lịch Tự Động"
            description="Thiết lập và chạy thuật toán để tạo TKB mới."
            href="/autoschedule"
          />
          <DashboardCard
            icon={iconTimetable}
            title="Xem Thời Khóa Biểu"
            description="Xem, chỉnh sửa thủ công và in ấn TKB."
            href="/timetable"
          />
        </div>

        {/* Dialog thêm đợt TKB mới */}
        {showSessionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-xl font-bold mb-4">Thêm đợt TKB mới</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold">Tên đợt TKB:</label>
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="Ví dụ: Đợt 1 - Học kỳ 1"
                    className="w-full border rounded px-3 py-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowSessionDialog(false)
                      setNewSessionName('')
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={!newSessionName.trim() || createSessionMutation.isPending}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {createSessionMutation.isPending ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
