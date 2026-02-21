# OTE-CR Czech Electricity Price Scraper

Scrapes daily hourly electricity prices from the Czech [OTE-CR Day-Ahead Market](https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh).

## Data Collected

For each hour (1–24) of each day:

| Column       | Description                        |
|--------------|------------------------------------|
| `date`       | Date (YYYY-MM-DD)                  |
| `hour`       | Delivery hour (1–24)               |
| `price_eur`  | Day-ahead price (EUR/MWh)          |
| `volume_mwh` | Traded volume (MWh)                |
| `saldo_mwh`  | Net balance / Saldo DT (MWh)       |
| `export_mwh` | Export (MWh)                       |
| `import_mwh` | Import (MWh)                       |

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
# Scrape the full year 2025 (default)
python scraper.py

# Custom date range
python scraper.py --start 2025-01-01 --end 2025-06-30

# Output CSV only
python scraper.py --format csv --output my_prices

# Resume a previously interrupted scrape (SQLite only)
python scraper.py --resume

# Adjust request delay (default 1 second)
python scraper.py --delay 2.0
```

## Output

By default, creates both:
- `ote_electricity_prices.csv` — flat CSV file
- `ote_electricity_prices.db` — SQLite database with indexed `electricity_prices` table

## Notes

- The scraper adds a 1-second delay between requests by default to avoid overloading the server.
- DST transition days may have 23 or 25 hours — the scraper handles this naturally.
- Use `--resume` to continue a previously interrupted scrape (skips dates already in the DB).
