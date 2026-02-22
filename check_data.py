import csv
print('--- GAS PRICES (czk) ---')
with open('extracted_data/czk/gas_prices.csv') as f:
    for i, row in enumerate(csv.DictReader(f)):
        if i < 5 or i % 50 == 0:
            print(f"{row['date']} | Price: {row['price']} CZK | Vol: {row['volume_mwh']}")

print('\n--- RE NEGATIVE VOLUMES (czk) ---')
with open('extracted_data/czk/re_negative.csv') as f:
    for i, row in enumerate(csv.DictReader(f)):
        if i < 5 or (row['date'].startswith('2024-06-01') and int(row['hour'])<3):
            print(f"{row['date']} H{row['hour']} | Vol: {row['volume_mwh']} | Cost: {row['cost']}")

print('\n--- DAM INDEXES (BASE vs PEAK vs OFFPEAK) ---')
with open('extracted_data/czk/dam_indexes.csv') as f:
    for i, row in enumerate(csv.DictReader(f)):
        if i < 5 or row['date'] == '2025-05-01':
            print(f"{row['date']} | Base: {row['base_load']} | Peak: {row['peak_load']} | Off: {row['offpeak_load']}")
