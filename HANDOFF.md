# 大阪 LANY 2026｜另一部 Mac / Codex 接手

更新：2026-10-03。行程網站公開可讀，不需登入 ChatGPT：
https://klking2.github.io/osaka-lany-2026/?v=55

## 專案在哪裏

- GitHub 原始碼（公開、用來發布網站）：https://github.com/klking2/osaka-lany-2026 ，`main` 分支。
- Google Drive 工作資料夾：`我的雲端硬碟/大阪之旅/osaka-trip-mobile`。在另一部 Mac，從 Finder 的 Google Drive 找這個資料夾；不要照搬這部 Mac 的 `/Users/kingclaw/...` 路徑。
- 這部 Mac 的 `~/Documents/ChatGPT/2026)/osaka-trip-mobile` 只是指向上述 Drive 資料夾的捷徑。
- revision 54 原始基線提交：`27a1bdf`；目前目標基線為 `trip-data.json` revision 55（MacBook 修正發布）。另一部 Mac 接手時，先核對自己的資料夾已同步到至少這個版本。

## 明天在另一部 Mac

1. 用瀏覽器開上面的公開網址，確認行程可看。這一步與兩部 Mac 是否同時開機無關。
2. 在 Finder 開 Google Drive 的 `大阪之旅/osaka-trip-mobile`，等雲端檔案下載完成，再用 Codex 開**該資料夾**。Codex 登入帳戶可以不同；它不會自動繼承本機 Codex 對話或瀏覽器儲存資料。
3. 請 Codex 先檢查 `git status`、`git log -1 --oneline`、`trip-data.json` revision、Google Drive 同步狀態，以及這個 `HANDOFF.md`。若 Drive 裏 `.git` 不完整，改從上述 GitHub repo 複製一份獨立 checkout；不要在未核對差異前覆寫 Drive 版本。
4. 修改行程基線主要用 `trip-data.json`；地點資料用 `places.json`；頁面互動用 `index.html` / `mobile.js`。保留已確認訂位，勿把私人 QR、登機證、取票碼、密碼或其他私人票券放入公開 repo。
5. 要讓所有人看到改動，還要把修改提交並推送到 GitHub `main`，等 GitHub Pages 顯示 `built`，再回讀公開網址確認。**只改 Google Drive 檔案不會自動更新公開網站。** 推送需要所用 GitHub 帳戶對 repo 有寫入權；Codex 帳戶本身不等於 GitHub 發布權限。

## 目前未接通的功能

網站內的選餐、待辦、備註及個人行程修改仍存在各裝置的瀏覽器 localStorage；私人票券在該瀏覽器 IndexedDB。它們不會因 Google Drive 同步原始碼而跨手機／Mac 同步。網頁直接寫回 Google Drive 的雙向同步暫停在 Google Cloud 帳戶持有人需自行接受服務條款之前；勿宣稱已完成。

## 可直接交給另一部 Mac 上 Codex 的提示

> 請接手 Google Drive「我的雲端硬碟/大阪之旅/osaka-trip-mobile」的大阪 LANY 2026 專案。先完整讀 HANDOFF.md，核對 GitHub main、trip-data.json revision、Drive 同步和 git status；不要使用另一部 Mac 的本機路徑或假設瀏覽器個人修改已同步。按我接下來的要求編輯，發布前先測試，推送後驗證 GitHub Pages 公開內容。勿上傳私人票券或密碼。

## 2026-10-03 MacBook 接手修復

本機測得 Drive 缺少 `.git/index` 並殘留舊 `index.lock`。完整備份後，確認沒有 Git 程序使用鎖檔，將舊鎖保留改名並以 `git read-tree HEAD` 重建 index；沒有重置或刪除工作檔。

這部 MacBook 的發布工作區：`~/Documents/ChatGPT/travel/osaka-trip-mobile`（獨立 checkout）。後續編輯優先使用本機獨立 checkout，Drive 用作可讀的工作檔鏡射；另一部 Mac 也應使用自己的 checkout，以免雲端同步互相覆蓋 Git index／鎖檔。不要同時在兩部機器寫入 Drive 的同一 `.git`。

revision 55 修正備註內的舊 R3 字眼，也對已儲存舊備註的瀏覽器作一次精確字串更新，保留其他個人備註及手動行程。

私人同步仍未驗收：本次 MacBook 實際登入指定帳戶後，Google Cloud 要求帳戶持有人啟用兩步驟驗證及接受首次使用條款；完成後才能配置行程專用 OAuth。
