# Credit Risk Intelligence System

信用卡違約預測・催收策略優化 Dashboard

## 📁 專案結構

```
credit_risk_project/
├── app.py                   # Flask 主程式 + API 邏輯
├── requirements.txt
├── templates/
│   └── index.html           # Jinja2 模板（Home / Dashboard / About）
└── static/
    ├── css/
    │   └── style.css        # 所有樣式
    ├── js/
    │   └── main.js          # 前端互動邏輯（fetch API）
    └── img/
        └── hero.jpg         # 首頁背景圖
```

## 🚀 啟動方式

### 1. 建立虛擬環境（建議）
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate
```

### 2. 安裝套件
```bash
pip install -r requirements.txt
```

### 3. 啟動伺服器
```bash
python app.py
```

開啟瀏覽器前往：http://localhost:5000

---

## 🔧 客製化指南

### 修改首頁背景圖
將新圖片放到 `static/img/` 資料夾，並在 `static/css/style.css` 修改：
```css
.home-bg {
  background-image: url('/static/img/your_image.jpg');
}
```

### 修改風險模型邏輯
編輯 `app.py` 裡的 `calc_risk()` 函數。

### 新增頁面
1. 在 `templates/index.html` 新增 `<div class="page" id="page-xxx">` 區塊
2. 在 sidenav 新增對應的 `.nav-item`
3. 如需 API 支援，在 `app.py` 新增 `@app.route('/api/xxx')` 路由

### 修改樣式
所有 CSS 變數定義在 `static/css/style.css` 頂部的 `:root {}` 區塊，修改後即時生效。

---

## 🌐 API 端點

### `POST /api/risk`
計算違約機率並回傳分析結果

**Request Body (JSON):**
```json
{
  "limit": 50000,
  "age": 25,
  "sex": "female",
  "edu": "uni",
  "mar": "single",
  "pay": 0,
  "hist": 0,
  "util": 30
}
```

**Response (JSON):**
```json
{
  "prob": 18,
  "label": "優質低風險客戶",
  "label_level": "safe",
  "quadrant": "lh",
  "quad_info": { "title": "...", "desc": "...", "action": "..." },
  "factors": [...],
  "history": [...]
}
```
