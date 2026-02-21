"""
OTE-CR Czech Electricity Day-Ahead Market Scraper
==================================================
Scrapes hourly electricity prices and market data from the Czech OTE
(Operátor trhu s elektřinou) day-ahead market for a full year.

Source (old format, before 2025-10-01):
  https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh
Source (new format, from 2025-10-01):
  https://www.ote-cr.cz/en/short-term-markets/electricity/day-ahead-market

Output columns:
  - date        : YYYY-MM-DD
  - hour        : 1-24 (delivery hour)
  - price_eur   : Day-ahead price in EUR/MWh
  - volume_mwh  : Traded volume in MWh
  - saldo_mwh   : Net balance (Saldo DT) in MWh
  - export_mwh  : Export in MWh
  - import_mwh  : Import in MWh

Usage:
  python scraper.py                          # scrape full year 2025
  python scraper.py --start 2025-01-01 --end 2025-12-31
  python scraper.py --start 2025-06-01 --end 2025-06-30 --output prices.csv
"""

import argparse
import csv
import json
import logging
import os
import re
import sqlite3
import sys
import time
from datetime import date, datetime, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup

# ─── Configuration ──────────────────────────────────────────────────────────────

# Old format (Czech page, before 2025-10-01)
BASE_URL_OLD = "https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh"
# New format (English page, from 2025-10-01)
BASE_URL_NEW = "https://www.ote-cr.cz/en/short-term-markets/electricity/day-ahead-market"

# Date when OTE-CR switched to the new page format
NEW_FORMAT_DATE = date(2025, 10, 1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "cs,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

REQUEST_DELAY = 1.0        # seconds between requests (be polite)
MAX_RETRIES = 3
RETRY_DELAY = 5.0          # seconds to wait before retrying a failed request

CSV_COLUMNS = ["date", "hour", "price_eur", "volume_mwh", "saldo_mwh", "export_mwh", "import_mwh"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


# ─── Parsing helpers ────────────────────────────────────────────────────────────

def parse_czech_number(text: str) -> Optional[float]:
    """
    Parse a Czech-formatted number string.
    Czech uses comma as decimal separator and space as thousands separator.
    Examples: '2 145,6' -> 2145.6, '-0,56' -> -0.56, '92,87' -> 92.87
    """
    if text is None:
        return None
    text = text.strip()
    if not text or text == "-":
        return None
    # Remove non-breaking spaces and regular spaces (thousands separator)
    text = text.replace("\xa0", "").replace(" ", "")
    # Replace comma with dot for decimal
    text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def parse_hour_interval(text: str) -> Optional[int]:
    """
    Parse hour from both old format ('1', '2', ..., '24') and
    new format ('00-01', '01-02', ..., '23-24').
    Returns hour as 1-24 integer.
    """
    text = text.strip()
    # New format: "00-01" -> 1, "23-24" -> 24
    match = re.match(r"^(\d{2})-(\d{2})$", text)
    if match:
        return int(match.group(2))  # end hour
    # Old format: plain integer
    try:
        return int(text)
    except ValueError:
        return None


def scrape_date_html_old(session: requests.Session, target_date: date) -> list[dict]:
    """
    Scrape the OLD Czech page format (before 2025-10-01).
    Table has: Hodina | Cena (EUR/MWh) | Množství (MWh) | Saldo DT (MWh) | Export (MWh) | Import (MWh)
    """
    date_str = target_date.strftime("%Y-%m-%d")
    url = f"{BASE_URL_OLD}?date={date_str}"

    resp = session.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    tables = soup.find_all("table", class_="report_table")
    if not tables:
        log.warning(f"No data tables found for {date_str}")
        return []

    # Find the table with "Hodina" header
    data_table = None
    for table in tables:
        header = table.find("th", string=re.compile(r"Hodina"))
        if header:
            data_table = table
            break

    if data_table is None:
        data_table = tables[-1] if len(tables) > 1 else tables[0]

    rows = data_table.find("tbody").find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all(["th", "td"])
        if not cells:
            continue

        hour_text = cells[0].get_text(strip=True)
        if hour_text.lower() in ("celkem", "total", "sum", ""):
            continue

        hour = parse_hour_interval(hour_text)
        if hour is None:
            continue

        # Old format columns: Price, Volume, Saldo, Export, Import
        td_cells = [c for c in cells[1:] if c.name == "td"]

        record = {
            "date": date_str,
            "hour": hour,
            "price_eur": parse_czech_number(td_cells[0].get_text()) if len(td_cells) > 0 else None,
            "volume_mwh": parse_czech_number(td_cells[1].get_text()) if len(td_cells) > 1 else None,
            "saldo_mwh": parse_czech_number(td_cells[2].get_text()) if len(td_cells) > 2 else None,
            "export_mwh": parse_czech_number(td_cells[3].get_text()) if len(td_cells) > 3 else None,
            "import_mwh": parse_czech_number(td_cells[4].get_text()) if len(td_cells) > 4 else None,
        }
        results.append(record)

    return results


def scrape_date_html_new(session: requests.Session, target_date: date) -> list[dict]:
    """
    Scrape the NEW English page format (from 2025-10-01).
    URL includes time_resolution=PT60M.
    Table has: Time interval | 60min price (EUR/MWh) | Volume (MWh) |
               Purchase 15min | Purchase 60min | Sale 15min | Sale 60min |
               Saldo DM (MWh) | Export (MWh) | Import (MWh)
    """
    date_str = target_date.strftime("%Y-%m-%d")
    url = f"{BASE_URL_NEW}?date={date_str}&time_resolution=PT60M"

    resp = session.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    tables = soup.find_all("table", class_="report_table")
    if not tables:
        log.warning(f"No data tables found for {date_str}")
        return []

    # Find the table with "Time interval" header (new format)
    data_table = None
    for table in tables:
        header = table.find("th", string=re.compile(r"Time interval", re.IGNORECASE))
        if header:
            data_table = table
            break

    if data_table is None:
        # Fallback: try table with the most rows (skip the index table)
        data_table = tables[-1] if len(tables) > 1 else tables[0]

    tbody = data_table.find("tbody")
    if tbody is None:
        log.warning(f"No tbody found for {date_str}")
        return []

    rows = tbody.find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all(["th", "td"])
        if not cells:
            continue

        hour_text = cells[0].get_text(strip=True)
        if hour_text.lower() in ("celkem", "total", "sum", ""):
            continue

        hour = parse_hour_interval(hour_text)
        if hour is None:
            continue

        # New format columns (all <td> after the first cell):
        # [0] 60min price (EUR/MWh)
        # [1] Volume (MWh)
        # [2] Purchase 15min products (MWh)  <- skip
        # [3] Purchase 60min products (MWh)  <- skip
        # [4] Sale 15min products (MWh)      <- skip
        # [5] Sale 60min products (MWh)      <- skip
        # [6] Saldo DM (MWh)
        # [7] Export (MWh)
        # [8] Import (MWh)
        td_cells = [c for c in cells[1:] if c.name == "td"]

        record = {
            "date": date_str,
            "hour": hour,
            "price_eur": parse_czech_number(td_cells[0].get_text()) if len(td_cells) > 0 else None,
            "volume_mwh": parse_czech_number(td_cells[1].get_text()) if len(td_cells) > 1 else None,
            "saldo_mwh": parse_czech_number(td_cells[6].get_text()) if len(td_cells) > 6 else None,
            "export_mwh": parse_czech_number(td_cells[7].get_text()) if len(td_cells) > 7 else None,
            "import_mwh": parse_czech_number(td_cells[8].get_text()) if len(td_cells) > 8 else None,
        }
        results.append(record)

    return results


def scrape_date_html(session: requests.Session, target_date: date) -> list[dict]:
    """
    Dispatch to the correct scraping function based on the date.
    The OTE-CR website changed format on 2025-10-01.
    """
    if target_date >= NEW_FORMAT_DATE:
        return scrape_date_html_new(session, target_date)
    else:
        return scrape_date_html_old(session, target_date)


def scrape_date_with_retry(session: requests.Session, target_date: date) -> list[dict]:
    """Scrape a single date with retries on failure."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return scrape_date_html(session, target_date)
        except requests.RequestException as e:
            log.warning(f"Attempt {attempt}/{MAX_RETRIES} failed for {target_date}: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                log.error(f"All {MAX_RETRIES} attempts failed for {target_date}")
                return []
    return []


# ─── Output: CSV ────────────────────────────────────────────────────────────────

def init_csv(filepath: str) -> None:
    """Create or overwrite the CSV file with headers."""
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()


def append_csv(filepath: str, records: list[dict]) -> None:
    """Append records to the CSV file."""
    with open(filepath, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writerows(records)


# ─── Output: SQLite ─────────────────────────────────────────────────────────────

def init_sqlite(filepath: str) -> sqlite3.Connection:
    """Create the SQLite database and table if they don't exist."""
    conn = sqlite3.connect(filepath)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS electricity_prices (
            date        TEXT NOT NULL,
            hour        INTEGER NOT NULL,
            price_eur   REAL,
            volume_mwh  REAL,
            saldo_mwh   REAL,
            export_mwh  REAL,
            import_mwh  REAL,
            PRIMARY KEY (date, hour)
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_date ON electricity_prices(date)
    """)
    conn.commit()
    return conn


def upsert_sqlite(conn: sqlite3.Connection, records: list[dict]) -> None:
    """Insert or replace records in the SQLite database."""
    conn.executemany("""
        INSERT OR REPLACE INTO electricity_prices
            (date, hour, price_eur, volume_mwh, saldo_mwh, export_mwh, import_mwh)
        VALUES
            (:date, :hour, :price_eur, :volume_mwh, :saldo_mwh, :export_mwh, :import_mwh)
    """, records)
    conn.commit()


def get_scraped_dates(conn: sqlite3.Connection) -> set[str]:
    """Get all dates that already have data in the database."""
    cursor = conn.execute("SELECT DISTINCT date FROM electricity_prices")
    return {row[0] for row in cursor.fetchall()}


# ─── Main ────────────────────────────────────────────────────────────────────────

def date_range(start: date, end: date):
    """Generate dates from start to end (inclusive)."""
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Czech electricity day-ahead market prices from OTE-CR"
    )
    parser.add_argument(
        "--start", type=str, default="2025-01-01",
        help="Start date in YYYY-MM-DD format (default: 2025-01-01)"
    )
    parser.add_argument(
        "--end", type=str, default="2025-12-31",
        help="End date in YYYY-MM-DD format (default: 2025-12-31)"
    )
    parser.add_argument(
        "--output", type=str, default="ote_electricity_prices",
        help="Output filename without extension (default: ote_electricity_prices)"
    )
    parser.add_argument(
        "--format", type=str, choices=["csv", "sqlite", "both"], default="both",
        help="Output format: csv, sqlite, or both (default: both)"
    )
    parser.add_argument(
        "--delay", type=float, default=REQUEST_DELAY,
        help=f"Delay between requests in seconds (default: {REQUEST_DELAY})"
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Skip dates that already exist in the SQLite database"
    )

    args = parser.parse_args()

    start_date = datetime.strptime(args.start, "%Y-%m-%d").date()
    end_date = datetime.strptime(args.end, "%Y-%m-%d").date()
    total_days = (end_date - start_date).days + 1

    log.info(f"Scraping OTE-CR day-ahead market data from {start_date} to {end_date} ({total_days} days)")

    # Initialize outputs
    csv_path = f"{args.output}.csv"
    db_path = f"{args.output}.db"

    conn = None
    scraped_dates: set[str] = set()

    if args.format in ("sqlite", "both"):
        conn = init_sqlite(db_path)
        if args.resume:
            scraped_dates = get_scraped_dates(conn)
            log.info(f"Resume mode: found {len(scraped_dates)} dates already scraped")

    if args.format in ("csv", "both") and not args.resume:
        init_csv(csv_path)

    # Create session for connection reuse
    session = requests.Session()
    session.headers.update(HEADERS)

    scraped_count = 0
    skipped_count = 0
    error_count = 0

    for i, current_date in enumerate(date_range(start_date, end_date), 1):
        date_str = current_date.strftime("%Y-%m-%d")

        # Skip already-scraped dates in resume mode
        if date_str in scraped_dates:
            skipped_count += 1
            continue

        log.info(f"[{i}/{total_days}] Scraping {date_str}...")
        records = scrape_date_with_retry(session, current_date)

        if records:
            if args.format in ("csv", "both"):
                append_csv(csv_path, records)
            if conn is not None:
                upsert_sqlite(conn, records)
            scraped_count += 1
            log.info(f"  -> {len(records)} hours recorded")
        else:
            error_count += 1
            log.warning(f"  -> No data for {date_str}")

        # Rate limit — don't hammer the server
        if i < total_days:
            time.sleep(args.delay)

    # Close database
    if conn is not None:
        conn.close()

    # Summary
    log.info("=" * 60)
    log.info(f"Scraping complete!")
    log.info(f"  Days scraped:  {scraped_count}")
    log.info(f"  Days skipped:  {skipped_count}")
    log.info(f"  Days failed:   {error_count}")
    if args.format in ("csv", "both"):
        log.info(f"  CSV output:    {os.path.abspath(csv_path)}")
    if args.format in ("sqlite", "both"):
        log.info(f"  SQLite output: {os.path.abspath(db_path)}")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
