import { useMemo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { imbalancePriceVolatility } from '../utils/dataLoader';

function InfoTooltip({ text }) {
    return <span className="info-tooltip" title={text}>ⓘ</span>;
}

export default function ImbalanceChart({ imbalanceData , currency}) {
    const volatility = useMemo(() => imbalancePriceVolatility(imbalanceData), [imbalanceData]);

    const avgSpread = volatility.length
        ? +(volatility.reduce((s, r) => s + r.spread, 0) / volatility.length).toFixed(0)
        : 0;

    return (
        <div className="chart-card chart-card-full">
            <div className="chart-header">
                <h3>
                    ⚡ Grid Imbalance Settlement Prices
                    <InfoTooltip text="Imbalance Settlement = the price ČEPS charges/pays when actual consumption doesn't match predicted consumption. Wild swings show how unpredictable the grid is — and why flexible assets like E-BRIX are valuable for stabilization." />
                </h3>
                <div className="chart-explainer">
                    <p>
                        <strong>What is this?</strong> When electricity consumption doesn't match forecasts, the grid operator (ČEPS) settles
                        the difference at these prices. <strong>Volatile prices</strong> = the grid is unstable and <strong>needs flexible consumers</strong> like E-BRIX.
                    </p>
                    <p>
                        Average daily price spread: <strong>{avgSpread.toLocaleString()} {currency.toUpperCase()}/MWh</strong>{' '}
                        <span className="text-dim">(shows P2–P98 range, extreme outliers clipped)</span>
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={volatility}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => d.substring(5)} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#f1f5f9' }}
                        formatter={(v, name) => [`${v.toLocaleString()} ${currency.toUpperCase()}/MWh`, name]}
                    />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Area type="monotone" dataKey="maxPrice" name="Max (P98)" stroke="transparent" fill="rgba(239,68,68,0.15)" />
                    <Area type="monotone" dataKey="minPrice" name="Min (P2)" stroke="transparent" fill="rgba(56,189,248,0.15)" />
                    <Line type="monotone" dataKey="avgPrice" name="Daily Avg Settlement" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
                </ComposedChart>
            </ResponsiveContainer>
            <p className="chart-footnote">
                The shaded area shows the daily min-max range of imbalance prices. Wider bands = more volatile day = more opportunity for E-BRIX to earn from flexibility.
                Extreme spikes (beyond P2/P98 percentiles) are clipped for readability.
            </p>
        </div>
    );
}
