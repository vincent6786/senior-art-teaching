import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// 1. 作品相關
// ============================================
export const worksAPI = {
  async getAll(filters = {}) {
    let query = supabase
      .from('works')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.season) query = query.eq('season', filters.season)
    if (filters.festival) query = query.eq('festival', filters.festival)
    if (filters.material_type) query = query.ilike('material_type', `%${filters.material_type}%`)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(work) {
    const { data, error } = await supabase
      .from('works')
      .insert([work])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('works')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase.from('works').delete().eq('id', id)
    if (error) throw error
    return true
  },

  async uploadImage(file) {
    const mode = localStorage.getItem('storageMode') || 'cloudinary'
    if (mode === 'supabase') {
      return this._uploadImageBase64(file, 900, 0.78)
    } else {
      return this._uploadImageCloudinary(file, 'senior-art', 900, 0.78)
    }
  },

  async _uploadImageBase64(file, maxSize = 900, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round(height * maxSize / width); width = maxSize }
            else { width = Math.round(width * maxSize / height); height = maxSize }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  async _uploadImageCloudinary(file, folder = 'senior-art', maxSize = 900, quality = 0.78) {
    const CLOUD_NAME = 'dbq5zvmwv'
    const UPLOAD_PRESET = 'vetwuqsc'

    const blob = await new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round(height * maxSize / width); width = maxSize }
            else { width = Math.round(width * maxSize / height); height = maxSize }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          canvas.toBlob(resolve, 'image/jpeg', quality)
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const formData = new FormData()
    formData.append('file', blob, 'photo.jpg')
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', folder)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()
    if (data.error) throw new Error('Cloudinary 上傳失敗：' + data.error.message)
    return data.secure_url
  },

  async getLocationHistory(workId, locationId) {
    const { data, error } = await supabase
      .from('teaching_records')
      .select(`*, teaching_seniors (*, seniors (name))`)
      .eq('work_id', workId)
      .eq('location_id', locationId)
      .order('teaching_date', { ascending: false })
    if (error) throw error
    return data
  }
}

// ============================================
// 2. 中心/據點相關
// ============================================
export const locationsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')
    if (error) throw error
    return data
  },

  async create(location) {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase.from('locations').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

// ============================================
// 3. 長輩相關
// ============================================
export const seniorsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('seniors')
      .select('*, locations(name)')
      .order('name')
    if (error) throw error
    return data.map(s => ({ ...s, location_name: s.locations?.name || '' }))
  },

  async getByLocation(locationId) {
    const { data, error } = await supabase
      .from('seniors')
      .select('*')
      .eq('location_id', locationId)
      .order('name')
    if (error) throw error
    return data
  },

  async create(senior) {
    const { data, error } = await supabase
      .from('seniors')
      .insert([senior])
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase.from('seniors').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

// ============================================
// 4. 教學記錄相關
// ============================================
export const teachingRecordsAPI = {
  async create(record, participants) {
    const { data: recordData, error: recordError } = await supabase
      .from('teaching_records')
      .insert([{
        work_id: record.work_id,
        location_id: record.location_id,
        teaching_date: record.teaching_date,
        notes: record.notes,
        photos: record.photos || []
      }])
      .select()
    if (recordError) throw recordError

    const teachingRecordId = recordData[0].id
    if (participants && participants.length > 0) {
      const participantRecords = participants.map(p => ({
        teaching_record_id: teachingRecordId,
        senior_id: p.senior_id,
        completion_status: p.completion_status,
        reaction: p.reaction
      }))
      const { error: participantError } = await supabase.from('teaching_seniors').insert(participantRecords)
      if (participantError) throw participantError
    }
    return recordData[0]
  },

  async delete(recordId) {
    const { error } = await supabase.from('teaching_records').delete().eq('id', recordId)
    if (error) throw error
    return true
  },

  async getWorkStatistics(workId, locationId = null) {
    let query = supabase
      .from('teaching_records')
      .select('id, teaching_date, locations(name)')
      .eq('work_id', workId)
    if (locationId) query = query.eq('location_id', locationId)
    const { data, error } = await query.order('teaching_date', { ascending: false })
    if (error) throw error
    return {
      total_times: data.length,
      last_taught: data[0]?.teaching_date || null,
      records: data
    }
  }
}

// ============================================
// 5. 系統管理 API
// ============================================
export const systemAPI = {
  async getStorageUsage() {
    try {
      const [worksRes, recordsRes] = await Promise.all([
        supabase.from('works').select('id, image_url'),
        supabase.from('teaching_records').select('photos')
      ])
      if (worksRes.error) throw worksRes.error

      let supabaseBytes = 0
      let workBase64 = 0
      let workCloudinary = 0
      let fieldBase64 = 0
      let fieldCloudinary = 0
      const worksCount = worksRes.data?.length || 0

      for (const w of worksRes.data || []) {
        if (!w.image_url) continue
        if (w.image_url.startsWith('data:')) {
          supabaseBytes += Math.round(w.image_url.length * 0.75)
          workBase64++
        } else if (w.image_url.includes('cloudinary.com')) {
          workCloudinary++
        }
      }

      for (const r of recordsRes.data || []) {
        for (const p of r.photos || []) {
          if (p?.startsWith('data:')) {
            supabaseBytes += Math.round(p.length * 0.75)
            fieldBase64++
          } else if (p?.includes('cloudinary.com')) {
            fieldCloudinary++
          }
        }
      }

      const limitBytes = 500 * 1024 * 1024
      const usedMB = (supabaseBytes / (1024 * 1024)).toFixed(2)
      const usedPercent = ((supabaseBytes / limitBytes) * 100).toFixed(1)
      const totalPhotos = workBase64 + workCloudinary + fieldBase64 + fieldCloudinary
      const cloudinaryTotal = workCloudinary + fieldCloudinary
      const supabaseTotal = workBase64 + fieldBase64

      const WORK_PHOTO_KB = 180
      const FIELD_PHOTO_KB = 90

      const cloudinaryEstimatedBytes =
        (workCloudinary * WORK_PHOTO_KB * 1024) +
        (fieldCloudinary * FIELD_PHOTO_KB * 1024)
      const cloudinaryLimitBytes = 25 * 1024 * 1024 * 1024
      const cloudinaryUsedMB = (cloudinaryEstimatedBytes / (1024 * 1024)).toFixed(1)
      const cloudinaryUsedPercent = ((cloudinaryEstimatedBytes / cloudinaryLimitBytes) * 100).toFixed(3)
      const cloudinaryRemainingGB = Math.max(0, 25 - cloudinaryEstimatedBytes / (1024 * 1024 * 1024)).toFixed(2)

      return {
        totalSize: supabaseBytes,
        usedMB,
        limitMB: 500,
        usedPercent,
        remainingMB: Math.max(0, 500 - parseFloat(usedMB)).toFixed(2),
        totalPhotos,
        worksCount,
        supabaseTotal,
        workBase64,
        fieldBase64,
        cloudinaryTotal,
        workCloudinary,
        fieldCloudinary,
        cloudinaryUsedMB,
        cloudinaryUsedPercent,
        cloudinaryRemainingGB
      }
    } catch (error) {
      console.error('取得容量失敗:', error)
      return null
    }
  },

  async backupAllData() {
    const [works, locations, seniors, teachingRecords, teachingSeniors, filterOptions] = await Promise.all([
      supabase.from('works').select('*'),
      supabase.from('locations').select('*'),
      supabase.from('seniors').select('*'),
      supabase.from('teaching_records').select('*'),
      supabase.from('teaching_seniors').select('*'),
      supabase.from('filter_options').select('*')
    ])

    return {
      version: '2.3',
      timestamp: new Date().toISOString(),
      data: {
        works: works.data || [],
        locations: locations.data || [],
        seniors: seniors.data || [],
        teaching_records: teachingRecords.data || [],
        teaching_seniors: teachingSeniors.data || [],
        filter_options: filterOptions.data || []
      },
      stats: {
        works_count: works.data?.length || 0,
        locations_count: locations.data?.length || 0,
        seniors_count: seniors.data?.length || 0,
        records_count: teachingRecords.data?.length || 0
      }
    }
  },

  async exportBackup() {
    const backup = await this.backupAllData()
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `教學管理系統備份_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    return backup.stats
  },

  async restoreBackup(backup) {
    if (!backup.data) throw new Error('無效的備份檔案')
    const results = { locations: 0, seniors: 0, works: 0, records: 0, filters: 0 }

    try {
      await supabase.from('teaching_seniors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('teaching_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('seniors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('works').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('filter_options').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      if (backup.data.locations?.length > 0) {
        const { error } = await supabase.from('locations').insert(
          backup.data.locations.map(l => ({ id: l.id, name: l.name, address: l.address || '', created_at: l.created_at }))
        )
        if (error) throw new Error('還原中心失敗: ' + error.message)
        results.locations = backup.data.locations.length
      }
      if (backup.data.seniors?.length > 0) {
        const { error } = await supabase.from('seniors').insert(
          backup.data.seniors.map(s => ({ id: s.id, name: s.name, location_id: s.location_id, notes: s.notes || '', created_at: s.created_at }))
        )
        if (error) throw new Error('還原長輩失敗: ' + error.message)
        results.seniors = backup.data.seniors.length
      }
      if (backup.data.works?.length > 0) {
        const { error } = await supabase.from('works').insert(backup.data.works)
        if (error) throw new Error('還原作品失敗: ' + error.message)
        results.works = backup.data.works.length
      }
      if (backup.data.teaching_records?.length > 0) {
        const { error } = await supabase.from('teaching_records').insert(backup.data.teaching_records)
        if (error) throw new Error('還原教學記錄失敗: ' + error.message)
        results.records = backup.data.teaching_records.length
      }
      if (backup.data.teaching_seniors?.length > 0) {
        const { error } = await supabase.from('teaching_seniors').insert(backup.data.teaching_seniors)
        if (error) throw new Error('還原參與記錄失敗: ' + error.message)
      }
      if (backup.data.filter_options?.length > 0) {
        const { error } = await supabase.from('filter_options').insert(
          backup.data.filter_options.map(f => ({
            id: f.id,
            category: f.category,
            value: f.value,
            display_order: f.display_order,
            is_active: f.is_active,
            created_at: f.created_at
          }))
        )
        if (error) throw new Error('還原篩選條件失敗: ' + error.message)
        results.filters = backup.data.filter_options.length
      }
      return results
    } catch (error) {
      throw error
    }
  }
}

// ============================================
// 6. 篩選條件管理 API
// ============================================

const DEFAULT_FILTER_OPTIONS = {
  season: ['春', '夏', '秋', '冬', '不限'],
  festival: ['無', '春節', '元宵', '清明', '端午', '中秋', '重陽', '聖誕', '母親節', '父親節', '兒童節', '教師節', '情人節'],
  material_type: ['紙類', '黏土', '布料', '水彩', '粉蠟筆', '色鉛筆', '毛線', '不織布', '珠珠', '鋁線', '木材', '貝殼', '乾燥花', '回收材料', '綜合媒材', '其他']
}

function _defaultToObjects(defaults) {
  return Object.fromEntries(
    Object.entries(defaults).map(([cat, vals]) => [
      cat,
      vals.map(v => ({ id: null, value: v }))
    ])
  )
}

export const filterOptionsAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('filter_options')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) {
        console.warn('filter_options 查詢失敗，使用預設值:', error.message)
        return _defaultToObjects(DEFAULT_FILTER_OPTIONS)
      }

      const grouped = { season: [], festival: [], material_type: [] }
      data.forEach(option => {
        if (grouped[option.category] !== undefined) {
          grouped[option.category].push({ id: option.id, value: option.value })
        }
      })

      const hasData = Object.values(grouped).some(arr => arr.length > 0)
      if (!hasData) {
        console.info('filter_options 資料表是空的，使用預設值')
        return _defaultToObjects(DEFAULT_FILTER_OPTIONS)
      }

      return grouped
    } catch (err) {
      console.warn('filterOptionsAPI.getAll 例外，使用預設值:', err.message)
      return _defaultToObjects(DEFAULT_FILTER_OPTIONS)
    }
  },

  // ✅ 修正：加入 try/catch 與清楚的錯誤訊息
  async create(category, value, displayOrder = 999) {
    try {
      const { data, error } = await supabase
        .from('filter_options')
        .insert([{ category, value, display_order: displayOrder, is_active: true }])
        .select()
      if (error) throw new Error(error.message)
      return data[0]
    } catch (err) {
      // 如果是「資料表不存在」，給出更明確的提示
      if (err.message?.includes('filter_options')) {
        throw new Error('filter_options 資料表尚未建立，請到 Supabase SQL Editor 執行建表指令')
      }
      throw new Error('新增篩選條件失敗：' + err.message)
    }
  },

  // ✅ 修正：加入 try/catch 與清楚的錯誤訊息
  async update(id, newValue) {
    try {
      const { data, error } = await supabase
        .from('filter_options')
        .update({ value: newValue })
        .eq('id', id)
        .select()
      if (error) throw new Error(error.message)
      return data[0]
    } catch (err) {
      throw new Error('更新篩選條件失敗：' + err.message)
    }
  },

  // ✅ 修正：加入 try/catch 與清楚的錯誤訊息
  async delete(id) {
    try {
      const { error } = await supabase
        .from('filter_options')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
      return true
    } catch (err) {
      throw new Error('刪除篩選條件失敗：' + err.message)
    }
  }
}
