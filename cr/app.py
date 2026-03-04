from flask import Flask, render_template, jsonify, request
import math

app = Flask(__name__)

# ── 風險評估邏輯 ──────────────────────────────────────────────
def calc_risk(limit, age, sex, edu, mar, pay, hist, util):
    score = -2.5
    score += (1 - min(limit, 300000) / 300000) * 1.8

    if age < 25:
        score += 0.8
    elif age < 30:
        score += 0.3
    elif age <= 45:
        score -= 0.3

    if sex == 'male':
        score += 0.4

    if edu == 'grad':
        score -= 0.5
    elif edu == 'uni':
        score -= 0.2
    elif edu == 'hs':
        score += 0.3
    else:
        score += 0.5

    if mar == 'married':
        score += 0.2

    score += pay * 0.9
    score += hist * 0.5
    score += (util / 100) * 1.2

    prob = round((1 / (1 + math.exp(-score))) * 100)
    return prob


# ── 路由 ──────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/risk', methods=['POST'])
def risk_api():
    """JSON API：計算違約機率，回傳結構化結果"""
    data = request.get_json()

    limit = float(data.get('limit', 50000))
    age   = int(data.get('age', 25))
    sex   = data.get('sex', 'female')
    edu   = data.get('edu', 'uni')
    mar   = data.get('mar', 'single')
    pay   = int(data.get('pay', 0))
    hist  = int(data.get('hist', 0))
    util  = float(data.get('util', 30))

    prob = calc_risk(limit, age, sex, edu, mar, pay, hist, util)

    # 自動標籤
    if prob < 25:
        label = '優質低風險客戶'
        label_level = 'safe'
    elif prob < 50:
        label = '觀察中風險客戶'
        label_level = 'warn'
    elif prob < 70:
        label = '高風險 — 自動化催收'
        label_level = 'danger'
    else:
        label = '極高風險 — 人工介入'
        label_level = 'danger'

    # 四象限
    is_high = prob >= 50
    is_high_amt = limit >= 100000
    if is_high and is_high_amt:
        quadrant = 'hh'
    elif is_high and not is_high_amt:
        quadrant = 'hl'
    elif not is_high and is_high_amt:
        quadrant = 'll'
    else:
        quadrant = 'lh'

    quad_info = {
        'hh': {'title': '高風險 × 高金額', 'desc': '優先人工催收。違約機率高且潛在損失大，應立即由人工催收團隊跟進，必要時啟動法律程序。', 'action': '→ 立即人工介入'},
        'hl': {'title': '高風險 × 低金額', 'desc': '違約機率高但金額小，人工催收 ROI 極低。建議 App 推播、簡訊自動化等低成本方式。', 'action': '→ 自動化催收'},
        'll': {'title': '低風險 × 高金額', 'desc': '違約機率低，金額較大，需定期監控。透過預防性提醒郵件、優惠方案維繫客戶。', 'action': '→ 定期監控提醒'},
        'lh': {'title': '低風險 × 低金額', 'desc': '風險低且金額小，催收資源投入不具效益。設為觀察清單，等待狀態變化再行動。', 'action': '→ 觀察即可'},
    }

    # 主要因子
    factors = [
        {'name': '信用額度偏低', 'w': round((1 - min(limit, 300000) / 300000) * 100), 'dir': 'risk'},
        {'name': '還款紀錄',    'w': max(0, round((1 - (pay + 2) / 5) * 100)),        'dir': 'safe' if pay <= 0 else 'risk'},
        {'name': '逾期次數',    'w': round((hist / 6) * 100),                          'dir': 'risk'},
        {'name': '額度使用率',  'w': int(util),                                        'dir': 'risk' if util > 60 else 'safe'},
    ]

    # 歷史特徵
    history = [
        {'k': 'LIMIT_BAL', 'v': '違約者多集中低額度群體'},
        {'k': 'SEX',       'v': '女性屬非違約高佔比群' if sex == 'female' else '男性違約率略高'},
        {'k': 'EDUCATION', 'v': '研究所違約率最低' if edu == 'grad' else ('高中違約率偏高' if edu == 'hs' else '大學學歷中等')},
        {'k': 'AGE',       'v': '18–24歲高風險層' if age < 25 else ('30–45歲較安全' if age <= 45 else '45歲以上趨穩')},
        {'k': 'PAY_X',     'v': '準時還款最重要安全指標' if pay <= 0 else f'逾期{pay}月，風險顯著升'},
        {'k': 'MARRIAGE',  'v': '單身違約風險較低' if mar == 'single' else '已婚略高'},
    ]

    return jsonify({
        'prob': prob,
        'label': label,
        'label_level': label_level,
        'quadrant': quadrant,
        'quad_info': quad_info[quadrant],
        'factors': factors,
        'history': history,
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
