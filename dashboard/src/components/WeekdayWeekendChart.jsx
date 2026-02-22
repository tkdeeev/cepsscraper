import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { weekdayWeekendProfile } from '../utils/dataLoader';

export default function WeekdayWeekendChart({ data , currency}) {
    const chartData = useMemo(() => weekdayWeekendProfile(data), [data]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">Hour {d.hour}:00</p>
                <p><span style={{ color: '#818cf8' }}>●</span> Weekday avg: <strong>{d.weekday} {currency.toUpperCase()}/MWh</strong></p>
                <p><span style={{ color: '#22d3ee' }}>●</span> Weekend avg: <strong>{d.weekend} {currency.toUpperCase()}/MWh</strong></p>
                <p>Difference: <strong>{(d.weekday - d.weekend).toFixed(2)} {currency.toUpperCase()}/MWh</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>📅 Weekday vs Weekend Profile</h3>
            <p className="chart-subtitle">Average hourly prices — weekends are typically cheaper with more stabilization windows</p>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={customTooltip} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Bar dataKey="weekday" name="Weekday" fill="#818cf8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="weekend" name="Weekend" fill="#22d3ee" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
