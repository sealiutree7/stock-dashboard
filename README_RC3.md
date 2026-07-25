# Anjou Terminal v5.0 RC3 Theme Name Fix

這版只修 UI 題材名稱連在一起的問題：
- 題材地圖內個股名稱改成獨立 pill。
- CSS 強制 theme-symbols 使用 flex + gap。
- 不動 Worker、不動資料計算，避免再造成新問題。

需要更新 GitHub：
- frontend/app.js
- frontend/style.css

VIXTWN / 景氣燈號說明：
- 目前程式已能呼叫 Worker，但 VIXTWN 的來源 TWSE MIS / WantGoo 對 Worker 回傳不可解析或阻擋。
- 景氣燈號正式 API 目前沒有成功解析，只能顯示備援值；這需要確認國發會可用 endpoint/欄位後才能真正完成。
