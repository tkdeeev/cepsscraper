import { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend
} from 'recharts';
import { dailyVolatility } from '../utils/dataLoader';

export default function VolatilityChart({ data , currency}) {
    const chartData = useMemo(() => dailyVolatility(data), [data]);

    // 7-day MA of spread
    const withMA = useMemo(() => {
        return chartData.map((item, i) => {
            const start = Math.max(0, i - 6);
            const window = chartData.slice(start, i + 1);
            const maSpread = window.reduce((s, w) => s + w.spread, 0) / window.length;
            return { ...item, maSpread: +maSpread.toFixed(2) };
        });
    }, [chartData]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">{d.date}</p>
                <p><span style={{ color: '#f472b6' }}>●</span> Spread (max-min): <strong>{d.spread} {currency.toUpperCase()}/MWh</strong></p>
                <p><span style={{ color: '#a78bfa' }}>●</span> Std Dev: <strong>{d.stdDev} {currency.toUpperCase()}/MWh</strong></p>
                <p>Daily avg: {d.avg} {currency.toUpperCase()}/MWh</p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>📉 Daily Price Volatility</h3>
            <p className="chart-subtitle">High-spread days signal extreme price swings — more profit from buy-low strategies</p>
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
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Line type="monotone" dataKey="spread" name="Daily Spread" stroke="#f472b6" strokeWidth={1} dot={false} opacity={0.5} />
                    <Line type="monotone" dataKey="maSpread" name="7-day Avg Spread" stroke="#f472b6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="stdDev" name="Std Deviation" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
                    <Brush dataKey="date" height={25} stroke="#334155" fill="#0f172a" tickFormatter={d => d.substring(5)} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
