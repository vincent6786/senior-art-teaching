# 🎨 長輩美術教學管理系統

專為長輩美術教學設計的作品與教學記錄管理系統，支援 PWA 安裝到手機桌面。

---

## 功能總覽

| 功能 | 說明 |
|------|------|
| 📸 作品庫 | 上傳、瀏覽、管理所有美術作品 |
| 🔍 智慧篩選 | 依季節、節日、材料類型、教學狀態快速過濾 |
| 📝 教學記錄 | 記錄教學日期、參與長輩、完成狀態、現場照片 |
| 🏢 多中心管理 | 支援多個活動中心，資料各自獨立 |
| 👥 長輩管理 | 依中心管理長輩名單與備註 |
| 🏷️ 自訂篩選條件 | 季節、節日、材料可自由新增、編輯、刪除 |
| 🎯 教學狀態篩選 | 一鍵篩出「未教過」或「已教過」的作品 |
| 📦 備份還原 | 匯出 JSON 備份，可完整還原所有資料 |
| 🌙 深色模式 | 一鍵切換，自動記住偏好 |
| ☁️ 雲端同步 | 所有資料即時同步，支援多裝置 |

---

## 部署方式

### 第一步：建立 Supabase 資料庫

1. 前往 [supabase.com](https://supabase.com) 免費註冊
2. 建立新專案，地區選「Southeast Asia (Singapore)」速度較快
3. 進入 **SQL Editor**，貼上 `database-schema.sql` 的內容並執行
4. 前往 **Settings → API**，複製以下兩個值備用：
   - `Project URL`
   - `anon public` key

### 第二步：設定 Cloudinary 照片儲存（建議）

1. 前往 [cloudinary.com](https://cloudinary.com) 免費註冊（25 GB 免費額度）
2. 在 Dashboard 取得：
   - `Cloud Name`
   - `Upload Preset`（在 Settings → Upload → Add upload preset，選 Unsigned）
3. 將這兩個值填入 `.env.local`

### 第三步：部署到 Vercel

```bash
# 推送到 GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/你的帳號/你的專案.git
git push -u origin main
```

1. 前往 [vercel.com](https://vercel.com)，以 GitHub 帳號登入
2. Import 你的 repository
3. 在 **Environment Variables** 填入：

```
VITE_SUPABASE_URL        = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY   = eyJxxxxxxxxxxxx
VITE_CLOUDINARY_CLOUD_NAME = 你的 cloud name
VITE_CLOUDINARY_UPLOAD_PRESET = 你的 upload preset
```

4. 點擊 Deploy，約 1–2 分鐘完成

### 第四步：安裝到手機

**iOS（Safari）**：分享 → 加入主畫面

**Android（Chrome）**：右上角選單 → 安裝應用程式

---

## 本地開發

```bash
npm install
cp .env.example .env.local   # 填入金鑰
npm run dev
```

```bash
npm run build    # 建置正式版
npm run preview  # 預覽正式版
```

---

## 初次使用流程

```
設定 → 活動中心   → 確認或新增你的中心
設定 → 長輩管理   → 為每個中心新增長輩
設定 → 篩選條件   → 確認材料、節日選項符合需求
右上角            → 選擇今天要去的中心
底部「📸 上傳」   → 開始上傳第一件作品！
```

---

## 日常使用

### 課前備課
1. 右上角切換到要去的中心
2. 篩選器點「⭐ 未教過」，只看還沒教的作品
3. 再加上季節或材料篩選縮小範圍
4. 點進作品確認細節與過去記錄

### 課後記錄
1. 找到教過的作品，點「+ 記錄教學」
2. 確認日期，選拍最多 3 張現場照片
3. 勾選今天參與的長輩
4. 填寫備註後儲存

---

## 資料庫結構

```
works             作品（標題、圖片、季節、節日、材料）
locations         活動中心
seniors           長輩資料（姓名、所屬中心、備註）
teaching_records  教學記錄（日期、現場照片、整體備註）
teaching_seniors  長輩參與記錄（完成狀態、個別反應）
filter_options    自訂篩選選項（季節、節日、材料類型）
```

---

## 儲存架構

系統採雙儲存架構：

- **Cloudinary**（建議）：新照片存此，25 GB 免費，不佔 Supabase 空間
- **Supabase**：資料庫本體 + 舊版 base64 照片，免費額度 500 MB

在「設定 → 系統管理」可查看兩邊的使用量與照片統計。

---

## 常見問題

**Q：上傳照片失敗？**
確認 Cloudinary Upload Preset 設為 Unsigned，或 Supabase CHECK 約束已移除。

**Q：長輩名單沒有出現？**
確認長輩的所屬中心與右上角目前選擇的中心相同。

**Q：教學狀態篩選沒有出現？**
需先在右上角選擇一個活動中心，才會顯示此篩選。

**Q：篩選條件要怎麼編輯或刪除？**
前往「設定 → 篩選條件」，滑鼠移到標籤上會出現 ✏️ 和 ✕ 按鈕（手機請長按）。

**Q：如何備份資料？**
「設定 → 系統管理 → 立即備份資料」，下載 JSON 檔案存到雲端硬碟。

**Q：多台裝置資料不同步？**
確認網路正常後重新整理頁面，所有資料均存於 Supabase 雲端，會自動同步。

---

## 版本紀錄

| 版本 | 主要更新 |
|------|---------|
| v2.5 | 教學狀態篩選（未教過 / 已教過）、使用說明更新 |
| v2.4 | 篩選條件可編輯刪除、材料選項大幅擴充、使用說明加入資料同步說明 |
| v2.3 | 資料同步架構、備份還原改善 |
| v2.1 | 儲存空間監控、Cloudinary 雙儲存架構 |
| v2.0 | 中心管理、長輩管理、自訂篩選條件、深色模式、備份功能 |
| v1.0 | 初始版本：作品上傳、教學記錄、多中心切換 |

---

祝教學順利 🎨
