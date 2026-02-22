import { useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart
} from 'recharts';
import { reNegativeByHour, monthlySVRRevenue } from '../utils/dataLoader';

function InfoTooltip({ text }) {
    return <span className="info-tooltip" title={text}>ⓘ</span>;
}

export default function SVRRevenueChart({ reNegData, currency }) {
    const hourlyProfile = useMemo(() => reNegativeByHour(reNegData), [reNegData]);
    const monthlyRevenue = useMemo(() => monthlySVRRevenue(reNegData), [reNegData]);

    const totalVolume = monthlyRevenue.reduce((s, r) => s + r.totalVolume, 0);
    const totalRevenue = monthlyRevenue.reduce((s, r) => s + r.revenue, 0);
    const totalNetRevenue = monthlyRevenue.reduce((s, r) => s + r.netRevenue, 0);

    return (
        <div className="chart-card chart-card-full">
            <div className="chart-header">
                <h3>
                    📈 SVR Revenue — Grid Flexibility Income (RE−)
                    <InfoTooltip text="SVR (Služby výkonové rovnováhy) = Ancillary Services for power balance. RE- (Regulační energie záporná) = Negative Regulation Energy. When the grid has EXCESS energy, the grid operator (ČEPS) pays participants like E-BRIX to consume it. This is revenue for E-BRIX." />
                </h3>
                <div className="chart-explainer">
                    <p>
                        <strong>What is RE−?</strong> When the Czech grid has <strong>too much electricity</strong> (e.g. from solar/wind),
                        the grid operator ČEPS needs someone to absorb the excess. E-BRIX can charge its battery and gets <strong>paid for it</strong>.
                    </p>
                    <p>
                        Total volume absorbed: <strong>{(totalVolume / 1000).toFixed(1)} GWh</strong> |
                        Gross revenue: <strong className="highlight-positive">{(totalRevenue / 1e6).toFixed(2)} M {currency.toUpperCase()}</strong> |
                        Net revenue (after costs): <strong className="highlight-positive">{(totalNetRevenue / 1e6).toFixed(2)} M {currency.toUpperCase()}</strong>
                    </p>
                </div>
            </div>

            <div className="spark-grid">
                <div className="spark-chart">
                    <h4>When Does Excess Energy Occur? (Total Volume by Hour)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyProfile}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                labelStyle={{ color: '#f1f5f9' }}
                                labelFormatter={h => `Hour ${h}:00`}
                                formatter={(v) => [`${v} MWh`, 'Total RE− Volume']}
                            />
                            <Bar dataKey="totalVolume" name="Total RE− Volume (MWh)" fill="#a78bfa" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <p className="chart-footnote">
                        Higher bars = more excess energy during that hour. E-BRIX should be ready to absorb during these peak flexibility windows.
                    </p>
                </div>

                <div className="spark-chart">
                    <h4>Monthly RE− Revenue & Volume</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: `${currency.toUpperCase()}/MWh`, angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                labelStyle={{ color: '#f1f5f9' }}
                                formatter={(v, name) => {
                                    if (name.includes('Volume')) return [`${v.toLocaleString()} MWh`, name];
                                    if (name.includes('Revenue')) return [`${v.toLocaleString()} ${currency.toUpperCase()}`, name];
                                    return [`${v} ${currency.toUpperCase()}/MWh`, name];
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="totalVolume" name="Volume Absorbed (MWh)" fill="#a78bfa" radius={[3, 3, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="avgPrice" name={`Avg Revenue per MWh (${currency.toUpperCase()})`} stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                    <p className="chart-footnote">
                        Purple bars = total energy E-BRIX could absorb. Green line = average payment per MWh absorbed.
                    </p>
                </div>
            </div>
        </div>
    );
}
