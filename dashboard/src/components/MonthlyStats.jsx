import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { monthlyStats } from '../utils/dataLoader';

export default function MonthlyStats({ data , currency}) {
    const chartData = useMemo(() => monthlyStats(data), [data]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">{d.month}</p>
                <p><span style={{ color: '#818cf8' }}>●</span> Average: <strong>{d.avgPrice} {currency.toUpperCase()}/MWh</strong></p>
                <p><span style={{ color: '#00e676' }}>●</span> Min: <strong>{d.minPrice} {currency.toUpperCase()}/MWh</strong></p>
                <p><span style={{ color: '#ff5252' }}>●</span> Max: <strong>{d.maxPrice} {currency.toUpperCase()}/MWh</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>📊 Monthly Price Range</h3>
            <p className="chart-subtitle">Average, minimum, and maximum hourly price per month</p>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={m => m.substring(5)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={customTooltip} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Bar dataKey="minPrice" name="Min" fill="#00e676" opacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="avgPrice" name="Average" fill="#818cf8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="maxPrice" name="Max" fill="#ff5252" opacity={0.7} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
