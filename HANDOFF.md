# 大阪 LANY 2026｜另一部 Mac / Codex 接手

更新：2026-10-03。行程網站公開可讀，不需登入 ChatGPT：
https://klking2.github.io/osaka-lany-2026/?v=59

## 專案在哪裏

- GitHub 原始碼（公開、用來發布網站）：https://github.com/klking2/osaka-lany-2026 ，`main` 分支。
- Google Drive 工作資料夾：`我的雲端硬碟/大阪之旅/osaka-trip-mobile`。在另一部 Mac，從 Finder 的 Google Drive 找這個資料夾；不要照搬這部 Mac 的 `/Users/kingclaw/...` 路徑。
- 這部 MacBook 的獨立 checkout：`~/Documents/ChatGPT/travel/osaka-trip-mobile`。其他機器需實測自己的路徑。
- revision 54 原始基線提交：`27a1bdf`；目前目標基線為 `trip-data.json` revision 59（可收合閱讀標題）。另一部 Mac 接手時，先核對自己的資料夾已同步到至少這個版本。

## 明天在另一部 Mac

1. 用瀏覽器開上面的公開網址，確認行程可看。這一步與兩部 Mac 是否同時開機無關。
2. 在 Finder 開 Google Drive 的 `大阪之旅/osaka-trip-mobile`，等雲端檔案下載完成，再用 Codex 開**該資料夾**。Codex 登入帳戶可以不同；它不會自動繼承本機 Codex 對話或瀏覽器儲存資料。
3. 請 Codex 先檢查 `git status`、`git log -1 --oneline`、`trip-data.json` revision、Google Drive 同步狀態，以及這個 `HANDOFF.md`。若 Drive 裏 `.git` 不完整，改從上述 GitHub repo 複製一份獨立 checkout；不要在未核對差異前覆寫 Drive 版本。
4. 修改行程基線主要用 `trip-data.json`；地點資料用 `places.json`；頁面互動用 `index.html` / `mobile.js`。保留已確認訂位，勿把私人 QR、登機證、取票碼、密碼或其他私人票券放入公開 repo。
5. 要讓所有人看到改動，還要把修改提交並推送到 GitHub `main`，等 GitHub Pages 顯示 `built`，再回讀公開網址確認。**只改 Google Drive 檔案不會自動更新公開網站。** 推送需要所用 GitHub 帳戶對 repo 有寫入權；Codex 帳戶本身不等於 GitHub 發布權限。

## 私人跨裝置版本

revision 56 加入手動 Google Drive 私人版本：裝置 A 連接 Google 並儲存，裝置 B 連接同一帳戶、更新清單、選取版本載入。行程、待辦、選餐、備註及票券可一併傳送；不會自動合併兩機編輯。載入前備份本機行程，票券只新增並依內容去重，不刪除原有票券。

Cloud 專案 `osaka-lany-sync-padking4-2026`，Drive API 已啟用；OAuth Web client 設定在公開的 `sync-config.json`（client ID 不是 secret）。權限僅 `drive.appdata` 和 `userinfo.email`；私人資料留在登入帳戶的 appDataFolder。測試模式需指定測試用戶，首次授權由使用者自行完成。

驗收：本人已完成首次 Google 授權。真實 Drive 上傳及 SHA-256 回讀通過；正式網站與 localhost（各自獨立 localStorage／IndexedDB）雙向載入、圖片 bytes 一致、重複載入去重、行程備份回復均通過。既有行程完整保留，本機測試圖片已移除，最新正式版本不含測試圖。Node 與模擬傳輸的格式／損壞／401 失敗保護測試亦通過。尚未操作第二部實體手機或 Mac，該裝置仍需本人登入同一帳戶並載入驗收。

## 可直接交給另一部 Mac 上 Codex 的提示

> 請接手 Google Drive「我的雲端硬碟/大阪之旅/osaka-trip-mobile」的大阪 LANY 2026 專案。先完整讀 HANDOFF.md，核對 GitHub main、trip-data.json revision、Drive 同步和 git status；不要使用另一部 Mac 的本機路徑或假設瀏覽器個人修改已同步。按我接下來的要求編輯，發布前先測試，推送後驗證 GitHub Pages 公開內容。勿上傳私人票券或密碼。

## 2026-10-03 MacBook 接手修復

本機測得 Drive 缺少 `.git/index` 並殘留舊 `index.lock`。完整備份後，確認沒有 Git 程序使用鎖檔，將舊鎖保留改名並以 `git read-tree HEAD` 重建 index；沒有重置或刪除工作檔。

這部 MacBook 的發布工作區：`~/Documents/ChatGPT/travel/osaka-trip-mobile`（獨立 checkout）。後續編輯優先使用本機獨立 checkout，Drive 用作可讀的工作檔鏡射；另一部 Mac 也應使用自己的 checkout，以免雲端同步互相覆蓋 Git index／鎖檔。不要同時在兩部機器寫入 Drive 的同一 `.git`。

revision 55 修正備註內的舊 R3 字眼，也對已儲存舊備註的瀏覽器作一次精確字串更新，保留其他個人備註及手動行程。

上述 Cloud 帳戶設定、首次網頁 OAuth 授權及真實 Drive 往返驗收已完成；第二部實體裝置仍需登入同一帳戶並載入最新「MacBook 正式網站」版本。

## revision 57 手機主畫面入口

頁首新增「加入手機主畫面」按鈕。支援 beforeinstallprompt 的瀏覽器按下後開啟安裝提示；其他瀏覽器展開 iPhone／Android 指引，iPhone 需本人在 Safari 分享選單按「加入主畫面」。390px 手機寬度無橫向溢出，按鈕高度 50px；模擬安裝接受／取消／完成狀態及 iPhone 指引分支通過。未操作使用者實體手機安裝。行程、訂位、私人同步內容未改動。

## revision 58 電子登機證後的上機步驟

新增 `#boarding-guide` 六步指引及頁首「上飛機步驟」捷徑，針對10/4 UO686。已按 HK Express 官方網上登機、T2、FAQ、旅遊警示核對；08:45 取自原行程，05:45抵達建議／07:30自助機截止／07:45寄艙截止／08:00前到閘／08:15關閘為按其推算，若改時依航空公司最新安排。Edward 確認有寄艙行李，主要流程固定先到T2 U行寄艙，T2安檢出境後搭接駁列車到T1登機區，回程須另用UO689登機證。沒有把私人QR放入repo，也沒有改動既有行程時間及訂位。

## revision 59 手機／電腦收合閱讀

上機步驟、總覽待辦、地圖、候選、餐廳、行程、私人同步及票券預設收起；餐廳與候選子分類及備註亦有獨立標題。原生 details／summary 支援觸控及鍵盤，提供全部展開／收起。點擊頁內捷徑（包括拉麵及備註）會自動打開所需父層。URL 的 ?v=53 只是查詢參數，同站點會取得目前版本；既有私人資料及訂位不變。


## 2026-10-03：詳細指南本機預覽62

37個節點／32張指南已實作；尚未發布，公開版仍61。程式、資料升級與Ego Lite桌面／手機尺寸驗收通過；停止本機伺服器後，舊v53網址仍可讀指南及私人測試票券。測試資料已移除，預覽 http://127.0.0.1:8766/?v=62#itinerary 已恢復。Lawson兩間官方頁確認地址與24小時營業，但未明列Loppi；指南附電話確認方法。完整內容、證據限制與驗收記錄見PREVIEW-62.md。備份位於travel/backups/detailed-guides-before-20261003-164906。下一步為Edward審閱；得到明確授權才發布，不自行推送。

## 2026-10-03：版本62發布授權

Edward已明確要求把詳細指南發布至公開App。此次版本62／cache v21，新增頁首三個直達入口，移除預覽提示；本機與遷移驗收見PREVIEW-62.md。發布後核對原 `?v=53` 網址及guide-data.json。私人儲存格式不變；Drive鏡射需另外核對，不能由Git發布推定已同步。

## 2026-10-03：私人圖片版本63

新增頁內私人圖片gallery／放大／原始大小、票券手機導覽、只載入票券的Drive按鈕，保留行程狀態。公共revision63、cache v22、mobile及private-sync資源v63；指南仍用v62。使用者提供的5張原圖已從App儲存到其私人Drive並回讀校驗，沒有加入repo。手機需登入同一帳戶選圖片版本，再只加入票券；不能宣稱手機已載入。

## 2026-10-03：私人票券收合清單版本64

公共 revision64、cache v23。票券逐項收合，標題標明票券及持有人。第二張 Visit Japan Web 原圖保留 repo 外，透過私人票券包匯入；不得把私人 QR 加入公共資產。

## 2026-10-03：票券用途標題版本65

公共 revision65、cache v24；私人票券 title 欄位獨立於 name。同步標題採用可選欄位，舊快照兼容；重複內容只補缺少的標題，保留本機自訂標題。
