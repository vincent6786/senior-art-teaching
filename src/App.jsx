import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import WorksGallery from './pages/WorksGallery'
import UploadWork from './pages/UploadWork'
import TeachingRecord from './pages/TeachingRecord'
import WorkDetail from './pages/WorkDetail'
import './App.css'

function App() {
  const [currentLocation, setCurrentLocation] = useState(null)

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* 頂部導覽列 */}
        <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold">
                🎨 教學管理
              </Link>
              
              {/* 中心選擇器 */}
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
            <Route 
              path="/" 
              element={<WorksGallery currentLocation={currentLocation} />} 
            />
            <Route 
              path="/upload" 
              element={<UploadWork />} 
            />
            <Route 
              path="/record/:workId" 
              element={<TeachingRecord currentLocation={currentLocation} />} 
            />
            <Route 
              path="/work/:workId" 
              element={<WorkDetail currentLocation={currentLocation} />} 
            />
          </Routes>
        </main>

        {/* 底部快捷選單 */}
        <BottomNav />
      </div>
    </Router>
  )
}

// 中心選擇器元件
function LocationSelector({ currentLocation, onLocationChange }) {
  const [locations, setLocations] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  // 載入中心列表
  useState(() => {
    import('./lib/supabase').then(({ locationsAPI }) => {
      locationsAPI.getAll().then(setLocations)
    })
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <span>📍</span>
        <span>{currentLocation ? currentLocation.name : '選擇中心'}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50">
          <div className="px-4 py-2 text-sm text-gray-500 border-b">
            選擇活動中心
          </div>
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => {
                onLocationChange(loc)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-100 ${
                currentLocation?.id === loc.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 底部導覽列
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around py-3">
          <Link to="/" className="nav-item">
            <span className="text-2xl">🖼️</span>
            <span className="text-xs mt-1">作品庫</span>
          </Link>
          
          <Link to="/upload" className="nav-item">
            <span className="text-2xl">📸</span>
            <span className="text-xs mt-1">上傳作品</span>
          </Link>
          
          <button className="nav-item">
            <span className="text-2xl">📊</span>
            <span className="text-xs mt-1">統計</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default App
