import { useMemo } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { peakVsOffpeak } from '../utils/dataLoader';

function InfoTooltip({ text }) {
    return <span className="info-tooltip" title={text}>ⓘ</span>;
}

export default function PeakOffpeakChart({ indexData, currency }) {
    const data = useMemo(() => peakVsOffpeak(indexData), [indexData]);

    const avgSpread = data.length
        ? +(data.reduce((s, r) => s + r.spread, 0) / data.length).toFixed(2)
        : 0;

    const monthMap = {};
    data.forEach(r => {
        const month = r.date.substring(0, 7);
        if (!monthMap[month]) monthMap[month] = { peak: 0, offpeak: 0, count: 0 };
        monthMap[month].peak += r.peak;
        monthMap[month].offpeak += r.offpeak;
        monthMap[month].count++;
    });
    const monthly = Object.entries(monthMap)
        .map(([month, v]) => ({
            month,
            peak: +(v.peak / v.count).toFixed(2),
            offpeak: +(v.offpeak / v.count).toFixed(2),
            spread: +((v.peak - v.offpeak) / v.count).toFixed(2),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h3>
                    🌙 Peak vs Off-Peak Prices
                    <InfoTooltip text="Peak = weekdays 8:00–20:00. Off-Peak = nights, weekends, holidays. E-BRIX charges during the absolutely cheapest hours, which can often be PEAK hours due to abundant solar energy driving prices down during the day!" />
                </h3>
                <p className="chart-description">
                    Due to solar power, summer Peak hours are often cheaper than Off-Peak! Avg peak/off-peak spread: <strong>{avgSpread} {currency.toUpperCase()}/MWh</strong>
                </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#f1f5f9' }}
                        formatter={(v) => [`${v} ${currency.toUpperCase()}/MWh`]}
                    />
                    <Legend />
                    <Bar dataKey="peak" name="Peak (Weekdays 8–20h)" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="offpeak" name="Off-Peak (Nights/Weekends)" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="spread" name="Peak − Off-Peak Spread" stroke="#fbbf24" strokeWidth={2} dot={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
