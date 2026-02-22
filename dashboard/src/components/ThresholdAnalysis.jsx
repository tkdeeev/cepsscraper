import { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush
} from 'recharts';
import { hoursPerDayBelowThreshold } from '../utils/dataLoader';

const COLORS = { line: '#00e5ff', ref: '#ff5252', area: 'rgba(0,229,255,0.1)' };

export default function ThresholdAnalysis({ data, threshold , currency}) {
    const chartData = useMemo(() => hoursPerDayBelowThreshold(data, threshold), [data, threshold]);

    // Moving average (7-day)
    const withMA = useMemo(() => {
        return chartData.map((item, i) => {
            const start = Math.max(0, i - 6);
            const window = chartData.slice(start, i + 1);
            const ma = window.reduce((s, w) => s + w.count, 0) / window.length;
            return { ...item, ma7: +ma.toFixed(1) };
        });
    }, [chartData]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">{d.date}</p>
                <p><span style={{ color: COLORS.line }}>●</span> Hours below {threshold} €: <strong>{d.count}</strong> / {d.totalHours}</p>
                <p><span style={{ color: '#ffd740' }}>●</span> 7-day avg: <strong>{d.ma7}</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>⚡ Hours Below {threshold} {currency.toUpperCase()}/MWh Per Day</h3>
            <p className="chart-subtitle">Shows daily count of hours where price is below your threshold — higher = more opportunity</p>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={withMA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={d => d.substring(5)}
                        interval={Math.floor(withMA.length / 12)}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 24]} />
                    <Tooltip content={customTooltip} />
                    <Line type="monotone" dataKey="count" stroke={COLORS.line} strokeWidth={1.5} dot={false} name="Hours" />
                    <Line type="monotone" dataKey="ma7" stroke="#ffd740" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="7-day avg" />
                    <Brush
                        dataKey="date"
                        height={25}
                        stroke="#334155"
                        fill="#0f172a"
                        tickFormatter={d => d.substring(5)}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
