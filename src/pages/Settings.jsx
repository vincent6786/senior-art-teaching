import { useState, useEffect } from 'react'
import { locationsAPI, seniorsAPI, filterOptionsAPI } from '../lib/supabase'

function Settings({ darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState('locations') // locations, seniors, filters
  const [locations, setLocations] = useState([])
  const [seniors, setSeniors] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    season: [],
    festival: [],
    material_type: []
  })
  const [loading, setLoading] = useState(true)

  // 新增表單狀態
  const [newLocation, setNewLocation] = useState({ name: '', address: '' })
  const [newSenior, setNewSenior] = useState({ name: '', location_id: '', notes: '' })
  const [newFilter, setNewFilter] = useState({ category: 'season', value: '' })

  useEffect(() => {
    loadData()
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
