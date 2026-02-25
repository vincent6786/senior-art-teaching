import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { worksAPI, teachingRecordsAPI } from '../lib/supabase'
import { format } from 'date-fns'

// 解析 material_type 字串為陣列
function parseMaterials(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

function WorkDetail({ currentLocation, filterOptions = { season: [], festival: [], material_type: [] } }) {
  const { workId } = useParams()
  const navigate = useNavigate()

  const [work, setWork] = useState(null)
  const [teachingHistory, setTeachingHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadWorkDetail() }, [workId, currentLocation])

  const loadWorkDetail = async () => {
    setLoading(true)
    try {
      const workData = await worksAPI.getById(workId)
      setWork(workData)
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

  const handleStartEdit = () => {
    setEditData({
      title: work.title || '',
      season: work.season || '',
      festival: work.festival || '無',
      material_types: parseMaterials(work.material_type),
      description: work.description || ''
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData(null)
  }

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) { alert('請輸入作品名稱'); return }
    setSaving(true)
    try {
      await worksAPI.update(workId, {
        title: editData.title,
        season: editData.season || '不限',
        festival: editData.festival,
        material_type: editData.material_types.join(','),
        description: editData.description
      })
      await loadWorkDetail()
      setIsEditing(false)
      setEditData(null)
    } catch (error) {
      alert('儲存失敗：' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleEditMaterial = (material) => {
    setEditData(prev => {
      const already = prev.material_types.includes(material)
      return {
        ...prev,
        material_types: already
          ? prev.material_types.filter(m => m !== material)
          : [...prev.material_types, material]
      }
    })
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

  const materialOptions = filterOptions.material_type.length > 0 ? filterOptions.material_type : ['紙類', '黏土', '布料', '綜合媒材', '其他']
  const seasonOptions = filterOptions.season.length > 0 ? filterOptions.season : ['春', '夏', '秋', '冬', '不限']
  const festivalOptions = filterOptions.festival.length > 0 ? filterOptions.festival : ['春節', '元宵', '清明', '端午', '中秋', '重陽']

  if (loading) return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">載入中...</p>
    </div>
  )

  if (!work) return (
    <div className="text-center py-12">
      <p className="text-gray-500 dark:text-gray-400">找不到此作品</p>
    </div>
  )

  const materials = parseMaterials(work.material_type)

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <button onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
        <span className="mr-2">←</span>返回
      </button>

      {/* 作品主要資訊 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
        <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700">
          <img src={work.image_url} alt={work.title} className="w-full h-full object-cover" />
        </div>

        <div className="p-6">
          {isEditing ? (
            /* ── 編輯模式 ── */
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">✏️ 編輯作品資訊</h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">照片無法更換，其他資訊均可修改</span>
              </div>

              {/* 名稱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">作品名稱 *</label>
                <input type="text" value={editData.title}
                  onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* 季節 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">適合季節</label>
                <div className="flex flex-wrap gap-2">
                  {seasonOptions.map(season => (
                    <button key={season} type="button"
                      onClick={() => setEditData(prev => ({ ...prev, season: prev.season === season ? '' : season }))}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${editData.season === season ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      {season}
                    </button>
                  ))}
                </div>
              </div>

              {/* 節日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">相關節日</label>
                <select value={editData.festival}
                  onChange={e => setEditData(prev => ({ ...prev, festival: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                  <option value="無">無特定節日</option>
                  {festivalOptions.filter(f => f !== '無').map(festival => (
                    <option key={festival} value={festival}>{festival}</option>
                  ))}
                </select>
              </div>

              {/* 材料多選 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">使用材料（可多選）</label>
                  {editData.material_types.length > 0 && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                      已選 {editData.material_types.length} 項
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {materialOptions.map(material => {
                    const selected = editData.material_types.includes(material)
                    return (
                      <button key={material} type="button" onClick={() => toggleEditMaterial(material)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${selected ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                        {selected && <span className="text-xs font-bold">✓</span>}
                        {material}
                      </button>
                    )
                  })}
                </div>
                {editData.material_types.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">已選：{editData.material_types.join('、')}</p>
                )}
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">作品描述（選填）</label>
                <textarea value={editData.description}
                  onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* 儲存 / 取消 */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCancelEdit}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                  取消
                </button>
                <button type="button" onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-md disabled:opacity-50">
                  {saving ? '儲存中...' : '✓ 儲存變更'}
                </button>
              </div>
            </div>
          ) : (
            /* ── 檢視模式 ── */
            <>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{work.title}</h1>
                <button onClick={handleStartEdit}
                  className="shrink-0 ml-3 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors font-medium border border-indigo-200 dark:border-indigo-700 flex items-center gap-1">
                  ✏️ 編輯
                </button>
              </div>

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
                {materials.map(m => (
                  <span key={m} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
                    {m}
                  </span>
                ))}
              </div>

              {work.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">作品說明</h3>
                  <p className="text-gray-600 dark:text-gray-400">{work.description}</p>
                </div>
              )}

              <Link to={`/record/${work.id}`}
                className="block w-full text-center py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200">
                + 記錄教學
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 教學歷史記錄 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {currentLocation ? `在 ${currentLocation.name} 的教學記錄` : '請選擇中心查看記錄'}
        </h2>
        {!currentLocation ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">請在頁面上方選擇活動中心以查看該中心的教學記錄</div>
        ) : teachingHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">此作品尚未在 {currentLocation.name} 教過</div>
        ) : (
          <div className="space-y-4">
            {teachingHistory.map(record => (
              <TeachingRecordCard key={record.id} record={record} onDelete={handleDeleteRecord} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TeachingRecordCard({ record, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
      <button onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {format(new Date(record.teaching_date), 'yyyy年 MM月 dd日')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {record.teaching_seniors?.length || 0} 位長輩參與
          </p>
        </div>
        <span className="text-gray-400 dark:text-gray-500">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
          {record.photos && record.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📷 現場照片</h4>
              <div className="flex gap-2 flex-wrap">
                {record.photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt={`現場照片 ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                ))}
              </div>
            </div>
          )}
          {record.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">整體備註</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{record.notes}</p>
            </div>
          )}
          {record.teaching_seniors && record.teaching_seniors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">參與長輩</h4>
              <div className="space-y-2">
                {record.teaching_seniors.map(ts => (
                  <div key={ts.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{ts.seniors?.name || '未知'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ts.completion_status === '完成' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : ts.completion_status === '部分完成' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>{ts.completion_status}</span>
                    </div>
                    {ts.reaction && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{ts.reaction}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => onDelete(record.id)}
            className="w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800">
            🗑️ 刪除此記錄
          </button>
        </div>
      )}
    </div>
  )
}

export default WorkDetail
