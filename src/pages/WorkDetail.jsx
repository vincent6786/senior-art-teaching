import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { worksAPI, teachingRecordsAPI } from '../lib/supabase'
import { format } from 'date-fns'

function WorkDetail({ currentLocation }) {
  const { workId } = useParams()
  const navigate = useNavigate()
  
  const [work, setWork] = useState(null)
  const [teachingHistory, setTeachingHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkDetail()
  }, [workId, currentLocation])

  const loadWorkDetail = async () => {
    setLoading(true)
    try {
      // 載入作品資訊
      const workData = await worksAPI.getById(workId)
      setWork(workData)

      // 如果有選擇中心，載入該中心的教學記錄
      if (currentLocation) {
        const history = await worksAPI.getLocationHistory(workId, currentLocation.id)
        setTeachingHistory(history)
      }
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('確定要刪除此教學記錄嗎？')) return

    try {
      await teachingRecordsAPI.delete(recordId)
      await loadWorkDetail()
      alert('刪除成功！')
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">載入中...</p>
      </div>
    )
  }

  if (!work) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">找不到此作品</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* 返回按鈕 */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
      >
        <span className="mr-2">←</span>
        返回
      </button>

      {/* 作品主要資訊 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
        <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700">
          <img
            src={work.image_url}
            alt={work.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{work.title}</h1>

          {/* 標籤 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {work.season && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                {work.season}
              </span>
            )}
            {work.festival && work.festival !== '無' && (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                {work.festival}
              </span>
            )}
            {work.material_type && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
                {work.material_type}
              </span>
            )}
          </div>

          {/* 作品描述 */}
          {work.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">作品說明</h3>
              <p className="text-gray-600 dark:text-gray-400">{work.description}</p>
            </div>
          )}

          {/* 快速記錄按鈕 */}
          <Link
            to={`/record/${work.id}`}
            className="block w-full text-center py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            + 記錄教學
          </Link>
        </div>
      </div>

      {/* 教學歷史記錄 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {currentLocation ? `在 ${currentLocation.name} 的教學記錄` : '請選擇中心查看記錄'}
        </h2>

        {!currentLocation ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            請在頁面上方選擇活動中心以查看該中心的教學記錄
          </div>
        ) : teachingHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            此作品尚未在 {currentLocation.name} 教過
          </div>
        ) : (
          <div className="space-y-4">
            {teachingHistory.map(record => (
              <TeachingRecordCard 
                key={record.id} 
                record={record} 
                onDelete={handleDeleteRecord}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 教學記錄卡片元件
function TeachingRecordCard({ record, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
      {/* 記錄摘要 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left"
      >
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(new Date(record.teaching_date), 'yyyy年 MM月 dd日')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {record.teaching_seniors?.length || 0} 位長輩參與
          </p>
        </div>
        <span className="text-gray-400 dark:text-gray-500">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 詳細資訊 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
          {/* 整體備註 */}
          {record.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">整體備註</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{record.notes}</p>
            </div>
          )}

          {/* 參與長輩列表 */}
          {record.teaching_seniors && record.teaching_seniors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">參與長輩</h4>
              <div className="space-y-2">
                {record.teaching_seniors.map(ts => (
                  <div key={ts.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ts.seniors?.name || '未知'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ts.completion_status === '完成' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : ts.completion_status === '部分完成'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {ts.completion_status}
                      </span>
                    </div>
                    {ts.reaction && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{ts.reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 刪除記錄按鈕 */}
          <button
            onClick={() => onDelete(record.id)}
            className="w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800"
          >
            🗑️ 刪除此記錄
          </button>
        </div>
      )}
    </div>
  )
}

export default WorkDetail
