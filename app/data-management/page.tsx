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
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1) // Mặc định ID 1, thực tế nên lấy từ context hoặc user
  const [schoolYear, setSchoolYear] = useState<string>('2023-2024')

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Queries
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers', selectedUnitId],
    queryFn: () => teachersAPI.getAll(selectedUnitId),
    enabled: activeTab === 'teachers',
  })

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects', selectedUnitId],
    queryFn: () => subjectsAPI.getAll(selectedUnitId),
    enabled: activeTab === 'subjects',
  })

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes', selectedUnitId],
    queryFn: () => classesAPI.getAll(selectedUnitId),
    enabled: activeTab === 'classes',
  })

  // Mutations
  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      if (activeTab === 'teachers') return teachersAPI.importData(selectedUnitId, data)
      if (activeTab === 'subjects') return subjectsAPI.importData(selectedUnitId, data)
      if (activeTab === 'classes') return classesAPI.importData(selectedUnitId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] })
      setIsImportModalOpen(false)
      setFile(null)
      setPreview([])
      alert('Nhập dữ liệu thành công!')
    },
    onError: (error) => {
      console.error('Import error:', error)
      alert('Có lỗi xảy ra khi nhập dữ liệu.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        if (activeTab === 'teachers') return teachersAPI.delete(id)
        if (activeTab === 'subjects') return subjectsAPI.delete(id)
        if (activeTab === 'classes') return classesAPI.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] })
    },
  })

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: true,
          complete: (results) => setPreview(results.data),
        })
      } else {
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        setPreview(jsonData)
      }
    }
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const handleImport = () => {
    if (preview.length > 0) {
      setIsProcessing(true)
      importMutation.mutate(preview, {
        onSettled: () => setIsProcessing(false)
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      deleteMutation.mutate(id)
    }
  }

  const renderContent = () => {
    if (activeTab === 'teachers') {
      if (isLoadingTeachers) return <div>Đang tải...</div>
      return (
        <table className="min-w-full bg-white border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border">Tên Giáo viên</th>
              <th className="p-3 text-left border">Tên tắt</th>
              <th className="p-3 text-left border">Tổ chuyên môn</th>
              <th className="p-3 text-center border">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {teachers?.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-3 border">{t.name}</td>
                <td className="p-3 border">{t.name_short || '-'}</td>
                <td className="p-3 border">{t.professional_group_name || '-'}</td>
                <td className="p-3 border text-center">
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (activeTab === 'subjects') {
        if (isLoadingSubjects) return <div>Đang tải...</div>
        return (
            <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-100">
                <tr>
                <th className="p-3 text-left border">Môn học</th>
                <th className="p-3 text-left border">Tên tắt</th>
                <th className="p-3 text-left border">Số tiết</th>
                <th className="p-3 text-center border">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {subjects?.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 border">{s.name}</td>
                    <td className="p-3 border">{s.name_short || '-'}</td>
                    <td className="p-3 border">{JSON.stringify(s.periods_per_week)}</td>
                    <td className="p-3 border text-center">
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline">Xóa</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )
    }
    if (activeTab === 'classes') {
        if (isLoadingClasses) return <div>Đang tải...</div>
        return (
            <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-100">
                <tr>
                <th className="p-3 text-left border">Lớp</th>
                <th className="p-3 text-left border">Khối</th>
                <th className="p-3 text-left border">GVCN</th>
                <th className="p-3 text-center border">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {classes?.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3 border">{c.name}</td>
                    <td className="p-3 border">{c.grade}</td>
                    <td className="p-3 border">{c.homeroom_teacher_name || '-'}</td>
                    <td className="p-3 border text-center">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">Xóa</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Dữ liệu</h1>
        <div className="space-x-2">
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
                Nhập từ Excel/CSV
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 ${activeTab === 'teachers' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('teachers')}
        >
          Giáo viên
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'subjects' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('subjects')}
        >
          Môn học
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'classes' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('classes')}
        >
          Lớp học
        </button>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nhập dữ liệu {activeTab === 'teachers' ? 'Giáo viên' : activeTab === 'subjects' ? 'Môn học' : 'Lớp học'}</h2>
            
            <div className="mb-4">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {preview.length > 0 && (
              <div className="mb-4 border rounded overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left border-b bg-gray-50">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((row, idx) => (
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
                  {preview.length > 10 && (
                      <div className="p-2 text-center text-gray-500 italic">... và {preview.length - 10} dòng khác</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button
                onClick={() => {
                    setIsImportModalOpen(false)
                    setFile(null)
                    setPreview([])
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={!file || preview.length === 0 || isProcessing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isProcessing ? 'Đang xử lý...' : 'Nhập dữ liệu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
