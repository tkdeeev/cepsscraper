import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { negativePriceHoursByMonth } from '../utils/dataLoader';

export default function NegativePriceAnalysis({ data }) {
    const chartData = useMemo(() => negativePriceHoursByMonth(data), [data]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">{d.month}</p>
                <p><span style={{ color: '#ff5252' }}>●</span> Negative price hours: <strong>{d.negativeHours}</strong></p>
                <p><span style={{ color: '#ffd740' }}>●</span> Zero or below hours: <strong>{d.zeroOrBelowHours}</strong></p>
                <p>Total hours: {d.totalHours}</p>
                <p>% negative: <strong>{((d.negativeHours / d.totalHours) * 100).toFixed(1)}%</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>💰 Negative & Zero Price Hours</h3>
            <p className="chart-subtitle">Monthly count of hours with ≤0 EUR/MWh — peak stabilization revenue opportunities</p>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={m => m.substring(5)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={customTooltip} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Bar dataKey="zeroOrBelowHours" name="≤ 0 EUR" fill="#ffd740" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="negativeHours" name="< 0 EUR" fill="#ff5252" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
