# Osaka LANY 2026 手機版

來源：既有大阪 Console 與 Long個人檔案內 revision 43 的行程資料。原檔保留不改。

靜態 GitHub Pages 網站，毋須登入 ChatGPT。本機選餐、行程、待辦與備註使用 localStorage；私人票券使用 IndexedDB，沒有上傳端點。不會同步 Google Drive 或更改真實訂位。

第一次連網開啟，等待「離線包已備妥」後加入手機主畫面，以飛行模式重新開啟驗收。Google 地圖及導航需要網絡，離線只有路線示意與地點資料。私人文件應另行備份。

網站更新時遞增 sw.js 的 CACHE 版本及 `trip-data.json` 的 `revision`。新版本會更新未經手動編輯的每日行程；手動編輯過的日期維持本機版本。首次升級會在同一瀏覽器的 localStorage 留下更新前備份；跨裝置編輯目前仍未連上 Google Drive。可用「匯出我的修改」交回 JSON 整合。

本次搬移未重新核實航班時間或餐廳營業資料。
