import { useState, useEffect } from 'react'
import { locationsAPI, seniorsAPI, filterOptionsAPI, systemAPI } from '../lib/supabase'

function Settings({ darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState('system')
  const [locations, setLocations] = useState([])
  const [seniors, setSeniors] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    season: [],
    festival: [],
    material_type: []
  })
  const [loading, setLoading] = useState(true)
  
  const [storageUsage, setStorageUsage] = useState(null)

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
    const usage = await systemAPI.getStorageUsage()
    setStorageUsage(usage)
  }

  // 備份功能
  const handleBackup = async () => {
    try {
      const stats = await systemAPI.exportBackup()
      alert(`備份成功！\n作品：${stats.works_count}\n中心：${stats.locations_count}\n長輩：${stats.seniors_count}\n記錄：${stats.records_count}`)
    } catch (error) {
      alert('備份失敗：' + error.message)
    }
  }

  // 還原功能
  const handleRestore = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!confirm('⚠️ 還原備份會覆蓋現有資料，確定要繼續嗎？\n\n建議先備份目前的資料再還原。')) {
      e.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      
      if (!backup.version || !backup.data) {
        throw new Error('無效的備份檔案格式')
      }

      const result = await systemAPI.restoreBackup(backup)
      alert(`還原成功！\n作品：${result.works}\n中心：${result.locations}\n長輩：${result.seniors}\n教學記錄：${result.records}\n篩選條件：${result.filters}`)
      
      await loadData()
      await loadSystemStatus()
    } catch (error) {
      alert('還原失敗：' + error.message)
    } finally {
      e.target.value = ''
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

  const handleUpdateLocation = async (id, updates) => {
    try {
      await locationsAPI.update(id, updates)
      await loadData()
    } catch (error) {
      alert('更新失敗：' + error.message)
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
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
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon="💾" label="系統管理" />
        <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon="🏢" label="活動中心" />
        <TabButton active={activeTab === 'seniors'} onClick={() => setActiveTab('seniors')} icon="👥" label="長輩管理" />
        <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon="🏷️" label="篩選條件" />
      </div>

      {/* 內容區 */}
      {activeTab === 'system' && (
        <SystemTab
          storageUsage={storageUsage}
          onBackup={handleBackup}
          onRestore={handleRestore}
        />
      )}
      {activeTab === 'locations' && (
        <LocationsTab
          locations={locations}
          newLocation={newLocation}
          setNewLocation={setNewLocation}
          onAdd={handleAddLocation}
          onUpdate={handleUpdateLocation}
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
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// === 系統管理分頁 (removed logo, added restore) ===
function SystemTab({ storageUsage, onBackup, onRestore }) {
  return (
    <div className="space-y-6">
      {/* 儲存空間使用情況 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>💾</span>
          <span>儲存空間</span>
        </h3>
        
        {storageUsage ? (
          <div className="space-y-4">
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

            {parseFloat(storageUsage.usedPercent) > 80 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">⚠️ 儲存空間即將用完</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">建議刪除不需要的作品，或考慮升級 Supabase 方案</p>
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

      {/* 資料備份與還原 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📦</span>
          <span>資料備份與還原</span>
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          定期備份可以防止資料遺失。備份檔案會以 JSON 格式下載，包含所有作品、中心、長輩和教學記錄。
        </p>

        <div className="space-y-3">
          {/* 備份按鈕 */}
          <button
            onClick={onBackup}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] shadow-md"
          >
            📥 立即備份資料
          </button>

          {/* 還原按鈕 */}
          <label className="block w-full">
            <div className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-dashed border-indigo-300 dark:border-indigo-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] cursor-pointer text-center">
              📤 從備份檔案還原
            </div>
            <input
              type="file"
              accept=".json"
              onChange={onRestore}
              className="hidden"
            />
          </label>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">💡 備份建議</p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• 建議每週備份一次</li>
              <li>• 將備份檔案保存在雲端硬碟</li>
              <li>• 重要更新後記得備份</li>
              <li>• 還原會覆蓋現有資料，請先備份</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">⚠️ 還原注意事項</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              還原備份會將資料庫中的資料替換為備份檔案中的內容。照片檔案不會被影響（只還原文字資料）。建議在還原前先備份目前的資料。
            </p>
          </div>
        </div>
      </div>

      {/* 系統資訊 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          <span>系統資訊</span>
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">系統版本</span>
            <span className="font-medium text-gray-900 dark:text-white">v2.2</span>
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

// === 活動中心管理 (editable) ===
function LocationsTab({ locations, newLocation, setNewLocation, onAdd, onUpdate, onDelete }) {
  return (
    <div className="space-y-6">
      {/* 新增表單 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新增活動中心</h3>
        <form onSubmit={onAdd} className="space-y-4">
          <input
            type="text"
            placeholder="中心名稱 *"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="地址（選填）"
            value={newLocation.address}
            onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
          >
            + 新增中心
          </button>
        </form>
      </div>

      {/* 中心列表 (editable) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          現有中心 ({locations.length})
        </h3>
        {locations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">尚無中心資料</p>
        ) : (
          <div className="space-y-3">
            {locations.map(loc => (
              <LocationEditCard
                key={loc.id}
                location={loc}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 可編輯的中心卡片
function LocationEditCard({ location, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(location.name)
  const [editAddress, setEditAddress] = useState(location.address || '')

  const handleSave = () => {
    if (!editName.trim()) return
    onUpdate(location.id, { name: editName.trim(), address: editAddress.trim() })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(location.name)
    setEditAddress(location.address || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="中心名稱"
          autoFocus
        />
        <input
          type="text"
          value={editAddress}
          onChange={(e) => setEditAddress(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="地址（選填）"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ✓ 儲存
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            ✕ 取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
        {location.address && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{location.address}</p>
        )}
      </div>
      <div className="flex gap-2 ml-3 shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors text-sm font-medium"
        >
          ✏️ 編輯
        </button>
        <button
          onClick={() => onDelete(location.id)}
          className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// === 長輩管理 ===
function SeniorsTab({ seniors, locations, newSenior, setNewSenior, onAdd, onDelete }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新增長輩</h3>
        <form onSubmit={onAdd} className="space-y-4">
          <input
            type="text"
            placeholder="長輩姓名 *"
            value={newSenior.name}
            onChange={(e) => setNewSenior({ ...newSenior, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
          >
            + 新增長輩
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
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
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{senior.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{senior.location_name}</p>
                  {senior.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{senior.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(senior.id)}
                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-3 shrink-0 text-sm font-medium"
                >
                  🗑️
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新增篩選選項</h3>
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
          >
            + 新增選項
          </button>
        </form>
      </div>

      {Object.entries(filterOptions).map(([category, values]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {categoryLabels[category]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {values.map((value, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
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
