import os

REPLACEMENTS = {
    'price_eur': 'price',
    'cost_czk': 'cost',
    'settlement_price_czk': 'settlement_price',
    'min_price_eur': 'min_price',
    'max_price_eur': 'max_price',
    'counter_price_czk': 'counter_price',
    'index_ote_eur': 'index_ote',
    'peak_load_eur': 'peak_load',
    'offpeak_load_eur': 'offpeak_load',
    "loadGenericCSV('/dam_prices.csv')": "loadGenericCSV(`/${currency}/dam_prices.csv`)",
    "loadGenericCSV('/im_prices.csv')": "loadGenericCSV(`/${currency}/im_prices.csv`)",
    "loadGenericCSV('/re_positive.csv')": "loadGenericCSV(`/${currency}/re_positive.csv`)",
    "loadGenericCSV('/re_negative.csv')": "loadGenericCSV(`/${currency}/re_negative.csv`)",
    "loadGenericCSV('/imbalances.csv')": "loadGenericCSV(`/${currency}/imbalances.csv`)",
    "loadGenericCSV('/gas_prices.csv')": "loadGenericCSV(`/${currency}/gas_prices.csv`)",
    "loadGenericCSV('/dam_indexes.csv')": "loadGenericCSV(`/${currency}/dam_indexes.csv`)",
    'loadDAMPrices()': "loadDAMPrices(currency)",
    'loadIMPrices()': "loadIMPrices(currency)",
    'loadREPositive()': "loadREPositive(currency)",
    'loadRENegative()': "loadRENegative(currency)",
    'loadImbalances()': "loadImbalances(currency)",
    'loadGasPrices()': "loadGasPrices(currency)",
    'loadDAMIndexes()': "loadDAMIndexes(currency)",
    'loadAllData()': "loadAllData(currency = 'eur')"
}

def update_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pre-process for dataLoader.js
    if 'dataLoader.js' in path:
        content = content.replace('export async function loadDAMPrices()', 'export async function loadDAMPrices(currency)')
        content = content.replace('export async function loadIMPrices()', 'export async function loadIMPrices(currency)')
        content = content.replace('export async function loadREPositive()', 'export async function loadREPositive(currency)')
        content = content.replace('export async function loadRENegative()', 'export async function loadRENegative(currency)')
        content = content.replace('export async function loadImbalances()', 'export async function loadImbalances(currency)')
        content = content.replace('export async function loadGasPrices()', 'export async function loadGasPrices(currency)')
        content = content.replace('export async function loadDAMIndexes()', 'export async function loadDAMIndexes(currency)')

    for old, new in REPLACEMENTS.items():
        content = content.replace(old, new)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('dashboard/src/utils/dataLoader.js')

for file in os.listdir('dashboard/src/components'):
    if file.endswith('.jsx'):
        update_file(os.path.join('dashboard/src/components', file))

print('Updated column references globally!')
