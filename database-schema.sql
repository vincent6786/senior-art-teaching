-- ============================================
-- 長輩美術教學作品管理系統 - 資料庫架構
-- ============================================

-- 1. 作品表 (存放所有作品照片與屬性)
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    season VARCHAR(20) CHECK (season IN ('春', '夏', '秋', '冬', '不限')),
    festival VARCHAR(50) CHECK (festival IN ('春節', '元宵', '清明', '端午', '中秋', '重陽', '無')),
    material_type VARCHAR(50) CHECK (material_type IN ('紙類', '黏土', '布料', '綜合媒材', '其他')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 活動中心表
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 長輩資料表
CREATE TABLE seniors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 教學記錄表 (核心！記錄每次教學的詳細資訊)
CREATE TABLE teaching_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    teaching_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 教學記錄 - 長輩關聯表 (多對多關係：一次教學可能有多位長輩參與)
CREATE TABLE teaching_seniors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teaching_record_id UUID REFERENCES teaching_records(id) ON DELETE CASCADE,
    senior_id UUID REFERENCES seniors(id) ON DELETE CASCADE,
    completion_status VARCHAR(20) CHECK (completion_status IN ('完成', '部分完成', '未完成')),
    reaction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teaching_record_id, senior_id)
);

-- ============================================
-- 實用的查詢 View (視圖)
-- ============================================

-- View 1: 作品統計 (每個作品被教過幾次、最後教學日期)
CREATE VIEW work_statistics AS
SELECT 
    w.id,
    w.title,
    w.image_url,
    w.season,
    w.festival,
    w.material_type,
    COUNT(DISTINCT tr.id) as times_taught,
    MAX(tr.teaching_date) as last_taught_date
FROM works w
LEFT JOIN teaching_records tr ON w.id = tr.work_id
GROUP BY w.id, w.title, w.image_url, w.season, w.festival, w.material_type;

-- View 2: 特定中心的作品教學記錄
CREATE VIEW location_work_history AS
SELECT 
    w.id as work_id,
    w.title as work_title,
    w.image_url,
    l.id as location_id,
    l.name as location_name,
    COUNT(tr.id) as times_taught_here,
    MAX(tr.teaching_date) as last_taught_date_here
FROM works w
CROSS JOIN locations l
LEFT JOIN teaching_records tr ON w.id = tr.work_id AND l.id = tr.location_id
GROUP BY w.id, w.title, w.image_url, l.id, l.name;

-- ============================================
-- 索引優化 (加快查詢速度)
-- ============================================
CREATE INDEX idx_teaching_records_work ON teaching_records(work_id);
CREATE INDEX idx_teaching_records_location ON teaching_records(location_id);
CREATE INDEX idx_teaching_records_date ON teaching_records(teaching_date);
CREATE INDEX idx_seniors_location ON seniors(location_id);
CREATE INDEX idx_teaching_seniors_record ON teaching_seniors(teaching_record_id);
CREATE INDEX idx_teaching_seniors_senior ON teaching_seniors(senior_id);

-- ============================================
-- 觸發器：自動更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_works_updated_at BEFORE UPDATE ON works
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================
-- 如果你未來需要多用戶權限管理，可以啟用這些
-- ALTER TABLE works ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE teaching_records ENABLE ROW LEVEL SECURITY;
-- 目前先註解掉，因為是個人使用

-- ============================================
-- 範例資料 (測試用)
-- ============================================

-- 插入測試中心
INSERT INTO locations (name, address) VALUES 
    ('文山樂齡中心', '聯新平鎮'),
    ('聯新中壢', '聯新復旦'),
    ('三峽中埔', '佳醫中壢');

-- 插入測試長輩
INSERT INTO seniors (name, location_id, notes) 
SELECT '林奶奶', id, '喜歡畫畫，手部靈活' FROM locations WHERE name = '松山老人活動中心'
UNION ALL
SELECT '王爺爺', id, '視力不好，需要大字體' FROM locations WHERE name = '松山老人活動中心'
UNION ALL
SELECT '陳奶奶', id, '喜歡做手工藝' FROM locations WHERE name = '大安社區關懷據點';

-- 插入測試作品
INSERT INTO works (title, image_url, season, festival, material_type, description) VALUES
    ('春天櫻花剪貼畫', 'https://via.placeholder.com/400x300?text=櫻花', '春', '無', '紙類', '使用色紙剪出櫻花並貼在卡紙上'),
    ('端午節粽子吊飾', 'https://via.placeholder.com/400x300?text=粽子', '夏', '端午', '布料', '用布料製作可愛的粽子造型吊飾'),
    ('秋天落葉拓印', 'https://via.placeholder.com/400x300?text=落葉', '秋', '無', '綜合媒材', '收集落葉做拓印畫'),
    ('中秋節月餅黏土', 'https://via.placeholder.com/400x300?text=月餅', '秋', '中秋', '黏土', '用輕黏土製作月餅造型');
