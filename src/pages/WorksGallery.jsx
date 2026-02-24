import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { worksAPI, teachingRecordsAPI } from '../lib/supabase'
import { format } from 'date-fns'

function WorksGallery({ currentLocation, filterOptions }) {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    season: '',
    festival: '',
    material_type: ''
  })
  const [workStats, setWorkStats] = useState({})

  // 載入作品列表
  useEffect(() => {
    loadWorks()
  }, [filters])

  // 當選擇中心時，載入該中心的作品統計
  useEffect(() => {
    if (currentLocation) {
      loadWorkStatistics()
    }
  }, [currentLocation, works])

  const loadWorks = async () => {
    setLoading(true)
    try {
      const data = await worksAPI.getAll(filters)
      setWorks(data)
    } catch (error) {
      console.error('載入作品失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkStatistics = async () => {
    const stats = {}
    for (const work of works) {
      try {
        const stat = await teachingRecordsAPI.getWorkStatistics(
          work.id, 
          currentLocation.id
        )
        stats[work.id] = stat
      } catch (error) {
        console.error('載入統計失敗:', error)
      }
    }
    setWorkStats(stats)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === prev[key] ? '' : value
    }))
  }

  const handleDeleteWork = async (workId) => {
    if (!confirm('確定要刪除此作品嗎？相關的教學記錄也會被刪除。')) return

    try {
      await worksAPI.delete(workId)
      await loadWorks()
      alert('刪除成功！')
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  return (
    <div className="pb-24">
      {/* 頁面標題與說明 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
          作品庫
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {currentLocation 
            ? `📍 ${currentLocation.name}` 
            : '請先選擇活動中心以查看教學記錄'}
        </p>
      </div>

      {/* 篩選器 */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🔍</span>
          <span>篩選條件</span>
        </h3>
        
        <div className="space-y-4">
          {/* 季節篩選 */}
          <FilterGroup
            label="季節"
            options={filterOptions.season}
            selected={filters.season}
            onChange={(val) => handleFilterChange('season', val)}
          />

          {/* 節日篩選 */}
          <FilterGroup
            label="節日"
            options={filterOptions.festival}
            selected={filters.festival}
            onChange={(val) => handleFilterChange('festival', val)}
          />

          {/* 材料類型篩選 */}
          <FilterGroup
            label="材料"
            options={filterOptions.material_type}
            selected={filters.material_type}
            onChange={(val) => handleFilterChange('material_type', val)}
          />
        </div>

        {/* 清除篩選按鈕 */}
        {(filters.season || filters.festival || filters.material_type) && (
          <button
            onClick={() => setFilters({ season: '', festival: '', material_type: '' })}
            className="mt-4 w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            ✕ 清除所有篩選
          </button>
        )}
      </div>

      {/* 作品網格 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <span className="text-6xl mb-4 block">🎨</span>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">找不到符合條件的作品</p>
          <Link 
            to="/upload" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            📸 上傳第一個作品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map(work => (
            <WorkCard 
              key={work.id} 
              work={work}
              stats={workStats[work.id]}
              currentLocation={currentLocation}
              onDelete={handleDeleteWork}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 篩選器群組元件
function FilterGroup({ label, options, selected, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selected === option
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

// 作品卡片元件
function WorkCard({ work, stats, currentLocation, onDelete }) {
  const hasBeenTaught = stats && stats.total_times > 0
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700">
      {/* 作品圖片 */}
      <Link to={`/work/${work.id}`} className="block">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
          <img
            src={work.image_url}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          
          {/* 教學狀態標籤 */}
          {currentLocation && (
            <div className="absolute top-3 right-3">
              {hasBeenTaught ? (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                  <span>✓</span>
                  <span>已教過</span>
                </span>
              ) : (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                  <span>⭐</span>
                  <span>可教</span>
                </span>
              )}
            </div>
          )}
          
          {/* 刪除按鈕 */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setShowDeleteConfirm(true)
            }}
            className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            🗑️
          </button>
        </div>
      </Link>

      {/* 作品資訊 */}
      <div className="p-4">
        <Link to={`/work/${work.id}`}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {work.title}
          </h3>
        </Link>

        {/* 標籤 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {work.season && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium">
              {work.season}
            </span>
          )}
          {work.festival && work.festival !== '無' && (
            <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md font-medium">
              {work.festival}
            </span>
          )}
          {work.material_type && (
            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md font-medium">
              {work.material_type}
            </span>
          )}
        </div>

        {/* 統計資訊 */}
        {currentLocation && stats && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <p className="flex items-center gap-1">
              <span>📊</span>
              <span>在此中心教過 {stats.total_times} 次</span>
            </p>
            {stats.last_taught && (
              <p className="flex items-center gap-1">
                <span>📅</span>
                <span>上次：{format(new Date(stats.last_taught), 'yyyy/MM/dd')}</span>
              </p>
            )}
          </div>
        )}

        {/* 快速記錄按鈕 */}
        <Link
          to={`/record/${work.id}`}
          onClick={(e) => e.stopPropagation()}
          className="w-full block text-center py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          + 記錄教學
        </Link>
      </div>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              確定要刪除嗎？
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              刪除「{work.title}」後將無法復原，相關的教學記錄也會被刪除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDelete(work.id)
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorksGallery
