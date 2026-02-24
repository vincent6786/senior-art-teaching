import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { worksAPI, teachingRecordsAPI } from '../lib/supabase'
import { format } from 'date-fns'

function WorksGallery({ currentLocation }) {
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

  return (
    <div className="pb-24">
      {/* 頁面標題與說明 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">作品庫</h1>
        <p className="text-gray-600">
          {currentLocation 
            ? `正在查看 ${currentLocation.name} 的教學記錄` 
            : '請先選擇活動中心以查看教學記錄'}
        </p>
      </div>

      {/* 篩選器 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">篩選條件</h3>
        
        <div className="space-y-4">
          {/* 季節篩選 */}
          <FilterGroup
            label="季節"
            options={['春', '夏', '秋', '冬', '不限']}
            selected={filters.season}
            onChange={(val) => handleFilterChange('season', val)}
          />

          {/* 節日篩選 */}
          <FilterGroup
            label="節日"
            options={['春節', '元宵', '清明', '端午', '中秋', '重陽', '無']}
            selected={filters.festival}
            onChange={(val) => handleFilterChange('festival', val)}
          />

          {/* 材料類型篩選 */}
          <FilterGroup
            label="材料"
            options={['紙類', '黏土', '布料', '綜合媒材', '其他']}
            selected={filters.material_type}
            onChange={(val) => handleFilterChange('material_type', val)}
          />
        </div>

        {/* 清除篩選按鈕 */}
        {(filters.season || filters.festival || filters.material_type) && (
          <button
            onClick={() => setFilters({ season: '', festival: '', material_type: '' })}
            className="mt-4 w-full py-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            清除所有篩選
          </button>
        )}
      </div>

      {/* 作品網格 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 text-lg">找不到符合條件的作品</p>
          <Link to="/upload" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
            + 上傳第一個作品
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
      <label className="text-xs font-medium text-gray-600 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selected === option
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
function WorkCard({ work, stats, currentLocation }) {
  const hasBeenTaught = stats && stats.total_times > 0

  return (
    <Link to={`/work/${work.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* 作品圖片 */}
        <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
          <img
            src={work.image_url}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* 教學狀態標籤 */}
          {currentLocation && (
            <div className="absolute top-2 right-2">
              {hasBeenTaught ? (
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                  ✓ 已教過
                </span>
              ) : (
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                  可教
                </span>
              )}
            </div>
          )}
        </div>

        {/* 作品資訊 */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
            {work.title}
          </h3>

          {/* 標籤 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {work.season && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                {work.season}
              </span>
            )}
            {work.festival && work.festival !== '無' && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                {work.festival}
              </span>
            )}
            {work.material_type && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                {work.material_type}
              </span>
            )}
          </div>

          {/* 統計資訊 */}
          {currentLocation && stats && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>在此中心教過 {stats.total_times} 次</p>
              {stats.last_taught && (
                <p>上次教學：{format(new Date(stats.last_taught), 'yyyy/MM/dd')}</p>
              )}
            </div>
          )}

          {/* 快速記錄按鈕 */}
          <Link
            to={`/record/${work.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 w-full block text-center py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + 記錄教學
          </Link>
        </div>
      </div>
    </Link>
  )
}

export default WorksGallery
