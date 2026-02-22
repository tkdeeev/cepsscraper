import os, re

def fix_jsx_template_strings(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find cases where {currency.toUpperCase()} is directly inside backticks but missing the $
    # i.e. `... {currency.toUpperCase()} ...`
    # We want to replace it with: `... ${currency.toUpperCase()} ...`
    
    # We can just blindly replace " {currency.toUpperCase()}" with " ${currency.toUpperCase()}" 
    # IF it's inside a backtick string. But the easiest safe replacement is:
    content = content.replace("` {currency.toUpperCase()}", "`${currency.toUpperCase()}")
    content = content.replace(" `${v} {currency.toUpperCase()}", " `${v} ${currency.toUpperCase()}")
    content = content.replace("[`${v} {currency.toUpperCase()}", "[`${v} ${currency.toUpperCase()}")
    content = content.replace(" {currency.toUpperCase()}/MWh`", " ${currency.toUpperCase()}/MWh`")
    content = content.replace(" {currency.toUpperCase()}`", " ${currency.toUpperCase()}`")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for fn in os.listdir('dashboard/src/components'):
    if fn.endswith('.jsx'):
        fix_jsx_template_strings(os.path.join('dashboard/src/components', fn))

print('Fixed JSX literal template bugs!')
