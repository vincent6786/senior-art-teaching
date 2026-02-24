import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { worksAPI, teachingRecordsAPI } from '../lib/supabase'
import { format } from 'date-fns'

const CLOUD_NAME = 'dbq5zvmwv'
const UPLOAD_PRESET = 'vetwuqsc'

// 上傳現場照片：依設定選擇 Cloudinary 或 base64
async function uploadFieldPhoto(file) {
  const mode = localStorage.getItem('storageMode') || 'cloudinary'

  if (mode === 'supabase') {
    // base64 壓縮，存 Supabase
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          const maxSize = 600
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round(height * maxSize / width); width = maxSize }
            else { width = Math.round(width * maxSize / height); height = maxSize }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Cloudinary 上傳
  const blob = await new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        const maxSize = 800
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize }
          else { width = Math.round(width * maxSize / height); height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, 'image/jpeg', 0.78)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const formData = new FormData()
  formData.append('file', blob, 'field-photo.jpg')
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'senior-art/field-photos')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()
  if (data.error) throw new Error('照片上傳失敗：' + data.error.message)
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
}

function TeachingRecord({ currentLocation, allSeniors = [] }) {
  const { workId } = useParams()
  const navigate = useNavigate()
  const [work, setWork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const detailMode = localStorage.getItem('teachingDetailMode') !== 'simple'
  const [recordData, setRecordData] = useState({ teaching_date: format(new Date(), 'yyyy-MM-dd'), notes: '' })
  const [participants, setParticipants] = useState([])
  const [photos, setPhotos] = useState([])

  const seniors = currentLocation ? allSeniors.filter(s => s.location_id === currentLocation.id) : []

  useEffect(() => {
    worksAPI.getById(workId).then(setWork).catch(console.error).finally(() => setLoading(false))
  }, [workId])

  const handlePhotoAdd = async (e) => {
    const files = Array.from(e.target.files)
    const remaining = 3 - photos.length
    if (remaining <= 0) return
    setCompressing(true)
    try {
      // 上傳到 Cloudinary，回傳網址
      const urls = await Promise.all(
        files.slice(0, remaining).map(uploadFieldPhoto)
      )
      setPhotos(prev => [...prev, ...urls])
    } catch (err) { alert('照片上傳失敗：' + err.message) }
    finally { setCompressing(false) }
    e.target.value = ''
  }

  const toggleSenior = (seniorId) => {
    setParticipants(prev => {
      const exists = prev.find(p => p.senior_id === seniorId)
      if (exists) return prev.filter(p => p.senior_id !== seniorId)
      return [...prev, { senior_id: seniorId, completion_status: '完成', reaction: '' }]
    })
  }

  const updateParticipant = (seniorId, field, value) =>
    setParticipants(prev => prev.map(p => p.senior_id === seniorId ? { ...p, [field]: value } : p))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentLocation) { alert('請先選擇活動中心'); return }
    if (!recordData.teaching_date) { alert('請選擇教學日期'); return }
    setSubmitting(true)
    try {
      await teachingRecordsAPI.create(
        { work_id: workId, location_id: currentLocation.id, teaching_date: recordData.teaching_date, notes: recordData.notes, photos },
        participants
      )
      alert('記錄新增成功！')
      navigate('/')
    } catch (error) {
      alert('新增失敗：' + error.message)
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="text-center py-16">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">載入中...</p>
    </div>
  )

  if (!currentLocation) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
        <span className="text-4xl mb-3 block">⚠️</span>
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">請先選擇活動中心</h3>
        <p className="text-yellow-700 dark:text-yellow-400">請在頁面上方選擇你要記錄的活動中心</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">記錄教學</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">在 {currentLocation.name} 教學</p>

      {work && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 flex gap-4 border border-gray-200 dark:border-gray-700">
          <img src={work.image_url} alt={work.title} className="w-20 h-20 object-cover rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{work.title}</h3>
            <div className="flex gap-2 flex-wrap">
              {work.season && <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">{work.season}</span>}
              {work.material_type && <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">{work.material_type}</span>}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 日期 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📅 教學日期</label>
          <input type="date" value={recordData.teaching_date}
            onChange={(e) => setRecordData(prev => ({ ...prev, teaching_date: e.target.value }))}
            className="w-full max-w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            style={{ boxSizing: 'border-box' }} />
        </div>

        {/* 照片 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">📷 現場照片（選填）</h3>
            <span className="text-xs text-gray-400">{photos.length} / 3 張</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {photos.map((src, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0 shadow-sm">
                <img src={src} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow">✕</button>
              </div>
            ))}
            {photos.length < 3 && (
              <label className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 ${
                compressing ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 bg-gray-50 dark:bg-gray-700/50'
              }`}>
                {compressing ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mb-1"></div><span className="text-xs text-indigo-500">上傳中</span></>
                ) : (
                  <><span className="text-2xl mb-1">📸</span><span className="text-xs text-gray-500 dark:text-gray-400">新增照片</span></>
                )}
                <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} disabled={compressing} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 長輩 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">👥 參與長輩（選填）</h3>
            {participants.length > 0 && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-full font-medium">已選 {participants.length} 位</span>
            )}
          </div>
          {seniors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">此中心尚無長輩資料，請先在設定中新增長輩</p>
          ) : (
            <div className="space-y-2">
              {seniors.map(senior => {
                const isSelected = participants.some(p => p.senior_id === senior.id)
                const participant = participants.find(p => p.senior_id === senior.id)
                return (
                  <div key={senior.id} className={`rounded-xl border transition-all overflow-hidden ${isSelected ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'}`}>
                    <label className="flex items-center gap-3 p-3 cursor-pointer select-none">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSenior(senior.id)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 shrink-0" />
                      <span className={`font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>{senior.name}</span>
                    </label>
                    {isSelected && detailMode && (
                      <div className="px-4 pb-4 pt-2 space-y-3 border-t border-indigo-200 dark:border-indigo-700/50">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">完成狀態</p>
                          <div className="flex gap-2 flex-wrap">
                            {['完成', '部分完成', '未完成'].map(status => (
                              <button key={status} type="button" onClick={() => updateParticipant(senior.id, 'completion_status', status)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${participant.completion_status === status ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm' : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500'}`}>
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">反應與備註</p>
                          <textarea value={participant.reaction} onChange={(e) => updateParticipant(senior.id, 'reaction', e.target.value)}
                            placeholder="例如：很喜歡這個主題、需要額外協助等" rows="2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 備註 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📝 整體備註（選填）</label>
          <textarea value={recordData.notes} onChange={(e) => setRecordData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="例如：今天教學氣氛很好、建議下次準備更大的材料等" rows="3"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">取消</button>
          <button type="submit" disabled={submitting || compressing}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? '儲存中...' : '儲存記錄'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TeachingRecord
