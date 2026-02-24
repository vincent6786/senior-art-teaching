import { createClient } from '@supabase/supabase-js'

// ⚠️ 重要：使用環境變數儲存敏感資訊
// 在 Vercel 或本地的 .env 檔案中設定這些值
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// 實用的 API 函數封裝
// ============================================

// 1. 作品相關
export const worksAPI = {
  // 取得所有作品（可篩選）
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

  // 取得單一作品詳情
  async getById(id) {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 新增作品
  async create(work) {
    const { data, error } = await supabase
      .from('works')
      .insert([work])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 更新作品
  async update(id, updates) {
    const { data, error } = await supabase
      .from('works')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 刪除作品
  async delete(id) {
    // 先刪除圖片
    const work = await this.getById(id)
    if (work.image_url) {
      const path = work.image_url.split('/').slice(-2).join('/')
      await supabase.storage.from('images').remove([path])
    }
    
    // 再刪除資料庫記錄
    const { error } = await supabase
      .from('works')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // 上傳作品圖片
  async uploadImage(file, workId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${workId}-${Date.now()}.${fileExt}`
    const filePath = `works/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  // 取得作品在特定中心的教學記錄
  async getLocationHistory(workId, locationId) {
    const { data, error } = await supabase
      .from('teaching_records')
      .select(`
        *,
        teaching_seniors (
          *,
          seniors (name)
        )
      `)
      .eq('work_id', workId)
      .eq('location_id', locationId)
      .order('teaching_date', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// 2. 中心/據點相關
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
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
}

// 3. 長輩相關
export const seniorsAPI = {
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
    const { error } = await supabase
      .from('seniors')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
}

// 4. 教學記錄相關
export const teachingRecordsAPI = {
  // 新增教學記錄（包含長輩參與資訊）
  async create(record, participants) {
    // 先建立教學記錄
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
    
    // 再建立參與者記錄
    if (participants && participants.length > 0) {
      const participantRecords = participants.map(p => ({
        teaching_record_id: teachingRecordId,
        senior_id: p.senior_id,
        completion_status: p.completion_status,
        reaction: p.reaction
      }))
      
      const { error: participantError } = await supabase
        .from('teaching_seniors')
        .insert(participantRecords)
      
      if (participantError) throw participantError
    }
    
    return recordData[0]
  },

  // 刪除教學記錄
  async delete(recordId) {
    const { error } = await supabase
      .from('teaching_records')
      .delete()
      .eq('id', recordId)
    
    if (error) throw error
    return true
  },

  // 取得作品統計（被教過幾次）
  async getWorkStatistics(workId, locationId = null) {
    let query = supabase
      .from('teaching_records')
      .select('id, teaching_date, locations(name)')
      .eq('work_id', workId)
    
    if (locationId) {
      query = query.eq('location_id', locationId)
    }
    
    const { data, error } = await query.order('teaching_date', { ascending: false })
    
    if (error) throw error
    return {
      total_times: data.length,
      last_taught: data[0]?.teaching_date || null,
      records: data
    }
  }
}

// 5. 篩選條件管理 API (新增！)
export const filterOptionsAPI = {
  // 取得所有篩選選項
  async getAll() {
    const { data, error } = await supabase
      .from('filter_options')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    
    if (error) throw error
    
    // 按類別分組
    const grouped = {
      season: [],
      festival: [],
      material_type: []
    }
    
    data.forEach(option => {
      if (grouped[option.category]) {
        grouped[option.category].push(option.value)
      }
    })
    
    return grouped
  },

  // 取得特定類別的選項
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

  // 新增篩選選項
  async create(category, value, displayOrder = 999) {
    const { data, error } = await supabase
      .from('filter_options')
      .insert([{
        category,
        value,
        display_order: displayOrder
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 刪除篩選選項
  async delete(id) {
    const { error } = await supabase
      .from('filter_options')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
}
