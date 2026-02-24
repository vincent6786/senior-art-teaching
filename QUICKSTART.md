# 🚀 快速開始指南

## 📁 專案結構

```
senior-art-teaching-app/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase API 封裝
│   ├── pages/
│   │   ├── WorksGallery.jsx     # 作品瀏覽頁面
│   │   ├── UploadWork.jsx       # 作品上傳頁面
│   │   ├── TeachingRecord.jsx   # 教學記錄頁面
│   │   └── WorkDetail.jsx       # 作品詳情頁面
│   ├── App.jsx                  # 主要應用程式元件
│   ├── App.css                  # 全局樣式
│   └── main.jsx                 # React 進入點
├── database-schema.sql          # Supabase 資料庫架構
├── index.html                   # HTML 進入點
├── package.json                 # 專案依賴
├── vite.config.js              # Vite + PWA 配置
├── tailwind.config.js          # Tailwind CSS 配置
└── README.md                    # 完整說明文件

```

## ⚡ 30 秒快速部署

### 1. Supabase 設定（5 分鐘）
```bash
1. 註冊 https://supabase.com
2. 建立新專案
3. 執行 database-schema.sql
4. 建立 Storage bucket: "images" (設為 Public)
5. 複製 Project URL 和 anon key
```

### 2. Vercel 部署（3 分鐘）
```bash
1. 推送程式碼到 GitHub
2. 連接 Vercel
3. 設定環境變數：
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. 部署完成！
```

### 3. 手機安裝（1 分鐘）
```bash
iOS: Safari > 分享 > 加入主畫面
Android: Chrome > ⋮ > 安裝應用程式
```

## 🎯 核心功能速覽

### 1. 作品管理
- ✅ 拍照上傳作品
- ✅ 按季節/節日/材料篩選
- ✅ 查看作品統計

### 2. 教學記錄
- ✅ 記錄參與長輩
- ✅ 完成度追蹤（完成/部分完成/未完成）
- ✅ 個別反應備註

### 3. 多中心管理
- ✅ 切換不同活動中心
- ✅ 顯示「已教過」標籤
- ✅ 避免重複教學

## 💡 使用技巧

### 課前準備
1. 選擇中心 → 2. 篩選作品 → 3. 查看記錄

### 課後記錄
1. 找到作品 → 2. 記錄教學 → 3. 勾選長輩 → 4. 填寫反應

## 🔧 本地開發

```bash
# 安裝
npm install

# 設定環境變數
cp .env.example .env.local
# 編輯 .env.local 填入 Supabase 金鑰

# 開發
npm run dev

# 建置
npm run build
```

## 📝 下一步

✅ 完成部署後：
1. 在 Supabase 手動新增 1-2 個活動中心
2. 新增 5-10 位長輩資料
3. 上傳幾個測試作品
4. 試著記錄一次教學

## ⚠️ 重要提醒

- Supabase 免費版每月 500MB 儲存空間
- 建議圖片控制在 1MB 以內
- 定期備份 Supabase 資料
- Storage bucket 必須設為 Public

## 🎨 客製化建議

想修改節日或材料選項？
→ 編輯 `database-schema.sql` 中的 CHECK 條件

想改變顏色主題？
→ 編輯 `tailwind.config.js`

需要更多功能？
→ 參考 README.md 中的進階功能清單

---

**遇到問題？**
1. 檢查 Supabase Logs
2. 檢查 Vercel Deployment Logs  
3. 檢查瀏覽器 Console (F12)

祝使用順利！ 🎉
