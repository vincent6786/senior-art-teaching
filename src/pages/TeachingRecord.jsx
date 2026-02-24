import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { worksAPI, seniorsAPI, teachingRecordsAPI } from '../lib/supabase'
import { format } from 'date-fns'

function TeachingRecord({ currentLocation }) {
  const { workId } = useParams()
  const navigate = useNavigate()
  
  const [work, setWork] = useState(null)
  const [seniors, setSeniors] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [recordData, setRecordData] = useState({
    teaching_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  })

  const [participants, setParticipants] = useState([])

  // 載入作品與長輩資料
  useEffect(() => {
    loadData()
  }, [workId, currentLocation])

  const loadData = async () => {
    setLoading(true)
    try {
      // 載入作品資訊
      const workData = await worksAPI.getById(workId)
      setWork(workData)

      // 載入該中心的長輩
      if (currentLocation) {
        const seniorsData = await seniorsAPI.getByLocation(currentLocation.id)
        setSeniors(seniorsData)
      }
    } catch (error) {
      console.error('載入資料失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 切換長輩參與狀態
  const toggleSeniorParticipation = (seniorId) => {
    setParticipants(prev => {
      const exists = prev.find(p => p.senior_id === seniorId)
      if (exists) {
        return prev.filter(p => p.senior_id !== seniorId)
      } else {
        return [...prev, {
          senior_id: seniorId,
          completion_status: '完成',
          reaction: ''
        }]
      }
    })
  }

  // 更新參與者狀態
  const updateParticipant = (seniorId, field, value) => {
    setParticipants(prev => prev.map(p => 
      p.senior_id === seniorId ? { ...p, [field]: value } : p
    ))
  }

  // 提交記錄
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentLocation) {
      alert('請先選擇活動中心')
      return
    }

    if (participants.length === 0) {
      alert('請至少選擇一位參與的長輩')
      return
    }

    setSubmitting(true)

    try {
      await teachingRecordsAPI.create(
        {
          work_id: workId,
          location_id: currentLocation.id,
          teaching_date: recordData.teaching_date,
          notes: recordData.notes
        },
        participants
      )

      alert('記錄新增成功！')
      navigate('/')
    } catch (error) {
      console.error('新增記錄失敗:', error)
      alert('新增失敗：' + error.message)
    } finally {
      setSubmitting(false)
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

  if (!currentLocation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">⚠️</span>
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            請先選擇活動中心
          </h3>
          <p className="text-yellow-700 dark:text-yellow-400">
            請在頁面上方選擇你要記錄的活動中心
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">記錄教學</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        在 {currentLocation.name} 教學
      </p>

      {/* 作品資訊卡片 */}
      {work && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 flex gap-4 border border-gray-200 dark:border-gray-700">
          <img
            src={work.image_url}
            alt={work.title}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{work.title}</h3>
            <div className="flex gap-2 flex-wrap">
              {work.season && (
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                  {work.season}
                </span>
              )}
              {work.material_type && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                  {work.material_type}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 教學日期 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            教學日期
          </label>
          <input
            type="date"
            value={recordData.teaching_date}
            onChange={(e) => setRecordData(prev => ({ ...prev, teaching_date: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 參與長輩選擇 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            參與長輩 ({participants.length} 位)
          </h3>

          {seniors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              此中心尚無長輩資料，請先在設定中新增長輩
            </p>
          ) : (
            <div className="space-y-3">
              {seniors.map(senior => {
                const isSelected = participants.some(p => p.senior_id === senior.id)
                const participant = participants.find(p => p.senior_id === senior.id)

                return (
                  <div key={senior.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    {/* 長輩選擇 */}
                    <label className="flex items-center cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSeniorParticipation(senior.id)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="ml-3 font-medium text-gray-900 dark:text-white">
                        {senior.name}
                      </span>
                    </label>

                    {/* 展開的詳細資訊 */}
                    {isSelected && (
                      <div className="ml-8 space-y-3 border-l-2 border-indigo-200 dark:border-indigo-700 pl-4">
                        {/* 完成狀態 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            完成狀態
                          </label>
                          <div className="flex gap-2">
                            {['完成', '部分完成', '未完成'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateParticipant(senior.id, 'completion_status', status)}
                                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                                  participant.completion_status === status
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 反應/備註 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            反應與備註
                          </label>
                          <textarea
                            value={participant.reaction}
                            onChange={(e) => updateParticipant(senior.id, 'reaction', e.target.value)}
                            placeholder="例如：很喜歡這個主題、手部動作較慢、需要額外協助等"
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 整體備註 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            整體備註（選填）
          </label>
          <textarea
            value={recordData.notes}
            onChange={(e) => setRecordData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="例如：今天教學氣氛很好、部分長輩需要更多時間完成、建議下次準備更大的材料等"
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 提交按鈕 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || participants.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '儲存中...' : '儲存記錄'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TeachingRecord
