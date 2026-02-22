import { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine
} from 'recharts';
import { dailyAveragePrice } from '../utils/dataLoader';

export default function DailyAverageChart({ data, threshold , currency}) {
    const chartData = useMemo(() => dailyAveragePrice(data), [data]);

    // 7-day moving average
    const withMA = useMemo(() => {
        return chartData.map((item, i) => {
            const start = Math.max(0, i - 6);
            const window = chartData.slice(start, i + 1);
            const ma = window.reduce((s, w) => s + w.avgPrice, 0) / window.length;
            return { ...item, ma7: +ma.toFixed(2) };
        });
    }, [chartData]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">{d.date}</p>
                <p><span style={{ color: '#818cf8' }}>●</span> Daily avg: <strong>{d.avgPrice} {currency.toUpperCase()}/MWh</strong></p>
                <p><span style={{ color: '#fbbf24' }}>●</span> 7-day MA: <strong>{d.ma7} {currency.toUpperCase()}/MWh</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>📈 Daily Average Price</h3>
            <p className="chart-subtitle">Daily average price with 7-day moving average and threshold reference line</p>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={withMA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={d => d.substring(5)}
                        interval={Math.floor(withMA.length / 12)}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={customTooltip} />
                    <ReferenceLine y={threshold} stroke="#ff5252" strokeDasharray="6 4" label={{ value: `${threshold}€`, fill: '#ff5252', fontSize: 11 }} />
                    <Line type="monotone" dataKey="avgPrice" stroke="#818cf8" strokeWidth={1} dot={false} opacity={0.6} />
                    <Line type="monotone" dataKey="ma7" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                    <Brush dataKey="date" height={25} stroke="#334155" fill="#0f172a" tickFormatter={d => d.substring(5)} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
