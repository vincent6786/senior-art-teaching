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
    if (filters.material_type) query = query.eq('material_type', filters.material_type)

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

  // 壓縮圖片並回傳 base64（client-side，不需要 Storage）
  async uploadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 600
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round(height * maxSize / width); width = maxSize }
            else { width = Math.round(width * maxSize / height); height = maxSize }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.65))
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
  // 取全部長輩（含所屬中心名稱），供 App 全域使用
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
      // 平行查作品圖片與教學記錄
      const [worksRes, recordsRes] = await Promise.all([
        supabase.from('works').select('id, image_url'),
        supabase.from('teaching_records').select('photos')
      ])
      if (worksRes.error) throw worksRes.error

      let totalBytes = 0
      let photoCount = 0
      const worksCount = worksRes.data?.length || 0

      // 計算每張作品主圖的大小（base64 或 URL 都算）
      for (const w of worksRes.data || []) {
        if (w.image_url) {
          if (w.image_url.startsWith('data:')) {
            // base64：字串長度 * 0.75 ≈ 實際 bytes
            totalBytes += Math.round(w.image_url.length * 0.75)
          } else if (w.image_url.startsWith('http')) {
            // Storage URL：估算平均 200KB
            totalBytes += 200 * 1024
          }
          photoCount++
        }
      }

      // 教學現場照片
      for (const r of recordsRes.data || []) {
        for (const p of r.photos || []) {
          if (p?.startsWith('data:')) {
            totalBytes += Math.round(p.length * 0.75)
          } else if (p?.startsWith('http')) {
            totalBytes += 200 * 1024
          }
          photoCount++
        }
      }

      const limitBytes = 500 * 1024 * 1024
      const usedMB = (totalBytes / (1024 * 1024)).toFixed(2)
      const usedPercent = ((totalBytes / limitBytes) * 100).toFixed(1)

      return {
        totalSize: totalBytes,
        usedMB,
        limitMB: 500,
        usedPercent,
        remainingMB: Math.max(0, 500 - parseFloat(usedMB)).toFixed(2),
        photoCount,
        worksCount
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
        const { error } = await supabase.from('works').insert(
          backup.data.works.map(w => ({
            id: w.id, title: w.title, image_url: w.image_url, thumbnail_url: w.thumbnail_url || null,
            season: w.season, festival: w.festival, material_type: w.material_type,
            description: w.description || '', created_at: w.created_at, updated_at: w.updated_at
          }))
        )
        if (error) throw new Error('還原作品失敗: ' + error.message)
        results.works = backup.data.works.length
      }
      if (backup.data.teaching_records?.length > 0) {
        const { error } = await supabase.from('teaching_records').insert(
          backup.data.teaching_records.map(r => ({
            id: r.id, work_id: r.work_id, location_id: r.location_id,
            teaching_date: r.teaching_date, notes: r.notes || '',
            photos: r.photos || [], created_at: r.created_at
          }))
        )
        if (error) throw new Error('還原教學記錄失敗: ' + error.message)
        results.records = backup.data.teaching_records.length
      }
      if (backup.data.teaching_seniors?.length > 0) {
        const { error } = await supabase.from('teaching_seniors').insert(
          backup.data.teaching_seniors.map(ts => ({
            id: ts.id, teaching_record_id: ts.teaching_record_id, senior_id: ts.senior_id,
            completion_status: ts.completion_status, reaction: ts.reaction || '', created_at: ts.created_at
          }))
        )
        if (error) console.warn('部分教學長輩記錄還原失敗:', error.message)
      }
      if (backup.data.filter_options?.length > 0) {
        const { error } = await supabase.from('filter_options').insert(
          backup.data.filter_options.map(f => ({
            id: f.id, category: f.category, value: f.value,
            display_order: f.display_order || 0, is_active: f.is_active !== undefined ? f.is_active : true,
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

// 永遠可用的硬編碼預設值（資料庫空或失敗時 fallback）
const DEFAULT_FILTER_OPTIONS = {
  season: ['春', '夏', '秋', '冬', '不限'],
  festival: ['無', '春節', '元宵', '清明', '端午', '中秋', '重陽', '聖誕'],
  material_type: ['紙類', '黏土', '布料', '綜合媒材', '其他']
}

export const filterOptionsAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('filter_options')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      // 資料庫錯誤或 RLS 阻擋 → 回傳預設值
      if (error) {
        console.warn('filter_options 查詢失敗，使用預設值:', error.message)
        return { ...DEFAULT_FILTER_OPTIONS }
      }

      const grouped = { season: [], festival: [], material_type: [] }
      data.forEach(option => {
        if (grouped[option.category] !== undefined) {
          grouped[option.category].push(option.value)
        }
      })

      // 資料庫是空的 → 回傳預設值（不嘗試寫入，避免 UNIQUE 衝突）
      const hasData = Object.values(grouped).some(arr => arr.length > 0)
      if (!hasData) {
        console.info('filter_options 資料表是空的，使用預設值')
        return { ...DEFAULT_FILTER_OPTIONS }
      }

      return grouped
    } catch (err) {
      console.warn('filterOptionsAPI.getAll 例外，使用預設值:', err.message)
      return { ...DEFAULT_FILTER_OPTIONS }
    }
  },

  async create(category, value, displayOrder = 999) {
    const { data, error } = await supabase
      .from('filter_options')
      .insert([{ category, value, display_order: displayOrder, is_active: true }])
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase.from('filter_options').delete().eq('id', id)
    if (error) throw error
    return true
  }
}
