import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import WorksGallery from './pages/WorksGallery'
import UploadWork from './pages/UploadWork'
import TeachingRecord from './pages/TeachingRecord'
import WorkDetail from './pages/WorkDetail'
import Settings from './pages/Settings'
import { locationsAPI, filterOptionsAPI, seniorsAPI } from './lib/supabase'
import './App.css'

function App() {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locations, setLocations] = useState([])
  const [filterOptions, setFilterOptions] = useState({ season: [], festival: [], material_type: [] })
  const [seniors, setSeniors] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const refreshLocations = useCallback(async () => {
    try {
      const data = await locationsAPI.getAll()
      setLocations(data)
      return data
    } catch (error) {
      console.error('載入中心失敗:', error)
      return []
    }
  }, [])

  const refreshFilterOptions = useCallback(async () => {
    try {
      const data = await filterOptionsAPI.getAll()
      setFilterOptions(data)
      return data
    } catch (error) {
      console.error('載入篩選條件失敗:', error)
      return { season: [], festival: [], material_type: [] }
    }
  }, [])

  const refreshSeniors = useCallback(async () => {
    try {
      const data = await seniorsAPI.getAll()
      setSeniors(data)
      return data
    } catch (error) {
      console.error('載入長輩失敗:', error)
      return []
    }
  }, [])

  // 啟動時平行載入全部全域資料
  useEffect(() => {
    Promise.all([refreshLocations(), refreshFilterOptions(), refreshSeniors()])
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* 頂部導覽列 */}
        <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg text-gray-900 dark:text-white shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
                <span className="text-3xl">🎨</span>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  教學管理
                </span>
              </Link>

              <LocationSelector
                locations={locations}
                currentLocation={currentLocation}
                onLocationChange={setCurrentLocation}
                onLocationsUpdate={refreshLocations}
              />
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={
              <WorksGallery
                currentLocation={currentLocation}
                filterOptions={filterOptions}
              />
            } />
            <Route path="/upload" element={
              <UploadWork filterOptions={filterOptions} />
            } />
            <Route path="/record/:workId" element={
              <TeachingRecord
                currentLocation={currentLocation}
                allSeniors={seniors}
              />
            } />
            <Route path="/work/:workId" element={
              <WorkDetail currentLocation={currentLocation} />
            } />
            <Route path="/settings" element={
              <Settings
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                locations={locations}
                seniors={seniors}
                filterOptions={filterOptions}
                onLocationsUpdate={refreshLocations}
                onSeniorsUpdate={refreshSeniors}
                onFilterOptionsUpdate={refreshFilterOptions}
              />
            } />
          </Routes>
        </main>

        <BottomNav />
        <ScrollToTopButton />
      </div>
    </Router>
  )
}

// 中心選擇器
function LocationSelector({ locations, currentLocation, onLocationChange, onLocationsUpdate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleStartEdit = (e, loc) => {
    e.stopPropagation()
    setEditingId(loc.id)
    setEditName(loc.name)
  }

  const handleSaveEdit = async (e) => {
    e.stopPropagation()
    if (!editName.trim()) return
    try {
      await locationsAPI.update(editingId, { name: editName.trim() })
      setEditingId(null)
      await onLocationsUpdate()
    } catch (error) {
      alert('更新失敗：' + error.message)
    }
  }

  const handleCancelEdit = (e) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleDelete = async (e, locId) => {
    e.stopPropagation()
    if (!confirm('確定要刪除此中心嗎？相關的教學記錄也會被刪除。')) return
    try {
      await locationsAPI.delete(locId)
      if (currentLocation?.id === locId) onLocationChange(null)
      await onLocationsUpdate()
    } catch (error) {
      alert('刪除失敗：' + error.message)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
      >
        <span>📍</span>
        <span className="max-w-[120px] truncate">{currentLocation ? currentLocation.name : '選擇中心'}</span>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setEditingId(null) }} />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 font-medium flex justify-between items-center">
              <span>選擇活動中心</span>
              <Link to="/settings" onClick={() => setIsOpen(false)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                ⚙️ 管理
              </Link>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {locations.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">尚無中心資料</p>
                  <Link to="/settings" onClick={() => setIsOpen(false)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
                    前往設定新增
                  </Link>
                </div>
              ) : (
                locations.map(loc => (
                  <div key={loc.id} className="group">
                    {editingId === loc.id ? (
                      <div className="px-3 py-2 space-y-2 bg-indigo-50 dark:bg-indigo-900/20">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(e)
                            if (e.key === 'Escape') handleCancelEdit(e)
                          }}
                        />
                        <div className="flex gap-1">
                          <button onClick={handleSaveEdit} className="flex-1 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700">✓ 儲存</button>
                          <button onClick={handleCancelEdit} className="flex-1 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">✕ 取消</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${currentLocation?.id === loc.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                        <button
                          onClick={() => { onLocationChange(loc); setIsOpen(false) }}
                          className={`flex-1 text-left flex items-center gap-2 ${currentLocation?.id === loc.id ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          {currentLocation?.id === loc.id && <span className="text-sm">✓</span>}
                          <span>{loc.name}</span>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button onClick={(e) => handleStartEdit(e, loc)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="編輯">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={(e) => handleDelete(e, loc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="刪除">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BottomNav() {
  const location = useLocation()
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-2 py-2">
          <NavItem to="/" icon="🖼️" label="作品庫" active={isActive('/')} />
          <NavItem to="/upload" icon="📸" label="上傳" active={isActive('/upload')} />
          <NavItem to="/settings" icon="⚙️" label="設定" active={isActive('/settings')} />
        </div>
      </div>
    </nav>
  )
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center animate-fadeIn"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      <div className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md scale-105'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}>
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
    </Link>
  )
}

export default App
