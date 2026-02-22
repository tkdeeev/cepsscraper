import Papa from 'papaparse';

/**
 * Generic CSV loader from public folder.
 */
async function loadGenericCSV(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.statusText}`);
  const text = await response.text();
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

// --- Individual dataset loaders ---

export async function loadDAMPrices(currency) {
  const data = await loadGenericCSV(`/${currency}/dam_prices.csv`);
  return data.filter(r => r.date && r.hour != null && r.price != null);
}

export async function loadIMPrices(currency) {
  const data = await loadGenericCSV(`/${currency}/im_prices.csv`);
  return data.filter(r => r.date && r.hour != null && r.price != null);
}

export async function loadREPositive(currency) {
  const data = await loadGenericCSV(`/${currency}/re_positive.csv`);
  return data.filter(r => r.date && r.hour != null);
}

export async function loadRENegative(currency) {
  const data = await loadGenericCSV(`/${currency}/re_negative.csv`);
  return data.filter(r => r.date && r.hour != null);
}

export async function loadImbalances(currency) {
  const data = await loadGenericCSV(`/${currency}/imbalances.csv`);
  return data.filter(r => r.date && r.hour != null);
}

export async function loadGasPrices(currency) {
  const data = await loadGenericCSV(`/${currency}/gas_prices.csv`);
  return data.filter(r => r.date && r.price != null);
}

export async function loadDAMIndexes(currency) {
  const data = await loadGenericCSV(`/${currency}/dam_indexes.csv`);
  return data.filter(r => r.date);
}

/** Load all datasets in parallel. */
export async function loadAllData(currency = 'eur') {
  const [dam, im, rePos, reNeg, imbalances, gas, indexes] = await Promise.all([
    loadDAMPrices(currency),
    loadIMPrices(currency),
    loadREPositive(currency),
    loadRENegative(currency),
    loadImbalances(currency),
    loadGasPrices(currency),
    loadDAMIndexes(currency),
  ]);
  return { dam, im, rePos, reNeg, imbalances, gas, indexes };
}

// --- Legacy loaders (keep backward compat with existing components) ---

export async function loadCSV(url = '/dam_prices.csv') {
  return loadDAMPrices(currency);
}

export function filterByDateRange(data, startDate, endDate) {
  if (!startDate && !endDate) return data;
  return data.filter(row => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    return true;
  });
}

export function getUniqueDates(data) {
  const dates = [...new Set(data.map(r => r.date))];
  dates.sort();
  return dates;
}

// --- Smart Charging analytics ---

export function hoursPerDayBelowThreshold(data, threshold) {
  const map = {};
  data.forEach(row => {
    if (!map[row.date]) map[row.date] = { date: row.date, count: 0, totalHours: 0 };
    map[row.date].totalHours++;
    if (row.price != null && row.price < threshold) {
      map[row.date].count++;
    }
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function avgPriceByHour(data) {
  const hourMap = {};
  data.forEach(row => {
    if (row.price == null) return;
    if (!hourMap[row.hour]) hourMap[row.hour] = { sum: 0, count: 0 };
    hourMap[row.hour].sum += row.price;
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

export function dailyAveragePrice(data) {
  const map = {};
  data.forEach(row => {
    if (row.price == null) return;
    if (!map[row.date]) map[row.date] = { sum: 0, count: 0 };
    map[row.date].sum += row.price;
    map[row.date].count++;
  });
  return Object.entries(map)
    .map(([date, v]) => ({ date, avgPrice: +(v.sum / v.count).toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function monthlyStats(data) {
  const map = {};
  data.forEach(row => {
    if (row.price == null) return;
    const month = row.date.substring(0, 7);
    if (!map[month]) map[month] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    map[month].sum += row.price;
    map[month].count++;
    map[month].min = Math.min(map[month].min, row.price);
    map[month].max = Math.max(map[month].max, row.price);
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

export function negativePriceHoursByMonth(data) {
  const map = {};
  data.forEach(row => {
    const month = row.date.substring(0, 7);
    if (!map[month]) map[month] = { month, negativeHours: 0, zeroOrBelowHours: 0, totalHours: 0 };
    map[month].totalHours++;
    if (row.price != null) {
      if (row.price < 0) map[month].negativeHours++;
      if (row.price <= 0) map[month].zeroOrBelowHours++;
    }
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

export function priceHeatmapData(data) {
  const map = {};
  data.forEach(row => {
    if (row.price == null) return;
    const month = row.date.substring(0, 7);
    const key = `${month}-${row.hour}`;
    if (!map[key]) map[key] = { month, hour: row.hour, sum: 0, count: 0 };
    map[key].sum += row.price;
    map[key].count++;
  });
  return Object.values(map).map(v => ({
    month: v.month,
    hour: v.hour,
    avgPrice: +(v.sum / v.count).toFixed(2),
  }));
}

export function weekdayWeekendProfile(data) {
  const weekdayMap = {};
  const weekendMap = {};
  data.forEach(row => {
    if (row.price == null) return;
    const dayOfWeek = new Date(row.date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const target = isWeekend ? weekendMap : weekdayMap;
    if (!target[row.hour]) target[row.hour] = { sum: 0, count: 0 };
    target[row.hour].sum += row.price;
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

export function dailyVolatility(data) {
  const dayMap = {};
  data.forEach(row => {
    if (row.price == null) return;
    if (!dayMap[row.date]) dayMap[row.date] = [];
    dayMap[row.date].push(row.price);
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

export function cumulativeCheapHours(data, threshold) {
  const sorted = [...data]
    .filter(r => r.date && r.hour != null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
  const dayMap = {};
  let cumulative = 0;
  sorted.forEach(row => {
    if (row.price != null && row.price < threshold) {
      cumulative++;
    }
    dayMap[row.date] = cumulative;
  });
  return Object.entries(dayMap).map(([date, total]) => ({ date, totalCheapHours: total }));
}

export function computeSummary(data, threshold) {
  const prices = data.filter(r => r.price != null).map(r => r.price);
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

// --- Spark Spread analytics (Smart Charging model) ---

const CHARGING_HOURS = 8; // E-BRIX charges during cheapest N hours/day
const GAS_BOILER_EFF = 0.90; // Gas boiler converts 90% of fuel to heat

export function computeSparkSpread(damData, gasData, currency = 'eur') {
  // E-BRIX Smart Charging: only charges during the cheapest hours
  // Gas heat cost per MWh = (wholesale_gas_price + retail_distribution) / boiler_efficiency
  // Positive spread = E-BRIX electricity heating is cheaper than gas
  const elecByDay = {};
  damData.forEach(row => {
    if (row.price == null) return;
    if (!elecByDay[row.date]) elecByDay[row.date] = [];
    elecByDay[row.date].push(row.price);
  });

  const gasMap = {};
  gasData.forEach(row => {
    if (row.price != null) gasMap[row.date] = row.price;
  });

  const results = [];
  Object.entries(elecByDay).forEach(([date, prices]) => {
    const gasPrice = gasMap[date];
    if (gasPrice == null) return;
    
    // Gas retail distribution adder (approximate typical grid + capacity fees)
    const retailAdder = currency === 'eur' ? 40 : 1000; 
    
    // Sort prices ascending, take cheapest N hours
    const sorted = [...prices].sort((a, b) => a - b);
    const cheapest = sorted.slice(0, Math.min(CHARGING_HOURS, sorted.length));
    const avgCheap = cheapest.reduce((s, p) => s + p, 0) / cheapest.length;
    const avgAll = prices.reduce((s, p) => s + p, 0) / prices.length;
    
    const gasHeatCost = (gasPrice + retailAdder) / GAS_BOILER_EFF;
    
    results.push({
      date,
      gasHeatCost: +gasHeatCost.toFixed(2),
      gasPrice: +gasPrice.toFixed(2),
      elecSmartAvg: +avgCheap.toFixed(2),
      elecFullAvg: +avgAll.toFixed(2),
      sparkSpread: +(gasHeatCost - avgCheap).toFixed(2),
    });
  });
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export function monthlySparkSpread(sparkData) {
  const map = {};
  sparkData.forEach(row => {
    const month = row.date.substring(0, 7);
    if (!map[month]) map[month] = { gasHeat: 0, elecSmart: 0, spread: 0, elecFull: 0, count: 0 };
    map[month].gasHeat += row.gasHeatCost;
    map[month].elecSmart += row.elecSmartAvg;
    map[month].elecFull += row.elecFullAvg;
    map[month].spread += row.sparkSpread;
    map[month].count++;
  });
  return Object.entries(map)
    .map(([month, v]) => ({
      month,
      avgGasHeat: +(v.gasHeat / v.count).toFixed(2),
      avgElecSmart: +(v.elecSmart / v.count).toFixed(2),
      avgElecFull: +(v.elecFull / v.count).toFixed(2),
      avgSpread: +(v.spread / v.count).toFixed(2),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function cumulativeSavings(sparkData) {
  const sorted = [...sparkData].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  return sorted.map(row => {
    cumulative += row.sparkSpread;
    return { date: row.date, cumulativeSavings: +cumulative.toFixed(2) };
  });
}

// --- SVR / Regulation Energy analytics ---

export function reNegativeByHour(reNegData) {
  const hourMap = {};
  reNegData.forEach(row => {
    if (row.volume_mwh == null) return;
    if (!hourMap[row.hour]) hourMap[row.hour] = { sum: 0, count: 0 };
    hourMap[row.hour].sum += Math.abs(row.volume_mwh);
    hourMap[row.hour].count++;
  });
  return Array.from({ length: 24 }, (_, i) => {
    const h = i + 1;
    const entry = hourMap[h];
    return {
      hour: h,
      totalVolume: entry ? +(entry.sum).toFixed(2) : 0,
    };
  });
}

export function monthlySVRRevenue(reNegData) {
  // RE- costs: negative cost = revenue for E-BRIX (grid pays us to consume)
  //            positive cost = we pay for the regulation
  const map = {};
  reNegData.forEach(row => {
    const month = row.date.substring(0, 7);
    if (!map[month]) map[month] = { totalVolume: 0, revenue: 0, expense: 0 };
    if (row.volume_mwh != null) map[month].totalVolume += Math.abs(row.volume_mwh);
    if (row.cost != null) {
      const c = row.cost;
      if (c < 0) map[month].revenue += Math.abs(c);
      else map[month].expense += c;
    }
  });
  return Object.entries(map)
    .map(([month, v]) => ({
      month,
      totalVolume: +v.totalVolume.toFixed(1),
      revenue: +v.revenue.toFixed(0),
      expense: +v.expense.toFixed(0),
      netRevenue: +(v.revenue - v.expense).toFixed(0),
      avgPrice: v.totalVolume > 0 ? +(v.revenue / v.totalVolume).toFixed(2) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function imbalancePriceVolatility(imbalanceData) {
  // Collect all settlement prices for percentile clipping
  const allPrices = imbalanceData
    .filter(r => r.settlement_price != null)
    .map(r => r.settlement_price);
  allPrices.sort((a, b) => a - b);
  // Clip at P2 and P98 to remove extreme outliers
  const p2 = allPrices[Math.floor(allPrices.length * 0.02)] || -Infinity;
  const p98 = allPrices[Math.floor(allPrices.length * 0.98)] || Infinity;

  const dayMap = {};
  imbalanceData.forEach(row => {
    if (row.settlement_price == null) return;
    // Clip extreme values
    const price = Math.max(p2, Math.min(p98, row.settlement_price));
    if (!dayMap[row.date]) dayMap[row.date] = [];
    dayMap[row.date].push(price);
  });
  return Object.entries(dayMap)
    .map(([date, prices]) => {
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return {
        date,
        avgPrice: +avg.toFixed(2),
        minPrice: +min.toFixed(2),
        maxPrice: +max.toFixed(2),
        spread: +(max - min).toFixed(2),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// --- Cross Market analytics ---

export function damVsImSpread(damData, imData) {
  // Hourly: DAM price vs IM price
  const damMap = {};
  damData.forEach(row => {
    if (row.price != null) damMap[`${row.date}-${row.hour}`] = row.price;
  });

  const imMap = {};
  imData.forEach(row => {
    if (row.price != null) imMap[`${row.date}-${row.hour}`] = row.price;
  });

  // Daily averages
  const dayData = {};
  Object.keys(damMap).forEach(key => {
    const date = key.split('-').slice(0, 3).join('-');
    if (!dayData[date]) dayData[date] = { damSum: 0, imSum: 0, damCount: 0, imCount: 0 };
    dayData[date].damSum += damMap[key];
    dayData[date].damCount++;
    if (imMap[key] != null) {
      dayData[date].imSum += imMap[key];
      dayData[date].imCount++;
    }
  });

  return Object.entries(dayData)
    .filter(([, v]) => v.damCount > 0 && v.imCount > 0)
    .map(([date, v]) => ({
      date,
      damAvg: +(v.damSum / v.damCount).toFixed(2),
      imAvg: +(v.imSum / v.imCount).toFixed(2),
      spread: +((v.imSum / v.imCount) - (v.damSum / v.damCount)).toFixed(2),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function yearOverYearComparison(damData) {
  // Monthly avg by year
  const map = {};
  damData.forEach(row => {
    if (row.price == null) return;
    const year = row.date.substring(0, 4);
    const monthNum = row.date.substring(5, 7);
    const key = `${year}-${monthNum}`;
    if (!map[key]) map[key] = { year, month: parseInt(monthNum), sum: 0, count: 0 };
    map[key].sum += row.price;
    map[key].count++;
  });

  return Object.values(map)
    .map(v => ({
      year: v.year,
      month: v.month,
      avgPrice: +(v.sum / v.count).toFixed(2),
    }))
    .sort((a, b) => a.month - b.month || a.year.localeCompare(b.year));
}

export function peakVsOffpeak(indexData) {
  return indexData
    .filter(r => r.peak_load != null && r.offpeak_load != null)
    .map(r => ({
      date: r.date,
      peak: r.peak_load,
      offpeak: r.offpeak_load,
      spread: +(r.peak_load - r.offpeak_load).toFixed(2),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
