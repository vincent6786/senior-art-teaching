# 長輩美術教學管理系統 - 完整部署指南

這是一個專為長輩美術教學設計的作品與教學記錄管理系統，支援 PWA（可安裝到手機桌面）。

## 🎯 系統功能

### ✅ 已實現功能
- 📸 作品上傳（支援拍照或從相簿選擇）
- 🖼️ 作品瀏覽與篩選（季節/節日/材料）
- 📊 教學記錄（記錄參與長輩、完成度、反應）
- 🏢 多中心管理（可切換不同活動中心）
- 📱 PWA 支援（可安裝到手機桌面）
- 🔍 作品統計（被教過幾次、最後教學日期）
- 💬 備註功能（個別長輩反應 + 整體備註）

## 🚀 部署步驟

### 第一步：建立 Supabase 專案

1. **註冊 Supabase**
   - 前往 https://supabase.com
   - 使用 GitHub 帳號註冊（免費）

2. **建立新專案**
   - 點擊 "New Project"
   - 輸入專案名稱：`senior-art-teaching`
   - 設定資料庫密碼（請記住）
   - 選擇地區：選擇 "Southeast Asia (Singapore)" 速度較快
   - 點擊 "Create new project"（需要等待 1-2 分鐘）

3. **執行資料庫架構**
   - 在左側選單點擊 "SQL Editor"
   - 點擊 "New query"
   - 複製 `database-schema.sql` 的完整內容
   - 貼上並點擊 "Run" 執行
   - 看到 "Success" 表示資料庫建立完成

4. **設定儲存空間（Storage）**
   - 在左側選單點擊 "Storage"
   - 點擊 "Create a new bucket"
   - Bucket name: `images`
   - Public bucket: **勾選** ✅ （讓圖片可以公開存取）
   - 點擊 "Create bucket"

5. **取得 API 金鑰**
   - 在左側選單點擊 "Settings" > "API"
   - 找到兩個重要的值：
     * `Project URL` (例如：https://xxxxx.supabase.co)
     * `anon public` key (一串很長的字串)
   - **複製這兩個值**，等下會用到

### 第二步：部署到 Vercel

1. **推送程式碼到 GitHub**
   ```bash
   # 在專案資料夾中執行
   git init
   git add .
   git commit -m "Initial commit"
   
   # 建立 GitHub repository 後
   git remote add origin https://github.com/你的帳號/你的repo名稱.git
   git branch -M main
   git push -u origin main
   ```

2. **連接 Vercel**
   - 前往 https://vercel.com
   - 用 GitHub 帳號登入
   - 點擊 "Add New" > "Project"
   - 選擇你剛才建立的 repository
   - 點擊 "Import"

3. **設定環境變數**
   - 在 Vercel 專案設定頁面，找到 "Environment Variables"
   - 新增兩個變數：
     * `VITE_SUPABASE_URL` = 你的 Supabase Project URL
     * `VITE_SUPABASE_ANON_KEY` = 你的 Supabase anon key
   - 點擊 "Deploy"

4. **等待部署完成**
   - 大約 1-2 分鐘
   - 部署完成後會得到一個網址，例如：https://你的專案.vercel.app

### 第三步：安裝到手機

#### iOS (iPhone/iPad)
1. 用 Safari 瀏覽器打開你的網址
2. 點擊底部的「分享」按鈕
3. 往下滑，找到「加入主畫面」
4. 點擊「加入」
5. 完成！桌面上會出現 App 圖示

#### Android
1. 用 Chrome 瀏覽器打開你的網址
2. 點擊右上角的「⋮」選單
3. 選擇「加到主畫面」或「安裝應用程式」
4. 點擊「安裝」
5. 完成！桌面上會出現 App 圖示

## 📝 使用流程

### 初次使用
1. **新增活動中心**
   - 進入系統後，點擊右上角「選擇中心」
   - 會提示你新增第一個中心（可以手動在 Supabase 後台新增）

2. **新增長輩資料**
   - 在 Supabase 後台的 `seniors` 表格中
   - 手動新增長輩姓名與所屬中心

3. **上傳作品**
   - 點擊底部「📸 上傳作品」
   - 拍照或選擇照片
   - 填寫作品資訊
   - 選擇季節、節日、材料類型
   - 點擊「上傳作品」

### 日常使用

**課前準備模式：**
1. 選擇「要去的活動中心」
2. 用篩選器選擇適合的作品（例如：季節 > 春、材料 > 紙類）
3. 查看哪些作品「已教過」或「可教」
4. 點進作品看詳細記錄

**課後記錄模式：**
1. 找到教過的作品
2. 點擊「+ 記錄教學」
3. 選擇教學日期
4. 勾選參與的長輩
5. 記錄每位長輩的完成狀態與反應
6. 儲存記錄

## 🛠️ 本地開發（給開發者）

```bash
# 安裝依賴
npm install

# 建立 .env.local 檔案（複製 .env.example）
cp .env.example .env.local
# 編輯 .env.local，填入你的 Supabase 金鑰

# 啟動開發伺服器
npm run dev

# 建置正式版本
npm run build
```

## 📊 資料庫結構說明

- `works` - 作品表（照片、季節、節日、材料）
- `locations` - 活動中心表
- `seniors` - 長輩資料表
- `teaching_records` - 教學記錄表（日期、備註）
- `teaching_seniors` - 教學參與表（完成度、反應）

## 🔧 進階功能（未來可擴充）

- [ ] 統計報表（教學次數、參與度分析）
- [ ] 作品收藏功能
- [ ] 教案匯出（PDF 格式）
- [ ] 多人協作（老師帳號系統）
- [ ] 離線模式（完全離線使用）
- [ ] 圖片壓縮（節省儲存空間）

## ❓ 常見問題

**Q: 照片上傳失敗？**
A: 檢查 Supabase Storage 的 `images` bucket 是否設定為 Public

**Q: 資料沒有顯示？**
A: 檢查 Vercel 的環境變數是否正確設定

**Q: 手機無法安裝到桌面？**
A: 確認你使用的是 Safari (iOS) 或 Chrome (Android) 瀏覽器

**Q: 如何備份資料？**
A: 在 Supabase 後台可以匯出 SQL 備份

## 🎨 客製化

如果你想修改：
- **顏色主題**：編輯 `tailwind.config.js` 中的 colors
- **節日選項**：修改 `database-schema.sql` 中的 CHECK 條件
- **材料類型**：同上

## 📞 技術支援

遇到問題可以：
1. 查看 Supabase 的 Logs（在專案 > Logs）
2. 查看 Vercel 的 Deployment Logs
3. 檢查瀏覽器的 Console（F12 開發者工具）

---

## 🎉 恭喜！

你現在有一個完整的教學管理系統了！

**下一步建議：**
1. 先上傳 10-20 個作品測試
2. 記錄幾次教學看看流程是否順暢
3. 根據實際使用體驗調整功能

祝教學順利！ 🎨👵👴
