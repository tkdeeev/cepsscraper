import { useMemo } from 'react';
import { priceHeatmapData } from '../utils/dataLoader';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function priceToColor(price, min, max) {
    const ratio = Math.max(0, Math.min(1, (price - min) / (max - min || 1)));
    // Green (cheap) -> Yellow -> Red (expensive)
    if (ratio < 0.5) {
        const r = Math.round(ratio * 2 * 255);
        const g = 230;
        const b = Math.round((1 - ratio * 2) * 100);
        return `rgb(${r},${g},${b})`;
    } else {
        const r = 255;
        const g = Math.round((1 - (ratio - 0.5) * 2) * 230);
        const b = 50;
        return `rgb(${r},${g},${b})`;
    }
}

export default function PriceHeatmap({ data, currency }) {
    const heatData = useMemo(() => priceHeatmapData(data), [data]);

    const { months, priceMap, minPrice, maxPrice } = useMemo(() => {
        const months = [...new Set(heatData.map(d => d.month))].sort();
        const priceMap = {};
        let min = Infinity, max = -Infinity;
        heatData.forEach(d => {
            priceMap[`${d.month}-${d.hour}`] = d.avgPrice;
            min = Math.min(min, d.avgPrice);
            max = Math.max(max, d.avgPrice);
        });
        return { months, priceMap, minPrice: min, maxPrice: max };
    }, [heatData]);

    return (
        <div className="chart-card">
            <h3>🗓️ Price Heatmap: Hour × Month</h3>
            <p className="chart-subtitle">Average price matrix — green = cheapest windows for grid stabilization</p>
            <div className="heatmap-container">
                <div className="heatmap-grid" style={{ gridTemplateColumns: `50px repeat(${months.length}, 1fr)` }}>
                    {/* Header row */}
                    <div className="heatmap-label"></div>
                    {months.map(m => (
                        <div key={m} className="heatmap-header">
                            {MONTH_LABELS[parseInt(m.substring(5)) - 1]}<br />
                            <span className="heatmap-year">{m.substring(2, 4)}</span>
                        </div>
                    ))}

                    {/* Data rows — hour 1 to 24 */}
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                        <div key={hour} className="heatmap-row-fragment">
                            <div className="heatmap-label">{hour}:00</div>
                            {months.map(month => {
                                const price = priceMap[`${month}-${hour}`];
                                const color = price != null ? priceToColor(price, minPrice, maxPrice) : '#1e293b';
                                return (
                                    <div
                                        key={`${month}-${hour}`}
                                        className="heatmap-cell"
                                        style={{ backgroundColor: color }}
                                        title={`${month} H${hour}: ${price != null ? price + ` ${currency.toUpperCase()}/MWh` : 'N/A'}`}
                                    >
                                        {price != null && months.length <= 14 ? (
                                            <span className="heatmap-value">{price.toFixed(0)}</span>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="heatmap-legend">
                    <span>Cheap</span>
                    <div className="heatmap-legend-bar"></div>
                    <span>Expensive</span>
                </div>
            </div>
        </div>
    );
}
