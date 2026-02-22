import os, re

def process_component(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add currency to props if not there
    m = re.search(r'export default function \w+\(\{\s*([^}]+)\s*\}\)', content)
    if m:
        props_str = m.group(1)
        if 'currency' not in props_str:
            new_props_str = props_str + ', currency'
            content = content.replace(m.group(0), m.group(0).replace(props_str, new_props_str))
    
    # 1. JSX string replacements
    content = content.replace(' EUR/MWh', ' {currency.toUpperCase()}/MWh')
    content = content.replace(' CZK/MWh', ' {currency.toUpperCase()}/MWh')
    content = content.replace(' EUR</', ' {currency.toUpperCase()}</')
    content = content.replace(' CZK</', ' {currency.toUpperCase()}</')

    # 2. String literal replacements (tick formatters, label values)
    content = content.replace("'EUR/MWh'", "`${currency.toUpperCase()}/MWh`")
    content = content.replace("'CZK/MWh'", "`${currency.toUpperCase()}/MWh`")
    content = content.replace('"EUR/MWh"', "`${currency.toUpperCase()}/MWh`")
    content = content.replace('"CZK/MWh"', "`${currency.toUpperCase()}/MWh`")

    # 3. Template string inside [`${v} EUR/MWh`]
    content = content.replace("EUR/MWh`", "${currency.toUpperCase()}/MWh`")
    content = content.replace("CZK/MWh`", "${currency.toUpperCase()}/MWh`")
    
    # 4. Stray currency postfixes in formatters
    content = content.replace("EUR`", "${currency.toUpperCase()}`")
    content = content.replace("CZK`", "${currency.toUpperCase()}`")

    # 5. Some components have text like 'M CZK' (millions)
    content = content.replace('M CZK', 'M {currency.toUpperCase()}')
    content = content.replace('M EUR', 'M {currency.toUpperCase()}')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for fn in os.listdir('dashboard/src/components'):
    if fn.endswith('.jsx'):
        process_component(os.path.join('dashboard/src/components', fn))

print('Chart components updated to accept currency prop!')
