import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import WorksGallery from './pages/WorksGallery'
import UploadWork from './pages/UploadWork'
import TeachingRecord from './pages/TeachingRecord'
import WorkDetail from './pages/WorkDetail'
import Settings from './pages/Settings'
import './App.css'

function App() {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

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
                currentLocation={currentLocation}
                onLocationChange={setCurrentLocation}
              />
            </div>
          </div>
        </nav>

        {/* 主要內容區 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<WorksGallery currentLocation={currentLocation} />} />
            <Route path="/upload" element={<UploadWork />} />
            <Route path="/record/:workId" element={<TeachingRecord currentLocation={currentLocation} />} />
            <Route path="/work/:workId" element={<WorkDetail currentLocation={currentLocation} />} />
            <Route path="/settings" element={<Settings darkMode={darkMode} setDarkMode={setDarkMode} />} />
          </Routes>
        </main>

        <BottomNav />
        <ScrollToTopButton />
      </div>
    </Router>
  )
}

// 中心選擇器元件
function LocationSelector({ currentLocation, onLocationChange }) {
  const [locations, setLocations] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    import('./lib/supabase').then(({ locationsAPI }) => {
      locationsAPI.getAll().then(setLocations)
    })
  }, [])

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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 font-medium">
              選擇活動中心
            </div>
            <div className="max-h-96 overflow-y-auto">
              {locations.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">尚無中心資料</p>
                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                  >
                    前往設定新增
                  </Link>
                </div>
              ) : (
                locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onLocationChange(loc)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      currentLocation?.id === loc.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {currentLocation?.id === loc.id && <span>✓</span>}
                      <span>{loc.name}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 底部導覽列 - 3 個按鈕
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

// 浮動回頂部按鈕 - 滾動時出現
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center animate-fadeIn"
      aria-label="回到頂部"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link 
      to={to} 
      className={`nav-item ${active ? 'active' : ''}`}
    >
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
