import re

with open('dashboard/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add currency state and update effects
if 'const [currency, setCurrency]' not in content:
    content = content.replace(
        'const [allData, setAllData] = useState(null);',
        "const [currency, setCurrency] = useState('eur');\n    const [allData, setAllData] = useState(null);"
    )

content = content.replace(
    'loadAllData()',
    'setLoading(true);\n        loadAllData(currency)'
)

content = content.replace('}, []);', '}, [currency]);')

# 2. Add toggle in controls-bar
toggle = '''
                <div className="control-group">
                    <label>Currency</label>
                    <div className="toggle-buttons" style={{display: 'flex', gap: '4px'}}>
                        <button className={`tab-btn ${currency === 'eur' ? 'active' : ''}`} onClick={() => setCurrency('eur')} style={{padding: '4px 8px', fontSize: '0.8rem'}}>EUR</button>
                        <button className={`tab-btn ${currency === 'czk' ? 'active' : ''}`} onClick={() => setCurrency('czk')} style={{padding: '4px 8px', fontSize: '0.8rem'}}>CZK</button>
                    </div>
                </div>
'''

if 'Currency</label>' not in content:
    content = content.replace(
        '<div className="control-group">\n                    <label>Date Range</label>',
        toggle + '                <div className="control-group">\n                    <label>Date Range</label>'
    )

# 3. Inject currency={currency} into every component
comps = ['StatsCards', 'ThresholdAnalysis', 'DailyAverageChart', 'HourlyProfile', 'WeekdayWeekendChart', 'PriceHeatmap', 'MonthlyStats', 'NegativePriceAnalysis', 'VolatilityChart', 'CumulativeCheapHours', 'SparkSpreadChart', 'SVRRevenueChart', 'ImbalanceChart', 'DAMvsIMChart', 'YearOverYearChart', 'PeakOffpeakChart']

for comp in comps:
    # Match <Comp ...> but NOT if it already has currency=
    pattern = rf'<{comp}(?![^>]*currency=)'
    content = re.sub(pattern, f'<{comp} currency={{currency}}', content)

# 4. Replace EUR/MWh with {currency.toUpperCase()}/MWh inside App.jsx text labels
content = content.replace('Price Threshold (EUR/MWh)', 'Price Threshold ({currency.toUpperCase()}/MWh)')

with open('dashboard/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated App.jsx with currency toggle and props')
