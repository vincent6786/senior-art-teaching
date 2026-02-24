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
    const work = await this.getById(id)
    if (work.image_url) {
      const path = work.image_url.split('/').slice(-2).join('/')
      await supabase.storage.from('images').remove([path])
    }
    const { error } = await supabase.from('works').delete().eq('id', id)
    if (error) throw error
    return true
  },

  async uploadImage(file, workId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${workId}-${Date.now()}.${fileExt}`
    const filePath = `works/${fileName}`
    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('images').getPublicUrl(filePath)
    return data.publicUrl
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
        notes: record.notes
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
      // 取作品圖片 + 教學記錄現場照片，平行查詢
      const [worksRes, recordsRes] = await Promise.all([
        supabase.from('works').select('image_url'),
        supabase.from('teaching_records').select('photos')
      ])
      if (worksRes.error) throw worksRes.error

      // 計算 base64 字串大小（bytes ≈ base64長度 * 3/4）
      let totalBytes = 0
      let photoCount = 0

      for (const w of worksRes.data || []) {
        if (w.image_url?.startsWith('data:')) {
          totalBytes += Math.round(w.image_url.length * 0.75)
          photoCount++
        }
      }
      for (const r of recordsRes.data || []) {
        for (const p of r.photos || []) {
          if (p?.startsWith('data:')) {
            totalBytes += Math.round(p.length * 0.75)
            photoCount++
          }
        }
      }

      // Supabase 免費版 DB 上限 500MB
      const limitBytes = 500 * 1024 * 1024
      const usedMB = (totalBytes / (1024 * 1024)).toFixed(2)
      const usedPercent = ((totalBytes / limitBytes) * 100).toFixed(1)

      return {
        totalSize: totalBytes,
        usedMB,
        limitMB: 500,
        usedPercent,
        remainingMB: Math.max(0, 500 - parseFloat(usedMB)).toFixed(2),
        fileCount: photoCount,
        worksCount: worksRes.data?.length || 0
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
      version: '2.2',
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
      // 依序清除（因為外鍵依賴）
      await supabase.from('teaching_seniors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('teaching_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('seniors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('works').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('filter_options').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 1. 還原中心
      if (backup.data.locations?.length > 0) {
        const { error } = await supabase.from('locations').insert(
          backup.data.locations.map(l => ({ id: l.id, name: l.name, address: l.address || '', created_at: l.created_at }))
        )
        if (error) throw new Error('還原中心失敗: ' + error.message)
        results.locations = backup.data.locations.length
      }

      // 2. 還原長輩
      if (backup.data.seniors?.length > 0) {
        const { error } = await supabase.from('seniors').insert(
          backup.data.seniors.map(s => ({ id: s.id, name: s.name, location_id: s.location_id, notes: s.notes || '', created_at: s.created_at }))
        )
        if (error) throw new Error('還原長輩失敗: ' + error.message)
        results.seniors = backup.data.seniors.length
      }

      // 3. 還原作品
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

      // 4. 還原教學記錄
      if (backup.data.teaching_records?.length > 0) {
        const { error } = await supabase.from('teaching_records').insert(
          backup.data.teaching_records.map(r => ({
            id: r.id, work_id: r.work_id, location_id: r.location_id,
            teaching_date: r.teaching_date, notes: r.notes || '', created_at: r.created_at
          }))
        )
        if (error) throw new Error('還原教學記錄失敗: ' + error.message)
        results.records = backup.data.teaching_records.length
      }

      // 5. 還原教學長輩記錄
      if (backup.data.teaching_seniors?.length > 0) {
        const { error } = await supabase.from('teaching_seniors').insert(
          backup.data.teaching_seniors.map(ts => ({
            id: ts.id, teaching_record_id: ts.teaching_record_id, senior_id: ts.senior_id,
            completion_status: ts.completion_status, reaction: ts.reaction || '', created_at: ts.created_at
          }))
        )
        if (error) console.warn('部分教學長輩記錄還原失敗:', error.message)
      }

      // 6. 還原篩選條件
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
      console.error('還原失敗:', error)
      throw error
    }
  }
}

// ============================================
// 6. 篩選條件管理 API
// ============================================
export const filterOptionsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('filter_options')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    if (error) throw error
    
    const grouped = { season: [], festival: [], material_type: [] }
    data.forEach(option => {
      if (grouped[option.category]) grouped[option.category].push(option.value)
    })
    return grouped
  },

  async getByCategory(category) {
    const { data, error } = await supabase
      .from('filter_options')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('display_order')
    if (error) throw error
    return data.map(option => option.value)
  },

  async create(category, value, displayOrder = 999) {
    const { data, error } = await supabase
      .from('filter_options')
      .insert([{ category, value, display_order: displayOrder }])
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
