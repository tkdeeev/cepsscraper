import { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { yearOverYearComparison } from '../utils/dataLoader';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_COLORS = {
    '2024': '#38bdf8',
    '2025': '#a78bfa',
    '2026': '#22c55e',
};

function InfoTooltip({ text }) {
    return <span className="info-tooltip" title={text}>ⓘ</span>;
}

export default function YearOverYearChart({ damData , currency}) {
    const yoyData = useMemo(() => yearOverYearComparison(damData), [damData]);

    const years = [...new Set(yoyData.map(r => r.year))].sort();
    const pivoted = MONTH_NAMES.map((name, i) => {
        const monthNum = i + 1;
        const row = { month: name, monthNum };
        years.forEach(year => {
            const entry = yoyData.find(r => r.year === year && r.month === monthNum);
            row[year] = entry ? entry.avgPrice : null;
        });
        return row;
    });

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h3>
                    📅 Year-over-Year Price Trend
                    <InfoTooltip text="Compares monthly average DAM (Day-Ahead Market) electricity prices across different years. Helps identify long-term price trends and seasonal patterns." />
                </h3>
                <p className="chart-description">
                    Monthly average spot electricity prices by year — are prices trending down?
                </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pivoted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#f1f5f9' }}
                        formatter={(v) => v != null ? [`${v} ${currency.toUpperCase()}/MWh`] : ['—']}
                    />
                    <Legend />
                    {years.map(year => (
                        <Line
                            key={year}
                            type="monotone"
                            dataKey={year}
                            name={year}
                            stroke={YEAR_COLORS[year] || '#94a3b8'}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
