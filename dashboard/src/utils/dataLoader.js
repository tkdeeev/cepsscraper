import Papa from 'papaparse';

/**
 * Load and parse the CSV file from public folder.
 * Returns array of objects: { date, hour, price_eur, volume_mwh, saldo_mwh, export_mwh, import_mwh }
 */
export async function loadCSV(url = '/ote_electricity_prices.csv') {
  const response = await fetch(url);
  const text = await response.text();
  
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  
  return result.data.filter(row => row.date && row.hour != null);
}

/**
 * Filter data by date range.
 */
export function filterByDateRange(data, startDate, endDate) {
  if (!startDate && !endDate) return data;
  return data.filter(row => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    return true;
  });
}

/**
 * Get unique sorted dates from data.
 */
export function getUniqueDates(data) {
  const dates = [...new Set(data.map(r => r.date))];
  dates.sort();
  return dates;
}

/**
 * Hours per day below threshold.
 */
export function hoursPerDayBelowThreshold(data, threshold) {
  const map = {};
  data.forEach(row => {
    if (!map[row.date]) map[row.date] = { date: row.date, count: 0, totalHours: 0 };
    map[row.date].totalHours++;
    if (row.price_eur != null && row.price_eur < threshold) {
      map[row.date].count++;
    }
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Average price by hour of day.
 */
export function avgPriceByHour(data) {
  const hourMap = {};
  data.forEach(row => {
    if (row.price_eur == null) return;
    if (!hourMap[row.hour]) hourMap[row.hour] = { sum: 0, count: 0 };
    hourMap[row.hour].sum += row.price_eur;
    hourMap[row.hour].count++;
  });
  return Array.from({ length: 24 }, (_, i) => {
    const h = i + 1;
    const entry = hourMap[h];
    return {
      hour: h,
      avgPrice: entry ? +(entry.sum / entry.count).toFixed(2) : 0,
    };
  });
}

/**
 * Daily average price.
 */
export function dailyAveragePrice(data) {
  const map = {};
  data.forEach(row => {
    if (row.price_eur == null) return;
    if (!map[row.date]) map[row.date] = { sum: 0, count: 0 };
    map[row.date].sum += row.price_eur;
    map[row.date].count++;
  });
  return Object.entries(map)
    .map(([date, v]) => ({ date, avgPrice: +(v.sum / v.count).toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Monthly statistics: avg, min, max prices.
 */
export function monthlyStats(data) {
  const map = {};
  data.forEach(row => {
    if (row.price_eur == null) return;
    const month = row.date.substring(0, 7); // YYYY-MM
    if (!map[month]) map[month] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    map[month].sum += row.price_eur;
    map[month].count++;
    map[month].min = Math.min(map[month].min, row.price_eur);
    map[month].max = Math.max(map[month].max, row.price_eur);
  });
  return Object.entries(map)
    .map(([month, v]) => ({
      month,
      avgPrice: +(v.sum / v.count).toFixed(2),
      minPrice: +v.min.toFixed(2),
      maxPrice: +v.max.toFixed(2),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Count of negative/zero price hours per month.
 */
export function negativePriceHoursByMonth(data) {
  const map = {};
  data.forEach(row => {
    const month = row.date.substring(0, 7);
    if (!map[month]) map[month] = { month, negativeHours: 0, zeroOrBelowHours: 0, totalHours: 0 };
    map[month].totalHours++;
    if (row.price_eur != null) {
      if (row.price_eur < 0) map[month].negativeHours++;
      if (row.price_eur <= 0) map[month].zeroOrBelowHours++;
    }
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Heatmap: avg price by hour × month.
 */
export function priceHeatmapData(data) {
  const map = {};
  data.forEach(row => {
    if (row.price_eur == null) return;
    const month = row.date.substring(0, 7);
    const key = `${month}-${row.hour}`;
    if (!map[key]) map[key] = { month, hour: row.hour, sum: 0, count: 0 };
    map[key].sum += row.price_eur;
    map[key].count++;
  });
  return Object.values(map).map(v => ({
    month: v.month,
    hour: v.hour,
    avgPrice: +(v.sum / v.count).toFixed(2),
  }));
}

/**
 * Weekday vs weekend avg price by hour.
 */
export function weekdayWeekendProfile(data) {
  const weekdayMap = {};
  const weekendMap = {};
  
  data.forEach(row => {
    if (row.price_eur == null) return;
    const dayOfWeek = new Date(row.date).getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const target = isWeekend ? weekendMap : weekdayMap;
    if (!target[row.hour]) target[row.hour] = { sum: 0, count: 0 };
    target[row.hour].sum += row.price_eur;
    target[row.hour].count++;
  });
  
  return Array.from({ length: 24 }, (_, i) => {
    const h = i + 1;
    const wd = weekdayMap[h];
    const we = weekendMap[h];
    return {
      hour: h,
      weekday: wd ? +(wd.sum / wd.count).toFixed(2) : 0,
      weekend: we ? +(we.sum / we.count).toFixed(2) : 0,
    };
  });
}

/**
 * Daily price volatility (standard deviation of hourly prices per day).
 */
export function dailyVolatility(data) {
  const dayMap = {};
  data.forEach(row => {
    if (row.price_eur == null) return;
    if (!dayMap[row.date]) dayMap[row.date] = [];
    dayMap[row.date].push(row.price_eur);
  });
  
  return Object.entries(dayMap)
    .map(([date, prices]) => {
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      const variance = prices.reduce((s, p) => s + (p - avg) ** 2, 0) / prices.length;
      const spread = Math.max(...prices) - Math.min(...prices);
      return {
        date,
        stdDev: +Math.sqrt(variance).toFixed(2),
        spread: +spread.toFixed(2),
        avg: +avg.toFixed(2),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Cumulative cheap-hours opportunity: running total of hours below threshold.
 */
export function cumulativeCheapHours(data, threshold) {
  const sorted = [...data]
    .filter(r => r.date && r.hour != null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
  
  const dayMap = {};
  let cumulative = 0;
  
  sorted.forEach(row => {
    if (row.price_eur != null && row.price_eur < threshold) {
      cumulative++;
    }
    dayMap[row.date] = cumulative;
  });
  
  return Object.entries(dayMap).map(([date, total]) => ({ date, totalCheapHours: total }));
}

/**
 * Summary statistics.
 */
export function computeSummary(data, threshold) {
  const prices = data.filter(r => r.price_eur != null).map(r => r.price_eur);
  if (prices.length === 0) return {};
  
  const sum = prices.reduce((s, p) => s + p, 0);
  const avg = sum / prices.length;
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  return {
    avgPrice: +avg.toFixed(2),
    medianPrice: +median.toFixed(2),
    minPrice: +Math.min(...prices).toFixed(2),
    maxPrice: +Math.max(...prices).toFixed(2),
    totalHours: prices.length,
    hoursBelowThreshold: prices.filter(p => p < threshold).length,
    pctBelowThreshold: +((prices.filter(p => p < threshold).length / prices.length) * 100).toFixed(1),
    negativeHours: prices.filter(p => p < 0).length,
    totalDays: new Set(data.map(r => r.date)).size,
  };
}
