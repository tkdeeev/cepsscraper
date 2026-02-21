import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { avgPriceByHour } from '../utils/dataLoader';

export default function HourlyProfile({ data }) {
    const chartData = useMemo(() => avgPriceByHour(data), [data]);

    const minPrice = Math.min(...chartData.map(d => d.avgPrice));
    const maxPrice = Math.max(...chartData.map(d => d.avgPrice));

    const getBarColor = (price) => {
        const ratio = (price - minPrice) / (maxPrice - minPrice || 1);
        if (ratio < 0.3) return '#00e676';
        if (ratio < 0.6) return '#ffd740';
        return '#ff5252';
    };

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">Hour {d.hour}:00 – {d.hour}:59</p>
                <p>Average price: <strong>{d.avgPrice} EUR/MWh</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>🕐 Average Price by Hour of Day</h3>
            <p className="chart-subtitle">Identifies cheapest daily windows — green = cheapest, red = most expensive</p>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="avgPrice" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getBarColor(entry.avgPrice)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
