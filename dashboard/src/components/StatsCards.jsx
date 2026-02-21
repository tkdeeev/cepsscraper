export default function StatsCards({ summary, threshold }) {
    const cards = [
        {
            label: 'Average Price',
            value: `${summary.avgPrice ?? '—'} €`,
            icon: '📊',
            color: '#818cf8',
        },
        {
            label: 'Median Price',
            value: `${summary.medianPrice ?? '—'} €`,
            icon: '📏',
            color: '#a78bfa',
        },
        {
            label: 'Min Price',
            value: `${summary.minPrice ?? '—'} €`,
            icon: '📉',
            color: '#00e676',
        },
        {
            label: 'Max Price',
            value: `${summary.maxPrice ?? '—'} €`,
            icon: '📈',
            color: '#ff5252',
        },
        {
            label: `Hours < ${threshold}€`,
            value: summary.hoursBelowThreshold?.toLocaleString() ?? '—',
            sub: `${summary.pctBelowThreshold ?? 0}% of all hours`,
            icon: '⚡',
            color: '#00e5ff',
        },
        {
            label: 'Negative Price Hours',
            value: summary.negativeHours?.toLocaleString() ?? '—',
            sub: 'Get paid to consume!',
            icon: '💰',
            color: '#ffd740',
        },
        {
            label: 'Total Days',
            value: summary.totalDays?.toLocaleString() ?? '—',
            icon: '📅',
            color: '#94a3b8',
        },
        {
            label: 'Total Hours',
            value: summary.totalHours?.toLocaleString() ?? '—',
            icon: '🕐',
            color: '#94a3b8',
        },
    ];

    return (
        <div className="stats-grid">
            {cards.map((card, i) => (
                <div key={i} className="stat-card" style={{ borderTopColor: card.color }}>
                    <div className="stat-icon">{card.icon}</div>
                    <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                    <div className="stat-label">{card.label}</div>
                    {card.sub && <div className="stat-sub">{card.sub}</div>}
                </div>
            ))}
        </div>
    );
}
