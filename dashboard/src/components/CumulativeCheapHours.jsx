import { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts';
import { cumulativeCheapHours } from '../utils/dataLoader';

export default function CumulativeCheapHours({ data, threshold , currency}) {
    const chartData = useMemo(() => cumulativeCheapHours(data, threshold), [data, threshold]);

    const customTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="chart-tooltip">
                <p className="tooltip-date">{d.date}</p>
                <p>Cumulative hours below {threshold}€: <strong>{d.totalCheapHours.toLocaleString()}</strong></p>
            </div>
        );
    };

    return (
        <div className="chart-card">
            <h3>📊 Cumulative Cheap Hours</h3>
            <p className="chart-subtitle">Running total of hours below {threshold} {currency.toUpperCase()}/MWh — steeper slopes = more opportunity periods</p>
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="cheapGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={d => d.substring(5)}
                        interval={Math.floor(chartData.length / 12)}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={customTooltip} />
                    <Area
                        type="monotone"
                        dataKey="totalCheapHours"
                        stroke="#00e676"
                        strokeWidth={2}
                        fill="url(#cheapGrad)"
                    />
                    <Brush dataKey="date" height={25} stroke="#334155" fill="#0f172a" tickFormatter={d => d.substring(5)} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
