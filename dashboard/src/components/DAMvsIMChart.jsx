import { useMemo } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { damVsImSpread } from '../utils/dataLoader';

function InfoTooltip({ text }) {
    return <span className="info-tooltip" title={text}>ⓘ</span>;
}

export default function DAMvsIMChart({ damData, imData , currency}) {
    const spreadData = useMemo(() => damVsImSpread(damData, imData), [damData, imData]);

    const avgSpread = spreadData.length
        ? +(spreadData.reduce((s, r) => s + r.spread, 0) / spreadData.length).toFixed(2)
        : 0;

    return (
        <div className="chart-card chart-card-full">
            <div className="chart-header">
                <h3>
                    🔄 Day-Ahead Market (DAM) vs Intraday Market (IM) Spread
                    <InfoTooltip text="DAM = Den-ahead Market (Denní trh). Electricity prices set one day before delivery. IM = Intraday Market (Vnitrodenní trh). Prices adjusted on the day of delivery based on real-time conditions. The spread shows whether real-time prices are higher or lower than forecasted." />
                </h3>
                <div className="chart-explainer">
                    <p>
                        <strong>DAM</strong> (Day-Ahead Market) = prices locked the day before.{' '}
                        <strong>IM</strong> (Intraday Market) = prices adjusted on the delivery day.{' '}
                        Positive spread = IM more expensive than DAM (real-time demand higher than expected).
                    </p>
                    <p>
                        Average DAM-IM spread: <strong>{avgSpread > 0 ? '+' : ''}{avgSpread} {currency.toUpperCase()}/MWh</strong>
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={spreadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => d.substring(5)} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#f1f5f9' }}
                        formatter={(v, name) => [`${v} ${currency.toUpperCase()}/MWh`, name]}
                    />
                    <Legend />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Line type="monotone" dataKey="damAvg" name="DAM (Day-Ahead Avg)" stroke="#38bdf8" strokeWidth={1.2} dot={false} />
                    <Line type="monotone" dataKey="imAvg" name="IM (Intraday Avg)" stroke="#fb923c" strokeWidth={1.2} dot={false} />
                    <Bar dataKey="spread" name="Spread (IM − DAM)" fill="#22c55e88" radius={[2, 2, 0, 0]} />
                </ComposedChart>
            </ResponsiveContainer>
            <p className="chart-footnote">
                Blue = DAM price set day before. Orange = real-time IM price. Green bars = the difference.
                Large spreads indicate market volatility — an opportunity for E-BRIX to arbitrage between markets.
            </p>
        </div>
    );
}
