import { useMemo } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { computeSparkSpread, monthlySparkSpread, cumulativeSavings } from '../utils/dataLoader';

function InfoTooltip({ text }) {
    return <span className="info-tooltip" title={text}>ⓘ</span>;
}

export default function SparkSpreadChart({ damData, gasData, currency }) {
    const sparkDaily = useMemo(() => computeSparkSpread(damData, gasData, currency), [damData, gasData, currency]);
    const sparkMonthly = useMemo(() => monthlySparkSpread(sparkDaily), [sparkDaily]);
    const savings = useMemo(() => cumulativeSavings(sparkDaily), [sparkDaily]);

    const avgSpread = sparkDaily.length
        ? +(sparkDaily.reduce((s, r) => s + r.sparkSpread, 0) / sparkDaily.length).toFixed(2)
        : 0;
    const positiveDays = sparkDaily.filter(r => r.sparkSpread > 0).length;
    const pctPositive = sparkDaily.length ? +((positiveDays / sparkDaily.length) * 100).toFixed(1) : 0;

    return (
        <div className="chart-card chart-card-full">
            <div className="chart-header">
                <h3>
                    🔥 Spark Spread — Is E-BRIX Cheaper Than Gas?
                    <InfoTooltip text="Spark Spread compares the cost of heating with an E-BRIX unit (electricity) vs. a conventional gas boiler. E-BRIX charges its battery during the cheapest 8 hours each day, then releases heat over 24h. Gas boilers waste ~10% of fuel as exhaust heat (90% efficiency)." />
                </h3>
                <div className="chart-explainer">
                    <p>
                        <strong>How it works:</strong> E-BRIX charges during the <strong>8 cheapest electricity hours</strong> each day,
                        not at the average price. The gas cost is adjusted for <strong>90% boiler efficiency</strong> (1 MWh gas → 0.9 MWh heat).
                    </p>
                    <p>
                        <strong>Positive spread</strong> = E-BRIX heating is cheaper than gas.{' '}
                        Average daily spread: <strong className="highlight-positive">{avgSpread > 0 ? '+' : ''}{avgSpread} {currency.toUpperCase()}/MWh</strong>{' '}
                        | E-BRIX cheaper on <strong className="highlight-positive">{pctPositive}%</strong> of days ({positiveDays}/{sparkDaily.length})
                    </p>
                </div>
            </div>

            <div className="spark-grid">
                <div className="spark-chart">
                    <h4>Monthly: Gas Heat Cost vs E-BRIX Smart Charging Cost</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={sparkMonthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value, name) => [`${value} ${currency.toUpperCase()}/MWh`, name]}
                            />
                            <Legend />
                            <Bar dataKey="avgGasHeat" name="Gas Boiler Heat Cost" fill="#f97316" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="avgElecSmart" name="E-BRIX (8 cheapest hrs)" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="avgElecFull" name="Avg Electricity (all 24h)" fill="#475569" radius={[3, 3, 0, 0]} />
                            <Line type="monotone" dataKey="avgSpread" name="Spread (Gas - E-BRIX)" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                    <p className="chart-footnote">
                        Orange = gas boiler heat cost (price ÷ 0.9 efficiency). Blue = E-BRIX cost (avg of 8 cheapest hours).
                        Gray = full-day avg electricity (for reference — E-BRIX never pays this).
                    </p>
                </div>

                <div className="spark-chart">
                    <h4>Cumulative Savings: E-BRIX vs Gas ({currency.toUpperCase()}/MWh)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={savings}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => d.substring(5)} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh cumulative`, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(value) => [`${value} ${currency.toUpperCase()}/MWh`, 'Cumulative savings']}
                            />
                            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="cumulativeSavings" name="Cumulative Savings" stroke="#22c55e" strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                    <p className="chart-footnote">
                        Running total of daily (gas_heat_cost − E-BRIX_cost). Rising line = E-BRIX is saving money vs gas over time.
                    </p>
                </div>
            </div>
        </div>
    );
}
