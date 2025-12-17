'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unitsAPI, teachersAPI, subjectsAPI, classesAPI } from '@/lib/api'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

type TabType = 'teachers' | 'subjects' | 'classes'

interface Teacher {
  id: string
  name: string
  email?: string
  professional_group_name?: string
  subjects: string[]
  secondary_subjects: string[]
  busy_slots: number[][]
  target_periods?: number
  role?: string
  work_days_preference: number
  is_locked: boolean
}

interface Subject {
  name: string
  periods_per_week: Record<string, number>
  is_double_period_only: boolean
}

interface Class {
  name: string
  grade?: number
  session?: string
  homeroom_teacher_id?: string
  fixed_off_slots: number[][]
  is_locked: boolean
}

export default function DataManagementPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('teachers')
  
  // State cho đơn vị và năm học
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  const [unitName, setUnitName] = useState<string>('')
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026')
  
  // State cho dialog forms
  const [showTeacherDialog, setShowTeacherDialog] = useState(false)
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  
  // State cho import
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importType, setImportType] = useState<TabType>('teachers')

  // Fetch units
  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsAPI.getAll(),
  })

  // Fetch data based on active tab
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers', selectedUnitId, schoolYear],
    queryFn: () => {
      if (!selectedUnitId || !schoolYear) return []
      return teachersAPI.getAll(selectedUnitId, schoolYear)
    },
    enabled: activeTab === 'teachers' && !!selectedUnitId && !!schoolYear,
  })

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', selectedUnitId, schoolYear],
    queryFn: () => {
      if (!selectedUnitId || !schoolYear) return []
      return subjectsAPI.getAll(selectedUnitId, schoolYear)
    },
    enabled: activeTab === 'subjects' && !!selectedUnitId && !!schoolYear,
  })

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', selectedUnitId, schoolYear],
    queryFn: () => {
      if (!selectedUnitId || !schoolYear) return []
      return classesAPI.getAll(selectedUnitId, schoolYear)
    },
    enabled: activeTab === 'classes' && !!selectedUnitId && !!schoolYear,
  })

  // Get teachers for class homeroom selection
  const { data: allTeachers } = useQuery({
    queryKey: ['teachers', selectedUnitId, schoolYear],
    queryFn: () => {
      if (!selectedUnitId || !schoolYear) return []
      return teachersAPI.getAll(selectedUnitId, schoolYear)
    },
    enabled: !!selectedUnitId && !!schoolYear,
  })

  // Get subjects for teacher selection
  const { data: allSubjects } = useQuery({
    queryKey: ['subjects', selectedUnitId, schoolYear],
    queryFn: () => {
      if (!selectedUnitId || !schoolYear) return []
      return subjectsAPI.getAll(selectedUnitId, schoolYear)
    },
    enabled: !!selectedUnitId && !!schoolYear,
  })

  // Load unit and school year from localStorage on mount
  useEffect(() => {
    const savedUnitId = localStorage.getItem('selectedUnitId')
    const savedSchoolYear = localStorage.getItem('schoolYear')
    if (savedUnitId) {
      const unitId = parseInt(savedUnitId)
      setSelectedUnitId(unitId)
      const unit = units?.find((u: any) => u.id === unitId)
      if (unit) setUnitName(unit.name)
    }
    if (savedSchoolYear) {
      setSchoolYear(savedSchoolYear)
    }
  }, [units])

  // Save to localStorage when changed
  useEffect(() => {
    if (selectedUnitId) {
      localStorage.setItem('selectedUnitId', selectedUnitId.toString())
    }
  }, [selectedUnitId])

  useEffect(() => {
    if (schoolYear) {
      localStorage.setItem('schoolYear', schoolYear)
    }
  }, [schoolYear])

  // Mutations
  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return teachersAPI.create(selectedUnitId, schoolYear, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setShowTeacherDialog(false)
      setEditingTeacher(null)
      alert('✅ Đã thêm giáo viên thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi thêm giáo viên'}`)
    },
  })

  const updateTeacherMutation = useMutation({
    mutationFn: ({ teacherId, data }: { teacherId: string; data: any }) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return teachersAPI.update(selectedUnitId, schoolYear, teacherId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setShowTeacherDialog(false)
      setEditingTeacher(null)
      alert('✅ Đã cập nhật giáo viên thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi cập nhật giáo viên'}`)
    },
  })

  const deleteTeacherMutation = useMutation({
    mutationFn: (teacherId: string) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return teachersAPI.delete(selectedUnitId, schoolYear, teacherId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      alert('✅ Đã xóa giáo viên thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi xóa giáo viên'}`)
    },
  })

  const createSubjectMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return subjectsAPI.create(selectedUnitId, schoolYear, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowSubjectDialog(false)
      setEditingSubject(null)
      alert('✅ Đã thêm môn học thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi thêm môn học'}`)
    },
  })

  const updateSubjectMutation = useMutation({
    mutationFn: ({ subjectName, data }: { subjectName: string; data: any }) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return subjectsAPI.update(selectedUnitId, schoolYear, subjectName, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowSubjectDialog(false)
      setEditingSubject(null)
      alert('✅ Đã cập nhật môn học thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi cập nhật môn học'}`)
    },
  })

  const deleteSubjectMutation = useMutation({
    mutationFn: (subjectName: string) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return subjectsAPI.delete(selectedUnitId, schoolYear, subjectName)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      alert('✅ Đã xóa môn học thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi xóa môn học'}`)
    },
  })

  const createClassMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return classesAPI.create(selectedUnitId, schoolYear, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setShowClassDialog(false)
      setEditingClass(null)
      alert('✅ Đã thêm lớp học thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi thêm lớp học'}`)
    },
  })

  const updateClassMutation = useMutation({
    mutationFn: ({ className, data }: { className: string; data: any }) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return classesAPI.update(selectedUnitId, schoolYear, className, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setShowClassDialog(false)
      setEditingClass(null)
      alert('✅ Đã cập nhật lớp học thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi cập nhật lớp học'}`)
    },
  })

  const deleteClassMutation = useMutation({
    mutationFn: (className: string) => {
      if (!selectedUnitId || !schoolYear) throw new Error('Chưa chọn đơn vị hoặc năm học')
      return classesAPI.delete(selectedUnitId, schoolYear, className)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      alert('✅ Đã xóa lớp học thành công!')
    },
    onError: (error: any) => {
      alert(`❌ Lỗi: ${error.response?.data?.detail || error.message || 'Lỗi khi xóa lớp học'}`)
    },
  })

  const handleOpenTeacherDialog = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher)
    } else {
      setEditingTeacher(null)
    }
    setShowTeacherDialog(true)
  }

  const handleOpenSubjectDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject)
    } else {
      setEditingSubject(null)
    }
    setShowSubjectDialog(true)
  }

  const handleOpenClassDialog = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls)
    } else {
      setEditingClass(null)
    }
    setShowClassDialog(true)
  }

  const handleDeleteTeacher = (teacher: Teacher) => {
    if (confirm(`⚠️ Bạn có chắc muốn xóa giáo viên "${teacher.name}"?`)) {
      deleteTeacherMutation.mutate(teacher.id)
    }
  }

  const handleDeleteSubject = (subject: Subject) => {
    if (confirm(`⚠️ Bạn có chắc muốn xóa môn học "${subject.name}"?`)) {
      deleteSubjectMutation.mutate(subject.name)
    }
  }

  const handleDeleteClass = (cls: Class) => {
    if (confirm(`⚠️ Bạn có chắc muốn xóa lớp học "${cls.name}"?`)) {
      deleteClassMutation.mutate(cls.name)
    }
  }

  const handleImport = (type: TabType) => {
    setImportType(type)
    setShowImportDialog(true)
  }

  if (!selectedUnitId || !schoolYear.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Vui lòng chọn đơn vị và năm học</h2>
            <p className="text-gray-600 mb-4">
              Bạn cần chọn đơn vị và nhập năm học từ trang Dashboard trước khi quản lý dữ liệu.
            </p>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dữ Liệu Nhà Trường</h1>
              <p className="text-gray-600 mt-1">{unitName} - {schoolYear}</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['teachers', 'subjects', 'classes'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'teachers' && '👥 Giáo viên'}
                  {tab === 'subjects' && '📚 Môn học'}
                  {tab === 'classes' && '🏫 Lớp học'}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  if (activeTab === 'teachers') handleOpenTeacherDialog()
                  else if (activeTab === 'subjects') handleOpenSubjectDialog()
                  else if (activeTab === 'classes') handleOpenClassDialog()
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Thêm mới
              </button>
              <button
                onClick={() => handleImport(activeTab)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                📥 Nhập từ file
              </button>
            </div>

            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              <div>
                {teachersLoading ? (
                  <div className="text-center py-8 text-gray-500">Đang tải...</div>
                ) : teachers && teachers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổ CM</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn dạy</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.map((teacher: Teacher) => (
                          <tr key={teacher.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{teacher.id}</td>
                            <td className="px-4 py-3 text-sm font-medium">{teacher.name}</td>
                            <td className="px-4 py-3 text-sm">{teacher.email || '-'}</td>
                            <td className="px-4 py-3 text-sm">{teacher.professional_group_name || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              {teacher.subjects?.join(', ') || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenTeacherDialog(teacher)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteTeacher(teacher)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  🗑️ Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có dữ liệu. Nhấn nút "+ Thêm mới" để thêm giáo viên đầu tiên.
                  </div>
                )}
              </div>
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
              <div>
                {subjectsLoading ? (
                  <div className="text-center py-8 text-gray-500">Đang tải...</div>
                ) : subjects && subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên môn</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiết/tuần</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chỉ tiết đôi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subjects.map((subject: Subject) => (
                          <tr key={subject.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{subject.name}</td>
                            <td className="px-4 py-3 text-sm">
                              {Object.entries(subject.periods_per_week || {})
                                .map(([grade, periods]) => `Khối ${grade}: ${periods} tiết`)
                                .join(', ') || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {subject.is_double_period_only ? '✅ Có' : '❌ Không'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenSubjectDialog(subject)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(subject)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  🗑️ Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có dữ liệu. Nhấn nút "+ Thêm mới" để thêm môn học đầu tiên.
                  </div>
                )}
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div>
                {classesLoading ? (
                  <div className="text-center py-8 text-gray-500">Đang tải...</div>
                ) : classes && classes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên lớp</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khối</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buổi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GVCN</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {classes.map((cls: Class) => (
                          <tr key={cls.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{cls.name}</td>
                            <td className="px-4 py-3 text-sm">{cls.grade || '-'}</td>
                            <td className="px-4 py-3 text-sm">{cls.session || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                              {cls.homeroom_teacher_id || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenClassDialog(cls)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(cls)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  🗑️ Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có dữ liệu. Nhấn nút "+ Thêm mới" để thêm lớp học đầu tiên.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Teacher Dialog */}
        {showTeacherDialog && (
          <TeacherDialog
            teacher={editingTeacher}
            onClose={() => {
              setShowTeacherDialog(false)
              setEditingTeacher(null)
            }}
            onSubmit={(data) => {
              if (editingTeacher) {
                updateTeacherMutation.mutate({ teacherId: editingTeacher.id, data })
              } else {
                createTeacherMutation.mutate(data)
              }
            }}
            subjects={allSubjects || []}
            isLoading={createTeacherMutation.isPending || updateTeacherMutation.isPending}
          />
        )}

        {/* Subject Dialog */}
        {showSubjectDialog && (
          <SubjectDialog
            subject={editingSubject}
            onClose={() => {
              setShowSubjectDialog(false)
              setEditingSubject(null)
            }}
            onSubmit={(data) => {
              if (editingSubject) {
                updateSubjectMutation.mutate({ subjectName: editingSubject.name, data })
              } else {
                createSubjectMutation.mutate(data)
              }
            }}
            isLoading={createSubjectMutation.isPending || updateSubjectMutation.isPending}
          />
        )}

        {/* Class Dialog */}
        {showClassDialog && (
          <ClassDialog
            cls={editingClass}
            onClose={() => {
              setShowClassDialog(false)
              setEditingClass(null)
            }}
            onSubmit={(data) => {
              if (editingClass) {
                updateClassMutation.mutate({ className: editingClass.name, data })
              } else {
                createClassMutation.mutate(data)
              }
            }}
            teachers={allTeachers || []}
            isLoading={createClassMutation.isPending || updateClassMutation.isPending}
          />
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <ImportDialog
            type={importType}
            onClose={() => setShowImportDialog(false)}
            onImport={async (data: any[]) => {
              try {
                let successCount = 0
                let errorCount = 0
                
                for (const item of data) {
                  try {
                    if (importType === 'teachers') {
                      await teachersAPI.create(selectedUnitId!, schoolYear, item)
                    } else if (importType === 'subjects') {
                      await subjectsAPI.create(selectedUnitId!, schoolYear, item)
                    } else if (importType === 'classes') {
                      await classesAPI.create(selectedUnitId!, schoolYear, item)
                    }
                    successCount++
                  } catch (error: any) {
                    errorCount++
                    console.error('Error importing item:', item, error)
                  }
                }
                
                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: [importType] })
                
                if (errorCount > 0) {
                  alert(`⚠️ Đã nhập ${successCount} bản ghi thành công, ${errorCount} bản ghi lỗi.`)
                } else {
                  alert(`✅ Đã nhập thành công ${successCount} bản ghi!`)
                }
                setShowImportDialog(false)
              } catch (error: any) {
                alert(`❌ Lỗi khi nhập dữ liệu: ${error.message || 'Lỗi không xác định'}`)
              }
            }}
            unitId={selectedUnitId!}
            schoolYear={schoolYear}
          />
        )}
      </div>
    </div>
  )
}

// Teacher Dialog Component
function TeacherDialog({
  teacher,
  onClose,
  onSubmit,
  subjects,
  isLoading,
}: {
  teacher?: Teacher | null
  onClose: () => void
  onSubmit: (data: any) => void
  subjects: Subject[]
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    id: teacher?.id || '',
    name: teacher?.name || '',
    email: teacher?.email || '',
    professional_group_name: teacher?.professional_group_name || '',
    subjects: teacher?.subjects || [],
    secondary_subjects: teacher?.secondary_subjects || [],
    target_periods: teacher?.target_periods?.toString() || '',
    role: teacher?.role || '',
    work_days_preference: teacher?.work_days_preference?.toString() || '0',
    is_locked: teacher?.is_locked || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id.trim() || !formData.name.trim()) {
      alert('Vui lòng nhập ID và Họ tên')
      return
    }

    onSubmit({
      id: formData.id.trim(),
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      professional_group_name: formData.professional_group_name.trim() || undefined,
      subjects: formData.subjects,
      secondary_subjects: formData.secondary_subjects,
      target_periods: formData.target_periods ? parseInt(formData.target_periods) : undefined,
      role: formData.role.trim() || undefined,
      work_days_preference: parseInt(formData.work_days_preference) || 0,
      is_locked: formData.is_locked,
      busy_slots: teacher?.busy_slots || [],
    })
  }

  const toggleSubject = (subjectName: string, isSecondary: boolean = false) => {
    const field = isSecondary ? 'secondary_subjects' : 'subjects'
    const current = formData[field] as string[]
    if (current.includes(subjectName)) {
      setFormData({
        ...formData,
        [field]: current.filter((s) => s !== subjectName),
      })
    } else {
      setFormData({
        ...formData,
        [field]: [...current, subjectName],
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {teacher ? 'Sửa giáo viên' : 'Thêm giáo viên mới'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">ID giáo viên *</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
                disabled={!!teacher}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Họ tên *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Tổ chuyên môn</label>
              <input
                type="text"
                value={formData.professional_group_name}
                onChange={(e) => setFormData({ ...formData, professional_group_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Ví dụ: Toán, Văn, Anh..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Số tiết mục tiêu</label>
              <input
                type="number"
                value={formData.target_periods}
                onChange={(e) => setFormData({ ...formData, target_periods: e.target.value })}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Vai trò</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Ví dụ: Hiệu trưởng, Phó hiệu trưởng..."
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Môn dạy chính</label>
            <div className="border rounded p-3 max-h-32 overflow-y-auto">
              {subjects.length > 0 ? (
                <div className="space-y-1">
                  {subjects.map((subject) => (
                    <label key={subject.name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject.name)}
                        onChange={() => toggleSubject(subject.name, false)}
                        className="rounded"
                      />
                      <span className="text-sm">{subject.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có môn học nào. Vui lòng thêm môn học trước.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Môn dạy phụ</label>
            <div className="border rounded p-3 max-h-32 overflow-y-auto">
              {subjects.length > 0 ? (
                <div className="space-y-1">
                  {subjects.map((subject) => (
                    <label key={subject.name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.secondary_subjects.includes(subject.name)}
                        onChange={() => toggleSubject(subject.name, true)}
                        className="rounded"
                      />
                      <span className="text-sm">{subject.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có môn học nào. Vui lòng thêm môn học trước.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_locked"
              checked={formData.is_locked}
              onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_locked" className="cursor-pointer">
              Khóa (không cho chỉnh sửa)
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : teacher ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Subject Dialog Component
function SubjectDialog({
  subject,
  onClose,
  onSubmit,
  isLoading,
}: {
  subject?: Subject | null
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: subject?.name || '',
    is_double_period_only: subject?.is_double_period_only || false,
    periods_per_week: subject?.periods_per_week || {},
  })

  const [gradeInput, setGradeInput] = useState('')
  const [periodsInput, setPeriodsInput] = useState('')

  const handleAddPeriod = () => {
    if (!gradeInput.trim() || !periodsInput.trim()) {
      alert('Vui lòng nhập khối và số tiết')
      return
    }
    const grade = gradeInput.trim()
    const periods = parseInt(periodsInput)
    if (isNaN(periods) || periods < 0) {
      alert('Số tiết phải là số nguyên dương')
      return
    }
    setFormData({
      ...formData,
      periods_per_week: {
        ...formData.periods_per_week,
        [grade]: periods,
      },
    })
    setGradeInput('')
    setPeriodsInput('')
  }

  const handleRemovePeriod = (grade: string) => {
    const newPeriods = { ...formData.periods_per_week }
    delete newPeriods[grade]
    setFormData({
      ...formData,
      periods_per_week: newPeriods,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên môn học')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {subject ? 'Sửa môn học' : 'Thêm môn học mới'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Tên môn học *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
              disabled={!!subject}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Số tiết/tuần theo khối</label>
            <div className="border rounded p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Khối (6, 7, 8, 9, 10, 11, 12)"
                  className="flex-1 border rounded px-3 py-2"
                />
                <input
                  type="number"
                  value={periodsInput}
                  onChange={(e) => setPeriodsInput(e.target.value)}
                  placeholder="Số tiết"
                  className="w-24 border rounded px-3 py-2"
                  min="0"
                />
                <button
                  type="button"
                  onClick={handleAddPeriod}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  + Thêm
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {Object.entries(formData.periods_per_week).map(([grade, periods]) => (
                  <div key={grade} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">Khối {grade}: {periods} tiết/tuần</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePeriod(grade)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕ Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_double_period_only"
              checked={formData.is_double_period_only}
              onChange={(e) => setFormData({ ...formData, is_double_period_only: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_double_period_only" className="cursor-pointer">
              Chỉ dạy tiết đôi (2 tiết liên tiếp)
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : subject ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Class Dialog Component
function ClassDialog({
  cls,
  onClose,
  onSubmit,
  teachers,
  isLoading,
}: {
  cls?: Class | null
  onClose: () => void
  onSubmit: (data: any) => void
  teachers: Teacher[]
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: cls?.name || '',
    grade: cls?.grade?.toString() || '',
    session: cls?.session || '',
    homeroom_teacher_id: cls?.homeroom_teacher_id || '',
    is_locked: cls?.is_locked || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên lớp')
      return
    }
    onSubmit({
      name: formData.name.trim(),
      grade: formData.grade ? parseInt(formData.grade) : undefined,
      session: formData.session.trim() || undefined,
      homeroom_teacher_id: formData.homeroom_teacher_id.trim() || undefined,
      is_locked: formData.is_locked,
      fixed_off_slots: cls?.fixed_off_slots || [],
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold mb-4">
          {cls ? 'Sửa lớp học' : 'Thêm lớp học mới'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Tên lớp *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
              disabled={!!cls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Khối</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Chọn khối --</option>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Buổi học</label>
              <select
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Chọn buổi --</option>
                <option value="Sáng">Sáng</option>
                <option value="Chiều">Chiều</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Giáo viên chủ nhiệm</label>
            <select
              value={formData.homeroom_teacher_id}
              onChange={(e) => setFormData({ ...formData, homeroom_teacher_id: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Chọn GVCN --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_locked"
              checked={formData.is_locked}
              onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_locked" className="cursor-pointer">
              Khóa (không cho chỉnh sửa)
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : cls ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Import Dialog Component
function ImportDialog({
  type,
  onClose,
  onImport,
  unitId,
  schoolYear,
}: {
  type: TabType
  onClose: () => void
  onImport: (data: any[]) => void
  unitId: number
  schoolYear: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      // Parse CSV
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = processImportedData(results.data as any[], type)
          setPreview(data.slice(0, 5)) // Show first 5 rows
          setIsProcessing(false)
        },
        error: (error) => {
          alert(`Lỗi khi đọc file CSV: ${error.message}`)
          setIsProcessing(false)
        },
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          const processed = processImportedData(jsonData as any[], type)
          setPreview(processed.slice(0, 5)) // Show first 5 rows
          setIsProcessing(false)
        } catch (error: any) {
          alert(`Lỗi khi đọc file Excel: ${error.message}`)
          setIsProcessing(false)
        }
      }
      reader.readAsArrayBuffer(selectedFile)
    } else {
      alert('Chỉ hỗ trợ file CSV hoặc Excel (.xlsx, .xls)')
      setIsProcessing(false)
    }
  }

  const processImportedData = (data: any[], importType: TabType): any[] => {
    if (importType === 'teachers') {
      return data.map((row) => ({
        id: String(row['ID'] || row['id'] || row['Mã GV'] || ''),
        name: String(row['Họ tên'] || row['name'] || row['Tên'] || ''),
        email: row['Email'] || row['email'] || undefined,
        professional_group_name: row['Tổ CM'] || row['Tổ chuyên môn'] || row['professional_group_name'] || undefined,
        subjects: row['Môn dạy'] 
          ? String(row['Môn dạy']).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        secondary_subjects: row['Môn dạy phụ']
          ? String(row['Môn dạy phụ']).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        target_periods: row['Số tiết'] || row['target_periods'] ? parseInt(row['Số tiết'] || row['target_periods']) : undefined,
        role: row['Vai trò'] || row['role'] || undefined,
        work_days_preference: parseInt(row['work_days_preference'] || '0') || 0,
        is_locked: false,
        busy_slots: [],
      })).filter((item) => item.id && item.name)
    } else if (importType === 'subjects') {
      return data.map((row) => {
        const periodsPerWeek: Record<string, number> = {}
        // Try to parse periods from different column formats
        for (let grade = 6; grade <= 12; grade++) {
          const key = `Khối ${grade}` || `Grade ${grade}` || `grade_${grade}`
          if (row[key] !== undefined) {
            periodsPerWeek[String(grade)] = parseInt(row[key]) || 0
          }
        }
        return {
          name: String(row['Tên môn'] || row['name'] || row['Môn học'] || ''),
          periods_per_week: periodsPerWeek,
          is_double_period_only: row['Chỉ tiết đôi'] === 'Có' || row['is_double_period_only'] === true || false,
        }
      }).filter((item) => item.name)
    } else if (importType === 'classes') {
      return data.map((row) => ({
        name: String(row['Tên lớp'] || row['name'] || row['Lớp'] || ''),
        grade: row['Khối'] || row['grade'] ? parseInt(row['Khối'] || row['grade']) : undefined,
        session: row['Buổi'] || row['session'] || undefined,
        homeroom_teacher_id: row['GVCN'] || row['homeroom_teacher_id'] || undefined,
        is_locked: false,
        fixed_off_slots: [],
      })).filter((item) => item.name)
    }
    return []
  }

  const handleImport = () => {
    if (!file) {
      alert('Vui lòng chọn file trước')
      return
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let allData: any[] = []

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          allData = processImportedData(results.data as any[], type)
          onImport(allData)
        },
        error: (error) => {
          alert(`Lỗi khi đọc file CSV: ${error.message}`)
        },
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          allData = processImportedData(jsonData as any[], type)
          onImport(allData)
        } catch (error: any) {
          alert(`Lỗi khi đọc file Excel: ${error.message}`)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const getTemplateInfo = () => {
    if (type === 'teachers') {
      return {
        title: 'Nhập danh sách Giáo viên',
        columns: ['ID', 'Họ tên', 'Email', 'Tổ CM', 'Môn dạy', 'Số tiết'],
        example: [
          { ID: 'GV001', 'Họ tên': 'Nguyễn Văn A', Email: 'nguyenvana@example.com', 'Tổ CM': 'Toán', 'Môn dạy': 'Toán, Lý', 'Số tiết': '20' },
        ],
      }
    } else if (type === 'subjects') {
      return {
        title: 'Nhập danh sách Môn học',
        columns: ['Tên môn', 'Khối 6', 'Khối 7', 'Khối 8', 'Chỉ tiết đôi'],
        example: [
          { 'Tên môn': 'Toán', 'Khối 6': '4', 'Khối 7': '4', 'Khối 8': '4', 'Chỉ tiết đôi': 'Không' },
        ],
      }
    } else {
      return {
        title: 'Nhập danh sách Lớp học',
        columns: ['Tên lớp', 'Khối', 'Buổi', 'GVCN'],
        example: [
          { 'Tên lớp': '6A1', 'Khối': '6', 'Buổi': 'Sáng', 'GVCN': 'GV001' },
        ],
      }
    }
  }

  const template = getTemplateInfo()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{template.title}</h3>

        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm font-semibold mb-2">Cấu trúc file cần có các cột:</p>
          <div className="text-sm space-y-1">
            {template.columns.map((col, idx) => (
              <span key={idx} className="inline-block bg-white px-2 py-1 rounded mr-2 mb-1 border">
                {col}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Chọn file (CSV hoặc Excel):</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="w-full border rounded px-3 py-2"
            disabled={isProcessing}
          />
        </div>

        {isProcessing && (
          <div className="text-center py-4 text-gray-500">Đang xử lý file...</div>
        )}

        {preview.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Xem trước dữ liệu (5 dòng đầu):</p>
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="px-3 py-2 text-left border-b">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="px-3 py-2 border-b">
                          {String(val || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Hủy
          </button>
          <button
            onClick={handleImport}
            disabled={!file || preview.length === 0 || isProcessing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Nhập dữ liệu
          </button>
        </div>
      </div>
    </div>
  )
}
