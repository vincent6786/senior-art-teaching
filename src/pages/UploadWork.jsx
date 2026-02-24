import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { worksAPI, filterOptionsAPI } from '../lib/supabase'

function UploadWork() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [filterOptions, setFilterOptions] = useState({
    season: [],
    festival: [],
    material_type: []
  })
  
  const [formData, setFormData] = useState({
    title: '',
    season: '',
    festival: '無',
    material_type: '',
    description: ''
  })

  // 載入篩選選項
  useEffect(() => {
    filterOptionsAPI.getAll().then(setFilterOptions)
  }, [])

  // 處理圖片選擇
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // 處理拍照（手機專用）
  const handleCapture = (e) => {
    handleImageChange(e)
  }

  // 處理表單變更
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!imageFile) {
      alert('請選擇或拍攝作品照片')
      return
    }

    if (!formData.title.trim()) {
      alert('請輸入作品名稱')
      return
    }

    setLoading(true)

    try {
      // 壓縮圖片（client-side，直接存 base64，不需要 Storage）
      const imageUrl = await worksAPI.uploadImage(imageFile)

      // 一次建立作品（含圖片）
      await worksAPI.create({
        title: formData.title,
        season: formData.season || '不限',
        festival: formData.festival,
        material_type: formData.material_type,
        description: formData.description,
        image_url: imageUrl
      })

      alert('作品上傳成功！')
      navigate('/')
    } catch (error) {
      console.error('上傳失敗:', error)
      alert('上傳失敗：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">上傳新作品</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 圖片上傳區 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            作品照片 *
          </label>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="預覽"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null)
                  setImageFile(null)
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 拍照按鈕（手機會開啟相機）*/}
              <label className="block w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50 dark:bg-gray-700/50">
                <span className="text-4xl mb-2 block">📸</span>
                <span className="text-gray-600 dark:text-gray-300">點擊拍照</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCapture}
                  className="hidden"
                />
              </label>

              {/* 或是從相簿選擇 */}
              <label className="block w-full py-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <span className="text-gray-700 dark:text-gray-300">或從相簿選擇</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* 基本資訊 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">作品資訊</h3>

          {/* 作品名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              作品名稱 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：春天櫻花剪貼畫"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* 季節 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              適合季節
            </label>
            <div className="flex flex-wrap gap-2">
              {(filterOptions.season.length > 0 ? filterOptions.season : ['春', '夏', '秋', '冬', '不限']).map(season => (
                <button
                  key={season}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, season }))}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    formData.season === season
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {/* 節日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              相關節日
            </label>
            <select
              name="festival"
              value={formData.festival}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="無">無特定節日</option>
              {(filterOptions.festival.length > 0 ? filterOptions.festival : ['春節', '元宵', '清明', '端午', '中秋', '重陽']).filter(f => f !== '無').map(festival => (
                <option key={festival} value={festival}>{festival}</option>
              ))}
            </select>
          </div>

          {/* 材料類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              使用材料
            </label>
            <div className="flex flex-wrap gap-2">
              {(filterOptions.material_type.length > 0 ? filterOptions.material_type : ['紙類', '黏土', '布料', '綜合媒材', '其他']).map(material => (
                <button
                  key={material}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, material_type: material }))}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    formData.material_type === material
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          {/* 作品描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              作品描述（選填）
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="例如：使用色紙剪出櫻花並貼在卡紙上，適合春天主題活動"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ 壓縮並上傳中...' : '上傳作品'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadWork
