import { useState, useEffect } from 'react'
import { locationsAPI, seniorsAPI, filterOptionsAPI } from '../lib/supabase'

function Settings({ darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState('system') // system, locations, seniors, filters
  const [locations, setLocations] = useState([])
  const [seniors, setSeniors] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    season: [],
    festival: [],
    material_type: []
  })
  const [loading, setLoading] = useState(true)
  
  // 系統狀態
  const [storageUsage, setStorageUsage] = useState(null)
  const [customLogo, setCustomLogo] = useState(null)

  // 新增表單狀態
  const [newLocation, setNewLocation] = useState({ name: '', address: '' })
  const [newSenior, setNewSenior] = useState({ name: '', location_id: '', notes: '' })
  const [newFilter, setNewFilter] = useState({ category: 'season', value: '' })

  useEffect(() => {
    loadData()
    loadSystemStatus()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [locData, filterData] = await Promise.all([
        locationsAPI.getAll(),
        filterOptionsAPI.getAll()
      ])
      setLocations(locData)
      setFilterOptions(filterData)
      
      // 載入所有中心的長輩
      if (locData.length > 0) {
        const allSeniors = []
        for (const loc of locData) {
          const seniorData = await seniorsAPI.getByLocation(loc.id)
          allSeniors.push(...seniorData.map(s => ({ ...s, location_name: loc.name })))
        }
        setSeniors(allSeniors)
      }
    } catch (error) {
      console.error('載入設定失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSystemStatus = async () => {
    const { systemAPI } = await import('../lib/supabase')
    const usage = await systemAPI.getStorageUsage()
    setStorageUsage(usage)
    setCustomLogo(systemAPI.getCustomLogo())
  }

  // 備份功能
  const handleBackup = async () => {
    try {
      const { systemAPI } = await import('../lib/supabase')
      const stats = await systemAPI.exportBackup()
      alert(`備份成功！\n作品：${stats.works_count}\n中心：${stats.locations_count}\n長輩：${stats.seniors_count}\n記錄：${stats.records_count}`)
    } catch (error) {
      alert('備份失敗：' + error.message)
    }
  }

  // Logo 上傳
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const { systemAPI } = await import('../lib/supabase')
      const url = await systemAPI.uploadLogo(file)
      setCustomLogo(url)
      alert('Logo 上傳成功！')
      // 重新載入頁面以顯示新 Logo
      window.location.reload()
    } catch (error) {
      alert('上傳失敗：' + error.message)
    }
  }

  // 移除 Logo
  const handleRemoveLogo = async () => {
    if (!confirm('確定要移除自訂 Logo 嗎？')) return
    
    try {
      const { systemAPI } = await import('../lib/supabase')
      systemAPI.removeCustomLogo()
      setCustomLogo(null)
      alert('已移除自訂 Logo')
      window.location.reload()
    } catch (error) {
      alert('移除失敗：' + error.message)
    }
  }

  // === 中心管理 ===
  const handleAddLocation = async (e) => {
    e.preventDefault()
    if (!newLocation.name.trim()) return

    try {
      await locationsAPI.create(newLocation)
      setNewLocation({ name: '', address: '' })
      await loadData()
      alert('新增成功！')
    } catch (error) {
      alert('新增失敗：' + error.message)
    }
  }

  const handleDeleteLocation = async (id) => {
    if (!confirm('確定要刪除此中心嗎？相關的教學記錄也會被刪除。')) return

    try {
      await locationsAPI.delete(id)
      await loadData()
      alert('刪除成功！')
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  // === 長輩管理 ===
  const handleAddSenior = async (e) => {
    e.preventDefault()
    if (!newSenior.name.trim() || !newSenior.location_id) return

    try {
      await seniorsAPI.create(newSenior)
      setNewSenior({ name: '', location_id: '', notes: '' })
      await loadData()
      alert('新增成功！')
    } catch (error) {
      alert('新增失敗：' + error.message)
    }
  }

  const handleDeleteSenior = async (id) => {
    if (!confirm('確定要刪除此長輩嗎？')) return

    try {
      await seniorsAPI.delete(id)
      await loadData()
      alert('刪除成功！')
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  // === 篩選條件管理 ===
  const handleAddFilter = async (e) => {
    e.preventDefault()
    if (!newFilter.value.trim()) return

    try {
      await filterOptionsAPI.create(newFilter.category, newFilter.value)
      setNewFilter({ ...newFilter, value: '' })
      await loadData()
      alert('新增成功！')
    } catch (error) {
      alert('新增失敗：' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">系統設定</h1>

      {/* Dark Mode 切換 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              深色模式
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              切換淺色/深色主題
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-12 w-20 items-center rounded-full transition-colors ${
              darkMode ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform flex items-center justify-center ${
                darkMode ? 'translate-x-9' : 'translate-x-1'
              }`}
            >
              {darkMode ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>

      {/* 分頁選單 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton
          active={activeTab === 'system'}
          onClick={() => setActiveTab('system')}
          icon="💾"
          label="系統管理"
        />
        <TabButton
          active={activeTab === 'locations'}
          onClick={() => setActiveTab('locations')}
          icon="🏢"
          label="活動中心"
        />
        <TabButton
          active={activeTab === 'seniors'}
          onClick={() => setActiveTab('seniors')}
          icon="👥"
          label="長輩管理"
        />
        <TabButton
          active={activeTab === 'filters'}
          onClick={() => setActiveTab('filters')}
          icon="🏷️"
          label="篩選條件"
        />
      </div>

      {/* 內容區 */}
      {activeTab === 'system' && (
        <SystemTab
          storageUsage={storageUsage}
          customLogo={customLogo}
          onBackup={handleBackup}
          onLogoUpload={handleLogoUpload}
          onRemoveLogo={handleRemoveLogo}
        />
      )}
      {activeTab === 'locations' && (
        <LocationsTab
          locations={locations}
          newLocation={newLocation}
          setNewLocation={setNewLocation}
          onAdd={handleAddLocation}
          onDelete={handleDeleteLocation}
        />
      )}

      {activeTab === 'seniors' && (
        <SeniorsTab
          seniors={seniors}
          locations={locations}
          newSenior={newSenior}
          setNewSenior={setNewSenior}
          onAdd={handleAddSenior}
          onDelete={handleDeleteSenior}
        />
      )}

      {activeTab === 'filters' && (
        <FiltersTab
          filterOptions={filterOptions}
          newFilter={newFilter}
          setNewFilter={setNewFilter}
          onAdd={handleAddFilter}
        />
      )}
    </div>
  )
}

// === Tab 按鈕元件 ===
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// === 系統管理分頁 ===
function SystemTab({ storageUsage, customLogo, onBackup, onLogoUpload, onRemoveLogo }) {
  return (
    <div className="space-y-6">
      {/* Logo 管理 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🎨</span>
          <span>自訂 Logo</span>
        </h3>
        
        {customLogo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <img
                src={customLogo}
                alt="Custom Logo"
                className="h-16 w-16 object-contain bg-white dark:bg-gray-600 rounded-lg p-2"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">目前使用自訂 Logo</p>
              </div>
              <button
                onClick={onRemoveLogo}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                移除
              </button>
            </div>
            <label className="block">
              <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                更換 Logo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </label>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              目前使用預設 Logo（🎨）。你可以上傳自己的 Logo 圖片。
            </p>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                選擇圖片
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                建議尺寸：100x100 像素，支援 PNG/JPG/SVG
              </p>
            </label>
          </div>
        )}
      </div>

      {/* 儲存空間使用情況 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>💾</span>
          <span>儲存空間</span>
        </h3>
        
        {storageUsage ? (
          <div className="space-y-4">
            {/* 容量條 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  已使用 {storageUsage.usedMB} MB / {storageUsage.limitMB} MB
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {storageUsage.usedPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    parseFloat(storageUsage.usedPercent) > 80
                      ? 'bg-red-500'
                      : parseFloat(storageUsage.usedPercent) > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(storageUsage.usedPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* 詳細資訊 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">剩餘空間</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageUsage.remainingMB}
                  <span className="text-sm font-normal ml-1">MB</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">照片數量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageUsage.fileCount}
                  <span className="text-sm font-normal ml-1">張</span>
                </p>
              </div>
            </div>

            {/* 容量提醒 */}
            {parseFloat(storageUsage.usedPercent) > 80 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  ⚠️ 儲存空間即將用完
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  建議刪除不需要的作品，或考慮升級 Supabase 方案
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">載入中...</p>
          </div>
        )}
      </div>

      {/* 資料備份 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📦</span>
          <span>資料備份</span>
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          定期備份可以防止資料遺失。備份檔案會以 JSON 格式下載，包含所有作品、中心、長輩和教學記錄。
        </p>

        <div className="space-y-3">
          <button
            onClick={onBackup}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] shadow-md"
          >
            📥 立即備份資料
          </button>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
              💡 備份建議
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• 建議每週備份一次</li>
              <li>• 將備份檔案保存在雲端硬碟</li>
              <li>• 重要更新後記得備份</li>
              <li>• 備份檔案可用於資料還原</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 系統資訊 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          <span>系統資訊</span>
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">系統版本</span>
            <span className="font-medium text-gray-900 dark:text-white">v2.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">資料庫</span>
            <span className="font-medium text-gray-900 dark:text-white">Supabase</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">部署平台</span>
            <span className="font-medium text-gray-900 dark:text-white">Vercel</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600 dark:text-gray-400">免費儲存空間</span>
            <span className="font-medium text-gray-900 dark:text-white">500 MB</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// === 活動中心管理 ===
function LocationsTab({ locations, newLocation, setNewLocation, onAdd, onDelete }) {
  return (
    <div className="space-y-6">
      {/* 新增表單 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          新增活動中心
        </h3>
        <form onSubmit={onAdd} className="space-y-4">
          <input
            type="text"
            placeholder="中心名稱 *"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="地址（選填）"
            value={newLocation.address}
            onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            + 新增中心
          </button>
        </form>
      </div>

      {/* 中心列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          現有中心 ({locations.length})
        </h3>
        {locations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">尚無中心資料</p>
        ) : (
          <div className="space-y-3">
            {locations.map(loc => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{loc.name}</h4>
                  {loc.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{loc.address}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(loc.id)}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === 長輩管理 ===
function SeniorsTab({ seniors, locations, newSenior, setNewSenior, onAdd, onDelete }) {
  return (
    <div className="space-y-6">
      {/* 新增表單 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          新增長輩
        </h3>
        <form onSubmit={onAdd} className="space-y-4">
          <input
            type="text"
            placeholder="長輩姓名 *"
            value={newSenior.name}
            onChange={(e) => setNewSenior({ ...newSenior, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            required
          />
          <select
            value={newSenior.location_id}
            onChange={(e) => setNewSenior({ ...newSenior, location_id: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">選擇所屬中心 *</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <textarea
            placeholder="備註（選填）"
            value={newSenior.notes}
            onChange={(e) => setNewSenior({ ...newSenior, notes: e.target.value })}
            rows="2"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            + 新增長輩
          </button>
        </form>
      </div>

      {/* 長輩列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          長輩列表 ({seniors.length})
        </h3>
        {seniors.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">尚無長輩資料</p>
        ) : (
          <div className="space-y-3">
            {seniors.map(senior => (
              <div
                key={senior.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{senior.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {senior.location_name}
                  </p>
                  {senior.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{senior.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(senior.id)}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === 篩選條件管理 ===
function FiltersTab({ filterOptions, newFilter, setNewFilter, onAdd }) {
  const categoryLabels = {
    season: '季節',
    festival: '節日',
    material_type: '材料類型'
  }

  return (
    <div className="space-y-6">
      {/* 新增表單 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          新增篩選選項
        </h3>
        <form onSubmit={onAdd} className="space-y-4">
          <select
            value={newFilter.category}
            onChange={(e) => setNewFilter({ ...newFilter, category: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="season">季節</option>
            <option value="festival">節日</option>
            <option value="material_type">材料類型</option>
          </select>
          <input
            type="text"
            placeholder="選項名稱 *"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            + 新增選項
          </button>
        </form>
      </div>

      {/* 現有選項 */}
      {Object.entries(filterOptions).map(([category, values]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {categoryLabels[category]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {values.map((value, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Settings
