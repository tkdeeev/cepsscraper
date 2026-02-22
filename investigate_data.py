"""Quick data investigation for E-BRIX dashboard issues."""
import csv

print("=" * 70)
print("1. DAM prices around 2025-10-05")
print("=" * 70)
with open('extracted_data/dam_prices.csv', 'r') as f:
    for row in csv.DictReader(f):
        if row['date'] >= '2025-10-03' and row['date'] <= '2025-10-07':
            p = row['price_eur']
            marker = " <-- LOW!" if p and float(p) < 0 else ""
            print(f"  {row['date']} h{int(row['hour']):>2}: {p:>10} EUR{marker}")

print()
print("=" * 70)
print("2. Spark Spread: E-BRIX charges at CHEAPEST hours, not average!")
print("=" * 70)

# Load DAM prices per day, sorted by price
dam_by_day = {}
with open('extracted_data/dam_prices.csv', 'r') as f:
    for row in csv.DictReader(f):
        if row['price_eur']:
            d = row['date']
            if d not in dam_by_day:
                dam_by_day[d] = []
            dam_by_day[d].append(float(row['price_eur']))

# Load gas prices
gas_prices = {}
with open('extracted_data/gas_prices.csv', 'r') as f:
    for row in csv.DictReader(f):
        if row['price_eur']:
            gas_prices[row['date']] = float(row['price_eur'])

# E-BRIX strategy: charge during the cheapest N hours per day
# Typical: 8 hours of charging per day (the cheapest ones)
CHARGING_HOURS = 8
BOILER_EFF = 0.90  # Gas boiler efficiency

print(f"  Strategy: charge during {CHARGING_HOURS} cheapest hours/day")
print(f"  Gas boiler efficiency: {BOILER_EFF*100:.0f}%")
print()
print(f"{'Date':>12} | {'Gas':>7} | {'Avg All':>8} | {'Avg Cheap':>9} | {'Simple':>8} | {'Smart':>8}")
print("-" * 70)

pos_smart = 0
total = 0
for d in sorted(gas_prices.keys())[:30]:
    if d not in dam_by_day:
        continue
    total += 1
    prices = sorted(dam_by_day[d])
    cheapest = prices[:min(CHARGING_HOURS, len(prices))]
    avg_all = sum(prices) / len(prices)
    avg_cheap = sum(cheapest) / len(cheapest)
    gas_heat_cost = gas_prices[d] / BOILER_EFF
    simple_spread = gas_prices[d] - avg_all
    smart_spread = gas_heat_cost - avg_cheap
    if smart_spread > 0:
        pos_smart += 1
    print(f"  {d} | {gas_prices[d]:7.2f} | {avg_all:8.2f} | {avg_cheap:9.2f} | {simple_spread:+8.2f} | {smart_spread:+8.2f}")

# Full count
pos_smart_total = 0
total_all = 0
for d in gas_prices:
    if d not in dam_by_day:
        continue
    total_all += 1
    prices = sorted(dam_by_day[d])
    cheapest = prices[:min(CHARGING_HOURS, len(prices))]
    avg_cheap = sum(cheapest) / len(cheapest)
    gas_heat_cost = gas_prices[d] / BOILER_EFF
    if gas_heat_cost > avg_cheap:
        pos_smart_total += 1

print(f"\n  Smart Spread positive: {pos_smart_total}/{total_all} ({100*pos_smart_total/total_all:.0f}%)")
print(f"  (E-BRIX charging at {CHARGING_HOURS} cheapest hours is cheaper than gas on {100*pos_smart_total/total_all:.0f}% of days)")

print()
print("=" * 70)
print("3. Imbalance extremes")
print("=" * 70)
extreme_count = 0
with open('extracted_data/imbalances.csv', 'r') as f:
    for row in csv.DictReader(f):
        if row['settlement_price_czk']:
            p = float(row['settlement_price_czk'])
            if abs(p) > 50000:
                extreme_count += 1
                if extreme_count <= 10:
                    print(f"  {row['date']} h{int(row['hour']):>2}: {p:>12.0f} CZK/MWh")
print(f"  Total extreme rows (|p| > 50,000): {extreme_count}")

print()
print("=" * 70)
print("4. RE- cost sign analysis")
print("=" * 70)
pos_cost = 0
neg_cost = 0
zero_cost = 0
with open('extracted_data/re_negative.csv', 'r') as f:
    for row in csv.DictReader(f):
        if row['cost_czk']:
            c = float(row['cost_czk'])
            if c > 0: pos_cost += 1
            elif c < 0: neg_cost += 1
            else: zero_cost += 1
print(f"  Positive cost: {pos_cost}")
print(f"  Negative cost: {neg_cost}")
print(f"  Zero cost: {zero_cost}")
print(f"  (For RE-, positive cost = money paid FOR regulation, negative = revenue received)")
