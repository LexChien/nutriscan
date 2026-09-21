# NutriScan

台灣包裝食品營養標籤解碼。拍標籤、看紅黃綠、依控糖／低鈀／增肌／兒童點心給建議。

## 本機執行

```bash
python3 -m http.server 8765
# 開 http://127.0.0.1:8765/
```

## 上線 GitHub Pages

1. Repo Settings → Pages → Source 選 **GitHub Actions**
2. 推 main 後 workflow `Deploy GitHub Pages` 會發佈
3. 網址：https://lexchien.github.io/nutriscan/

也可直接拖到 Cloudflare Pages / Netlify / Vercel（靜態網站，無建置指令）。

## 架構

- `js/store.js` 帳號、額度、試用、序號開通（localStorage）
- `js/engine.js` 紅黃綠分級、目標建議、標示文字解析、OCR
- `js/views.js` 落地頁與各畫面
- `js/app.js` 路由與事件

開通序號：`NUTRI-PRO-2026`、`NUTRI-FAM-2026`、`NUTRI-MONTH`
