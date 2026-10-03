# Osaka LANY 2026 手機版

> 詳細指南版本62：37個節點／32張可收合指南；內容、相容性及驗收記錄見 [PREVIEW-62.md](PREVIEW-62.md)。

靜態 GitHub Pages 行程網站，不需登入 ChatGPT。本次發布行程基線為 revision 62；個人修改存在 localStorage，私人票券存在 IndexedDB。

## 私人跨裝置版本

「私人 Drive 同步」可選擇連接 Google，手動將本機行程、待辦、選餐、備註及票券保存為私人版本。在另一部裝置連接同一 Google 帳戶，更新清單並載入該版本。每次保存建立新版本，不會自動同步或合併兩部裝置的修改。

載入前先備份本機行程，可按「還原載入前的行程」撤回；票券依內容校驗去重，只加入缺少的檔案，保留本機已有票券。只支援 PDF、JPEG、PNG、WebP，每份 20 MB、合計 64 MB、最多 100 份。

私人版本放在 Google Drive 的應用程式專用空間，不在一般 Drive 檔案清單顯示。網站只要求 `drive.appdata` 和電郵辨識權限；OAuth access token 只留在頁面記憶體，重新開頁或到期需重新連接。`sync-config.json` 是公開 OAuth client ID，不是 secret。私人檔案與備註不可提交到本 repo。

首次使用須由本人完成 Google 授權。OAuth 目前設為測試模式，只允許已加入的測試使用者。

## 離線與更新

第一次連網開啟，等待「離線包已備妥」後加入手機主畫面，以飛行模式重新開啟驗收。Google 地圖、導航及 Drive 同步需要網絡。私人文件應另行備份。

發布時遞增 `sw.js` 的 CACHE 版本及 `trip-data.json` 的 revision。新版本更新未手動編輯的日期，保留手動修改，升級前保留瀏覽器備份。也可用「匯出我的修改」備份 JSON。

網站操作不會更改真實訂位；本次功能更新未重新核實航班時間或餐廳營業資料。
