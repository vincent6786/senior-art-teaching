import { useState, useEffect } from 'react'
import { locationsAPI, seniorsAPI, filterOptionsAPI, systemAPI } from '../lib/supabase'

function Settings({ darkMode, setDarkMode, locations, seniors: seniorsProp = [], filterOptions: filterOptionsProp = { season: [], festival: [], material_type: [] }, onLocationsUpdate, onSeniorsUpdate, onFilterOptionsUpdate }) {
  const [activeTab, setActiveTab] = useState('system')
  const [storageUsage, setStorageUsage] = useState(null)
  const [teachingDetailMode, setTeachingDetailMode] = useState(
    () => localStorage.getItem('teachingDetailMode') !== 'simple'
  )
  const [storageMode, setStorageMode] = useState(
    () => localStorage.getItem('storageMode') || 'cloudinary'
  )

  const [newLocation, setNewLocation] = useState({ name: '', address: '' })
  const [newSenior, setNewSenior] = useState({ name: '', location_id: '', notes: '' })
  const [newFilter, setNewFilter] = useState({ category: 'season', value: '' })

  useEffect(() => {
    loadStorageStatus()
  }, [])

  const loadStorageStatus = async () => {
    try {
      const usage = await systemAPI.getStorageUsage()
      setStorageUsage(usage)
    } catch (error) {
      console.error('載入系統狀態失敗:', error)
    }
  }

  const handleTeachingDetailModeChange = (value) => {
    setTeachingDetailMode(value)
    localStorage.setItem('teachingDetailMode', value ? 'full' : 'simple')
  }

  const handleStorageModeChange = (mode) => {
    setStorageMode(mode)
    localStorage.setItem('storageMode', mode)
  }

  // 備份
  const handleBackup = async () => {
    try {
      const stats = await systemAPI.exportBackup()
      alert(`備份成功！\n作品：${stats.works_count}\n中心：${stats.locations_count}\n長輩：${stats.seniors_count}\n記錄：${stats.records_count}`)
    } catch (error) {
      alert('備份失敗：' + error.message)
    }
  }

  // 還原
  const handleRestore = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('⚠️ 還原備份會覆蓋現有資料，確定要繼續嗎？\n\n建議先備份目前的資料再還原。')) {
      e.target.value = ''; return
    }
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      if (!backup.version || !backup.data) throw new Error('無效的備份檔案格式')
      const result = await systemAPI.restoreBackup(backup)
      alert(`還原成功！\n作品：${result.works}\n中心：${result.locations}\n長輩：${result.seniors}\n教學記錄：${result.records}\n篩選條件：${result.filters}`)
      await Promise.all([onLocationsUpdate(), onSeniorsUpdate(), onFilterOptionsUpdate()])
      await loadStorageStatus()
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
      await onLocationsUpdate()
    } catch (error) {
      alert('新增失敗：' + error.message)
    }
  }

  const handleUpdateLocation = async (id, updates) => {
    try {
      await locationsAPI.update(id, updates)
      await onLocationsUpdate()
    } catch (error) {
      alert('更新失敗：' + error.message)
    }
  }

  const handleDeleteLocation = async (id) => {
    if (!confirm('確定要刪除此中心嗎？相關的教學記錄也會被刪除。')) return
    try {
      await locationsAPI.delete(id)
      await Promise.all([onLocationsUpdate(), onSeniorsUpdate()])
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
      await onSeniorsUpdate()
    } catch (error) {
      alert('新增失敗：' + error.message)
    }
  }

  const handleDeleteSenior = async (id) => {
    if (!confirm('確定要刪除此長輩嗎？')) return
    try {
      await seniorsAPI.delete(id)
      await onSeniorsUpdate()
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  // === 篩選條件 ===
  const handleAddFilter = async (e) => {
    e.preventDefault()
    if (!newFilter.value.trim()) return
    try {
      await filterOptionsAPI.create(newFilter.category, newFilter.value)
      setNewFilter({ ...newFilter, value: '' })
      await onFilterOptionsUpdate()
    } catch (error) {
      alert('新增失敗：' + error.message)
    }
  }

  const handleDeleteFilter = async (id) => {
    if (!confirm('確定要刪除此篩選選項嗎？')) return
    try {
      await filterOptionsAPI.delete(id)
      await onFilterOptionsUpdate()
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  const handleUpdateFilter = async (id, newValue) => {
    try {
      await filterOptionsAPI.update(id, newValue)
      await onFilterOptionsUpdate()
    } catch (error) {
      alert('更新失敗：' + error.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">系統設定</h1>

      {/* 深色模式 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">深色模式</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">切換淺色/深色主題</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-12 w-20 items-center rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform flex items-center justify-center ${darkMode ? 'translate-x-9' : 'translate-x-1'}`}>
              {darkMode ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>

      {/* 分頁 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon="💾" label="系統管理" />
        <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon="🏢" label="活動中心" />
        <TabButton active={activeTab === 'seniors'} onClick={() => setActiveTab('seniors')} icon="👥" label="長輩管理" />
        <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon="🏷️" label="篩選條件" />
        <TabButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} icon="📖" label="使用說明" />
      </div>

      {activeTab === 'system' && (
        <SystemTab
          storageUsage={storageUsage}
          onBackup={handleBackup}
          onRestore={handleRestore}
          onRefreshStorage={async () => { setStorageUsage(null); await loadStorageStatus() }}
          teachingDetailMode={teachingDetailMode}
          onTeachingDetailModeChange={handleTeachingDetailModeChange}
          storageMode={storageMode}
          onStorageModeChange={handleStorageModeChange}
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
          seniors={seniorsProp}
          locations={locations}
          newSenior={newSenior}
          setNewSenior={setNewSenior}
          onAdd={handleAddSenior}
          onDelete={handleDeleteSenior}
        />
      )}
      {activeTab === 'filters' && (
        <FiltersTab
          filterOptions={filterOptionsProp}
          newFilter={newFilter}
          setNewFilter={setNewFilter}
          onAdd={handleAddFilter}
          onDelete={handleDeleteFilter}
          onUpdate={handleUpdateFilter}
        />
      )}
      {activeTab === 'manual' && <ManualTab />}
    </div>
  )
}

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
      <span>{icon}</span><span>{label}</span>
    </button>
  )
}

// === 系統管理 ===
function SystemTab({ storageUsage, onBackup, onRestore, onRefreshStorage, teachingDetailMode, onTeachingDetailModeChange, storageMode, onStorageModeChange }) {
  return (
    <div className="space-y-6">
      {/* 教學記錄模式 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">教學記錄模式</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">選擇記錄教學時是否需要填寫每位長輩的完成狀態與個別備註</p>
        <div className="flex gap-3">
          <button onClick={() => onTeachingDetailModeChange(true)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium text-center ${teachingDetailMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
            <span className="block text-lg mb-1">📋</span>
            <span className="block font-semibold mb-0.5">完整記錄</span>
            <span className="block text-xs opacity-75">含完成狀態、個別備註</span>
          </button>
          <button onClick={() => onTeachingDetailModeChange(false)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium text-center ${!teachingDetailMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
            <span className="block text-lg mb-1">⚡</span>
            <span className="block font-semibold mb-0.5">快速記錄</span>
            <span className="block text-xs opacity-75">只勾選參與長輩即可</span>
          </button>
        </div>
      </div>

      {/* 照片儲存方式 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">照片儲存方式</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">選擇新照片要存到哪裡（不影響已上傳的舊照片）</p>
        <div className="flex gap-3">
          <button onClick={() => onStorageModeChange('cloudinary')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium text-center ${storageMode === 'cloudinary' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
            <span className="block text-lg mb-1">☁️</span>
            <span className="block font-semibold mb-0.5">Cloudinary</span>
            <span className="block text-xs opacity-75">免費 25 GB・推薦</span>
          </button>
          <button onClick={() => onStorageModeChange('supabase')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium text-center ${storageMode === 'supabase' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
            <span className="block text-lg mb-1">🗄️</span>
            <span className="block font-semibold mb-0.5">Supabase</span>
            <span className="block text-xs opacity-75">資料庫內建・500 MB 上限</span>
          </button>
        </div>
        {storageMode === 'supabase' && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-xs text-orange-700 dark:text-orange-400">⚠️ Supabase 模式下照片存在資料庫，容量有限（500 MB）。建議確認剩餘空間足夠再使用。</p>
          </div>
        )}
      </div>

      {/* 儲存空間 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💾</span><span>儲存空間使用量</span>
          </h3>
          <button onClick={onRefreshStorage}
            className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            🔄 重新整理
          </button>
        </div>
        {storageUsage ? (
          <div className="space-y-4">

            {/* 總覽 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">作品總數</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{storageUsage.worksCount}<span className="text-xs font-normal ml-0.5">件</span></p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">照片總數</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{storageUsage.totalPhotos}<span className="text-xs font-normal ml-0.5">張</span></p>
              </div>
            </div>

            {/* 照片細項表格 */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <div className="px-3 py-2">類別</div>
                <div className="px-3 py-2 text-center">☁️ Cloudinary</div>
                <div className="px-3 py-2 text-center">🗄️ Supabase</div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="grid grid-cols-3 text-sm">
                  <div className="px-3 py-3 text-gray-700 dark:text-gray-300 font-medium">作品主圖</div>
                  <div className="px-3 py-3 text-center">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{storageUsage.workCloudinary}</span>
                    <span className="text-xs text-gray-400 ml-0.5">張</span>
                  </div>
                  <div className="px-3 py-3 text-center">
                    <span className="font-bold text-orange-500">{storageUsage.workBase64}</span>
                    <span className="text-xs text-gray-400 ml-0.5">張</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-sm bg-gray-50 dark:bg-gray-700/30">
                  <div className="px-3 py-3 text-gray-700 dark:text-gray-300 font-medium">現場照片</div>
                  <div className="px-3 py-3 text-center">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{storageUsage.fieldCloudinary}</span>
                    <span className="text-xs text-gray-400 ml-0.5">張</span>
                  </div>
                  <div className="px-3 py-3 text-center">
                    <span className="font-bold text-orange-500">{storageUsage.fieldBase64}</span>
                    <span className="text-xs text-gray-400 ml-0.5">張</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-sm font-semibold bg-gray-100 dark:bg-gray-700">
                  <div className="px-3 py-3 text-gray-700 dark:text-gray-300">小計</div>
                  <div className="px-3 py-3 text-center text-indigo-600 dark:text-indigo-400">{storageUsage.cloudinaryTotal} 張</div>
                  <div className="px-3 py-3 text-center text-orange-500">{storageUsage.supabaseTotal} 張</div>
                </div>
              </div>
            </div>

            {/* Supabase 用量進度條 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🗄️ Supabase 資料庫用量</span>
                <span className={`text-sm font-bold ${parseFloat(storageUsage.usedPercent) > 80 ? 'text-red-500' : parseFloat(storageUsage.usedPercent) > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {storageUsage.usedPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-500 ${parseFloat(storageUsage.usedPercent) > 80 ? 'bg-red-500' : parseFloat(storageUsage.usedPercent) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(Math.max(parseFloat(storageUsage.usedPercent), 0.5), 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>已用 {storageUsage.usedMB} MB</span>
                <span>剩餘 {storageUsage.remainingMB} MB / {storageUsage.limitMB} MB</span>
              </div>
            </div>

            {/* Cloudinary 說明 */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">☁️ Cloudinary 雲端儲存</span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">25 GB 免費</span>
              </div>
              <div className="flex justify-between text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                <span>約 {storageUsage.cloudinaryUsedMB} MB（估算）</span>
                <span>{storageUsage.cloudinaryUsedPercent}%</span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-2.5 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(parseFloat(storageUsage.cloudinaryUsedPercent), 0.1), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-indigo-500 dark:text-indigo-400">
                <span>{storageUsage.cloudinaryTotal} 張照片</span>
                <span>剩餘約 {storageUsage.cloudinaryRemainingGB} GB</span>
              </div>
              <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-2">＊ 依固定壓縮規格計算（作品主圖 180 KB、現場照片 90 KB），精確數字可至 Cloudinary 後台查看</p>
            </div>

            {parseFloat(storageUsage.usedPercent) > 80 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">⚠️ Supabase 空間即將用完</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">建議將「照片儲存方式」切換為 Cloudinary，或刪除舊作品釋放空間。</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">計算中...</p>
          </div>
        )}
      </div>

      {/* 備份與還原 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>📦</span><span>資料備份與還原</span>
        </h3>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">✅ 備份包含所有照片</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">作品照片與教學現場照片均內嵌於資料庫中，備份時完整打包，還原後照片完全恢復。</p>
        </div>
        <div className="space-y-3">
          <button onClick={onBackup} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] shadow-md">
            📥 立即備份資料
          </button>
          <label className="block w-full">
            <div className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-dashed border-indigo-300 dark:border-indigo-600 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium cursor-pointer text-center">
              📤 從備份檔案還原
            </div>
            <input type="file" accept=".json" onChange={onRestore} className="hidden" />
          </label>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">⚠️ 還原注意</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">還原會覆蓋現有所有資料。建議先備份目前的資料再還原。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// === 活動中心 ===
function LocationsTab({ locations, newLocation, setNewLocation, onAdd, onUpdate, onDelete }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新增活動中心</h3>
        <form onSubmit={onAdd} className="space-y-4">
          <input type="text" placeholder="中心名稱 *" value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            required />
          <input type="text" placeholder="地址（選填）" value={newLocation.address}
            onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md">
            + 新增中心
          </button>
        </form>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">中心列表 ({locations.length})</h3>
        {locations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">尚無中心資料</p>
        ) : (
          <div className="space-y-3">
            {locations.map(loc => (
              <LocationItem key={loc.id} location={loc} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LocationItem({ location, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(location.name)
  const [editAddress, setEditAddress] = useState(location.address || '')

  const handleSave = () => {
    if (!editName.trim()) return
    onUpdate(location.id, { name: editName.trim(), address: editAddress.trim() })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="中心名稱" autoFocus />
        <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="地址（選填）" />
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">✓ 儲存</button>
          <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">✕ 取消</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
        {location.address && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{location.address}</p>}
      </div>
      <div className="flex gap-2 ml-3 shrink-0">
        <button onClick={() => setIsEditing(true)} className="px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors text-sm font-medium">✏️ 編輯</button>
        <button onClick={() => onDelete(location.id)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium">🗑️</button>
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
          <input type="text" placeholder="長輩姓名 *" value={newSenior.name}
            onChange={(e) => setNewSenior({ ...newSenior, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            required />
          <select value={newSenior.location_id}
            onChange={(e) => setNewSenior({ ...newSenior, location_id: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            required>
            <option value="">選擇所屬中心 *</option>
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>
          <textarea placeholder="備註（選填）" value={newSenior.notes}
            onChange={(e) => setNewSenior({ ...newSenior, notes: e.target.value })}
            rows="2"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md">
            + 新增長輩
          </button>
        </form>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">長輩列表 ({seniors.length})</h3>
        {seniors.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">尚無長輩資料</p>
        ) : (
          <div className="space-y-3">
            {seniors.map(senior => (
              <div key={senior.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{senior.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{senior.location_name}</p>
                  {senior.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{senior.notes}</p>}
                </div>
                <button onClick={() => onDelete(senior.id)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-3 shrink-0 text-sm font-medium">
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

// === 篩選條件 ===
function FilterTag({ item, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.value)

  const handleSave = () => {
    if (!editValue.trim() || editValue.trim() === item.value) { setIsEditing(false); return }
    onUpdate(item.id, editValue.trim())
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600 rounded-full">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false) }}
          className="w-20 text-sm bg-transparent text-indigo-700 dark:text-indigo-300 focus:outline-none"
          autoFocus
        />
        <button onClick={handleSave} className="text-green-600 dark:text-green-400 hover:text-green-800 text-xs font-bold px-1">✓</button>
        <button onClick={() => { setIsEditing(false); setEditValue(item.value) }} className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
      <span>{item.value}</span>
      {item.id !== null && (
        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors"
            title="編輯"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            title="刪除"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      )}
    </div>
  )
}

function FiltersTab({ filterOptions, newFilter, setNewFilter, onAdd, onDelete, onUpdate }) {
  const categoryLabels = { season: '季節', festival: '節日', material_type: '材料類型' }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新增篩選選項</h3>
        <form onSubmit={onAdd} className="space-y-4">
          <select value={newFilter.category} onChange={(e) => setNewFilter({ ...newFilter, category: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
            <option value="season">季節</option>
            <option value="festival">節日</option>
            <option value="material_type">材料類型</option>
          </select>
          <input type="text" placeholder="選項名稱 *" value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            required />
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md">
            + 新增選項
          </button>
        </form>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>提示：</strong>將滑鼠移到標籤上，即可看到✏️編輯與✕刪除按鈕。預設內建選項（無 ID）不可刪除。
        </p>
      </div>

      {Object.entries(filterOptions).map(([category, items]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{categoryLabels[category]}</h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">（無選項）</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <FilterTag
                  key={item.id ?? `default-${idx}`}
                  item={item}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// === 使用說明 ===
function ManualSection({ icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="flex items-center gap-3 font-semibold text-gray-900 dark:text-white">
          <span className="text-xl">{icon}</span>
          <span>{title}</span>
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ num, text }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center justify-center mt-0.5">{num}</span>
      <span>{text}</span>
    </div>
  )
}

function Tip({ icon = '💡', text }) {
  return (
    <div className="flex gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <span className="shrink-0">{icon}</span>
      <span className="text-yellow-800 dark:text-yellow-300 text-xs">{text}</span>
    </div>
  )
}

function ManualTab() {
  return (
    <div className="space-y-4 pb-4">
      {/* 總覽 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-5 text-white shadow-md">
        <h2 className="text-xl font-bold mb-1">📖 完整使用說明書</h2>
        <p className="text-indigo-100 text-sm">長輩美術教學管理系統 · 點擊各章節展開說明</p>
      </div>

      {/* 第一次使用 */}
      <ManualSection icon="🚀" title="第一步：初次設定" defaultOpen={true}>
        <p className="font-medium text-gray-900 dark:text-white">請依序完成以下設定：</p>
        <Step num="1" text="前往「活動中心」分頁，確認你的中心都已建立。系統預設已建立六個中心，你可以新增或刪除。" />
        <Step num="2" text="前往「長輩管理」分頁，為每個中心新增長輩的名字（姓名 + 所屬中心）。" />
        <Step num="3" text="前往「篩選條件」分頁，確認季節、節日、材料的選項符合你的需求，可以自由新增、編輯或刪除。" />
        <Step num="4" text="回到作品庫（首頁），點擊右上角「選擇中心」切換到你要使用的中心。" />
        <Step num="5" text="點選底部「📸 上傳」，開始上傳第一件作品！" />
        <Tip text="長輩資料是按「所屬中心」分類的。記錄教學時，系統只會顯示「目前選擇的中心」底下的長輩。" />
      </ManualSection>

      {/* 上傳作品 */}
      <ManualSection icon="📸" title="如何上傳作品">
        <Step num="1" text="點選底部導覽列的「📸 上傳」按鈕。" />
        <Step num="2" text="點擊「拍照」直接用相機拍攝作品，或點擊「從相簿選擇」選取已有的照片。" />
        <Step num="3" text="填寫作品名稱（必填），例如：春天櫻花剪貼畫。" />
        <Step num="4" text="選擇適合季節（春／夏／秋／冬／不限）。" />
        <Step num="5" text="選擇相關節日（若無特定節日請選「無」）。" />
        <Step num="6" text="選擇使用材料類型（可多選，例如：紙類、水彩、不織布等），這些選項可在「篩選條件」設定中自訂。" />
        <Step num="7" text="可選填作品描述，例如製作步驟或教學要點。" />
        <Step num="8" text="點擊「上傳作品」完成！" />
        <Tip icon="⚠️" text="上傳前請確認已選擇照片，且作品名稱不為空，否則無法送出。" />
      </ManualSection>

      {/* 瀏覽作品 */}
      <ManualSection icon="🖼️" title="如何瀏覽與篩選作品">
        <Step num="1" text="首頁（作品庫）會顯示所有已上傳的作品。" />
        <Step num="2" text="頁面上方有篩選器，可按「季節」、「節日」、「材料」過濾作品。點同一個選項再點一次可取消。" />
        <Step num="3" text="選擇中心後，每張作品卡片右上角會出現狀態標籤：「✓ 已教過」（綠色）或「⭐ 可教」（藍色）。" />
        <Step num="4" text="點擊作品卡片可進入詳細頁面，查看完整資訊與教學歷史。" />
        <Tip text="課前準備時，先切換到「要去的中心」，再用篩選器選出適合的作品，就能一眼看出哪些還沒教過！" />
      </ManualSection>

      {/* 記錄教學 */}
      <ManualSection icon="📝" title="如何記錄教學">
        <Step num="1" text="先在右上角選擇你今天去的活動中心。" />
        <Step num="2" text="在作品卡片點擊「+ 記錄教學」按鈕，或進入作品詳細頁後點擊同樣的按鈕。" />
        <Step num="3" text="確認或修改教學日期（預設為今天）。" />
        <Step num="4" text="可選拍最多 3 張現場照片留存。" />
        <Step num="5" text="勾選今天有參與的長輩。" />
        <Step num="6" text="如果是「完整記錄模式」，可為每位長輩記錄完成狀態（完成／部分完成／未完成）與個別反應備註。" />
        <Step num="7" text="填寫整體備註（例如今天教學氣氛、下次改進方向）。" />
        <Step num="8" text="點擊「儲存記錄」完成！" />
        <Tip text="在「設定 → 系統管理」可切換記錄模式：「完整記錄」含個別長輩狀態，「快速記錄」只需勾人即可。" />
      </ManualSection>

      {/* 查看歷史 */}
      <ManualSection icon="📊" title="如何查看教學歷史記錄">
        <Step num="1" text="點擊任一作品卡片，進入作品詳細頁。" />
        <Step num="2" text="確認右上角已選擇中心，頁面下方會顯示「在此中心的教學記錄」。" />
        <Step num="3" text="每筆記錄顯示教學日期與參與人數，點擊可展開查看：現場照片、整體備註、每位長輩的完成狀態與反應。" />
        <Step num="4" text="若要刪除某筆記錄，展開後點擊「🗑️ 刪除此記錄」。" />
        <Tip text="作品庫首頁的卡片上，也會顯示「在此中心教過 N 次」與「上次教學日期」，不用點進去就能快速掌握狀況。" />
      </ManualSection>

      {/* 篩選條件管理 */}
      <ManualSection icon="🏷️" title="如何管理篩選條件（季節／節日／材料）">
        <Step num="1" text="前往「設定 → 篩選條件」分頁。" />
        <Step num="2" text="在「新增篩選選項」區塊，選擇類別（季節／節日／材料類型），輸入名稱後點「+ 新增選項」。" />
        <Step num="3" text="若要修改已有的選項，將滑鼠移到標籤上，點「✏️」圖示，直接在框內修改後按 Enter 或 ✓ 儲存。" />
        <Step num="4" text="若要刪除選項，將滑鼠移到標籤上，點「✕」圖示，確認後即刪除。" />
        <Tip text="材料類型選項會同步顯示在「上傳作品」頁面與作品庫的篩選器中，新增後立即生效！" />
        <Tip icon="⚠️" text="系統內建的預設選項（沒有✏️按鈕的標籤）不可編輯刪除。如需完全自訂，請先在資料庫建立自訂選項，它們就可以自由管理。" />
      </ManualSection>

      {/* 切換中心 */}
      <ManualSection icon="📍" title="如何切換活動中心">
        <Step num="1" text="點擊頁面右上角的「📍 選擇中心」按鈕。" />
        <Step num="2" text="在下拉選單中點擊要切換的中心名稱，勾選符號會出現在目前選擇的中心前面。" />
        <Step num="3" text="切換後，首頁的作品教學統計、記錄教學的長輩名單都會對應切換。" />
        <Tip text="在中心下拉選單中，滑鼠移到中心名稱上會出現「✏️ 編輯」和「🗑️ 刪除」按鈕，可直接在這裡管理中心。" />
      </ManualSection>

      {/* 資料同步 */}
      <ManualSection icon="🔄" title="資料同步說明">
        <p className="font-medium text-gray-900 dark:text-white">所有資料都即時同步到雲端！</p>
        <Step num="1" text="所有操作（新增、編輯、刪除）都會立即寫入 Supabase 雲端資料庫，下次開啟 App 自動讀取最新資料。" />
        <Step num="2" text="作品、教學記錄、長輩名單、活動中心、篩選條件全部都在同一個雲端資料庫，任何更改都會即時反映到畫面上。" />
        <Step num="3" text="如果你在多個裝置使用同一帳號，任一裝置做的更改都會同步到其他裝置（重新整理頁面即可）。" />
        <Step num="4" text="篩選條件更新後，上傳作品頁面和首頁篩選器的選項會立即同步更新，不需要重新整理。" />
        <Tip text="如果發現資料沒有即時更新，請確認網路連線正常，或嘗試重新整理頁面（下拉重新整理）。" />
        <Tip icon="🛡️" text="雲端同步雖然可靠，仍建議定期備份！前往「系統管理 → 立即備份資料」匯出備份檔案。" />
      </ManualSection>

      {/* 刪除作品 */}
      <ManualSection icon="🗑️" title="如何刪除作品">
        <Step num="1" text="在作品庫（首頁），將滑鼠移到要刪除的作品卡片上（手機則長按）。" />
        <Step num="2" text="點擊卡片左上角出現的「🗑️」紅色按鈕。" />
        <Step num="3" text="確認對話框跳出後，點擊「確定刪除」。" />
        <Tip icon="⚠️" text="刪除作品會連同該作品的所有教學記錄一起刪除，且無法復原！重要作品建議先備份。" />
      </ManualSection>

      {/* 深色模式 */}
      <ManualSection icon="🌙" title="深色模式與外觀設定">
        <Step num="1" text="在本設定頁面最上方找到「深色模式」開關。" />
        <Step num="2" text="點擊切換，整個 App 立即套用深色/淺色主題。" />
        <Step num="3" text="設定會自動記住，下次開啟 App 會保留你的選擇。" />
        <Tip text="如果你的手機已開啟系統深色模式，App 首次開啟時會自動跟隨。" />
      </ManualSection>

      {/* 備份還原 */}
      <ManualSection icon="📦" title="資料備份與還原">
        <p className="font-medium text-gray-900 dark:text-white">備份方式：</p>
        <Step num="1" text="前往「系統管理」分頁，點擊「📥 立即備份資料」。" />
        <Step num="2" text="系統會自動下載一個 .json 備份檔案，包含所有作品、長輩、教學記錄與照片。" />
        <Step num="3" text="將這個檔案存到雲端硬碟（Google Drive、iCloud 等）。" />
        <p className="font-medium text-gray-900 dark:text-white mt-2">還原方式：</p>
        <Step num="1" text="點擊「📤 從備份檔案還原」，選擇之前下載的 .json 檔案。" />
        <Step num="2" text="確認後系統會覆蓋現有全部資料並還原備份內容。" />
        <Tip icon="⚠️" text="還原前請務必先備份目前的資料！還原操作會清除現有所有資料再重新匯入。" />
        <Tip text="建議每週備份一次，或在新增大量資料後立刻備份。" />
      </ManualSection>

      {/* 儲存空間 */}
      <ManualSection icon="💾" title="儲存空間說明">
        <p>系統使用<strong className="text-gray-900 dark:text-white">雙儲存架構</strong>，新舊照片分開存放：</p>
        <div className="space-y-2 mt-1">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="font-medium text-orange-800 dark:text-orange-300">🗄️ 舊照片 → Supabase 資料庫</p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">換成 Cloudinary 之前上傳的作品照片，以 base64 格式存在資料庫，每張約 0.3–0.5 MB。Supabase 免費上限 500 MB。</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <p className="font-medium text-indigo-800 dark:text-indigo-300">☁️ 新照片 → Cloudinary 雲端</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">之後上傳的作品照片與現場照片，都自動存到 Cloudinary，完全不佔 Supabase 空間。免費額度高達 25 GB，足夠使用多年。</p>
          </div>
        </div>
        <p className="mt-2">在「系統管理」分頁可查看兩個儲存空間的使用狀況，包含舊照片張數、新照片張數、Supabase 剩餘空間。</p>
        <Tip icon="⚠️" text="Supabase 使用量超過 80% 時系統會出現警告。這只影響舊照片——新上傳的照片已存 Cloudinary，不會再增加 Supabase 用量。" />
        <Tip text="手機離線時，看過的照片（新舊都有）會自動快取在手機裡，下次不需要網路也能瀏覽。" />
      </ManualSection>

      {/* 常見問題 */}
      <ManualSection icon="❓" title="常見問題 FAQ">
        <div className="space-y-4">
          {[
            { q: '上傳照片失敗', a: '檢查 Supabase 的 CHECK 約束是否已移除（見資料庫設定）。也可確認圖片檔案大小不超過 10 MB。' },
            { q: '記錄教學時出現 photos 欄位錯誤', a: '需要在 Supabase 執行：ALTER TABLE teaching_records ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT \'{}\';' },
            { q: '長輩名單沒有出現', a: '請確認已在「長輩管理」中新增長輩，且所屬中心與右上角目前選擇的中心相同。' },
            { q: '篩選條件沒有選項', a: '前往「篩選條件」分頁新增選項，或確認 Supabase 的 filter_options 資料表有資料。' },
            { q: '篩選條件的編輯/刪除按鈕在哪裡？', a: '將滑鼠移到標籤上（手機長按），就會出現 ✏️ 和 ✕ 按鈕。預設內建值沒有這些按鈕，只有自行新增的選項才能編輯刪除。' },
            { q: '深色模式切換後只有部分地方生效', a: '重新整理頁面（下拉刷新）即可完全套用。' },
            { q: '如何安裝到手機桌面', a: 'iOS 請用 Safari 開啟網址，點底部「分享」→「加入主畫面」。Android 請用 Chrome 開啟，點右上角選單→「安裝應用程式」。' },
            { q: '多台裝置資料不同步', a: '所有資料存在雲端，請確認網路正常後重新整理頁面即可同步到最新狀態。' },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Q：{q}</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">A：{a}</p>
            </div>
          ))}
        </div>
      </ManualSection>

      {/* 版本 */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
        長輩美術教學管理系統 v2.4 · 祝教學順利 🎨
      </div>
    </div>
  )
}

export default Settings
