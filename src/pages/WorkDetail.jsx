import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { worksAPI } from '../lib/supabase'
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    )
  }

  if (!work) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">找不到此作品</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* 返回按鈕 */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
      >
        <span className="mr-2">←</span>
        返回
      </button>

      {/* 作品主要資訊 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="aspect-[16/9] bg-gray-200">
          <img
            src={work.image_url}
            alt={work.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{work.title}</h1>

          {/* 標籤 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {work.season && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {work.season}
              </span>
            )}
            {work.festival && work.festival !== '無' && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {work.festival}
              </span>
            )}
            {work.material_type && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {work.material_type}
              </span>
            )}
          </div>

          {/* 作品描述 */}
          {work.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">作品說明</h3>
              <p className="text-gray-600">{work.description}</p>
            </div>
          )}

          {/* 快速記錄按鈕 */}
          <Link
            to={`/record/${work.id}`}
            className="block w-full text-center py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + 記錄教學
          </Link>
        </div>
      </div>

      {/* 教學歷史記錄 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {currentLocation ? `在 ${currentLocation.name} 的教學記錄` : '請選擇中心查看記錄'}
        </h2>

        {!currentLocation ? (
          <div className="text-center py-8 text-gray-500">
            請在頁面上方選擇活動中心以查看該中心的教學記錄
          </div>
        ) : teachingHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            此作品尚未在 {currentLocation.name} 教過
          </div>
        ) : (
          <div className="space-y-4">
            {teachingHistory.map(record => (
              <TeachingRecordCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 教學記錄卡片元件
function TeachingRecordCard({ record }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* 記錄摘要 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left"
      >
        <div>
          <p className="font-medium text-gray-900">
            {format(new Date(record.teaching_date), 'yyyy年 MM月 dd日')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {record.teaching_seniors?.length || 0} 位長輩參與
          </p>
        </div>
        <span className="text-gray-400">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 詳細資訊 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* 整體備註 */}
          {record.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">整體備註</h4>
              <p className="text-sm text-gray-600">{record.notes}</p>
            </div>
          )}

          {/* 參與長輩列表 */}
          {record.teaching_seniors && record.teaching_seniors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">參與長輩</h4>
              <div className="space-y-2">
                {record.teaching_seniors.map(ts => (
                  <div key={ts.id} className="bg-gray-50 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900">
                        {ts.seniors?.name || '未知'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ts.completion_status === '完成' 
                          ? 'bg-green-100 text-green-700'
                          : ts.completion_status === '部分完成'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {ts.completion_status}
                      </span>
                    </div>
                    {ts.reaction && (
                      <p className="text-sm text-gray-600 mt-2">{ts.reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WorkDetail
