import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadCSV, filterByDateRange, computeSummary, getUniqueDates } from './utils/dataLoader';
import StatsCards from './components/StatsCards';
import ThresholdAnalysis from './components/ThresholdAnalysis';
import HourlyProfile from './components/HourlyProfile';
import DailyAverageChart from './components/DailyAverageChart';
import MonthlyStats from './components/MonthlyStats';
import NegativePriceAnalysis from './components/NegativePriceAnalysis';
import PriceHeatmap from './components/PriceHeatmap';
import WeekdayWeekendChart from './components/WeekdayWeekendChart';
import VolatilityChart from './components/VolatilityChart';
import CumulativeCheapHours from './components/CumulativeCheapHours';
import './App.css';

function App() {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [threshold, setThreshold] = useState(20);
    const [thresholdInput, setThresholdInput] = useState('20');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadCSV()
            .then(data => {
                setRawData(data);
                const dates = getUniqueDates(data);
                if (dates.length) {
                    setStartDate(dates[0]);
                    setEndDate(dates[dates.length - 1]);
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const filteredData = useMemo(
        () => filterByDateRange(rawData, startDate, endDate),
        [rawData, startDate, endDate]
    );

    const summary = useMemo(
        () => computeSummary(filteredData, threshold),
        [filteredData, threshold]
    );

    const dates = useMemo(() => getUniqueDates(rawData), [rawData]);

    const handleThresholdChange = useCallback((e) => {
        setThresholdInput(e.target.value);
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setThreshold(val);
    }, []);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <h2>Loading electricity price data...</h2>
                <p>Parsing CSV file</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loading-screen error-screen">
                <h2>❌ Failed to load data</h2>
                <p>{error}</p>
                <p className="hint">Make sure <code>ote_electricity_prices.csv</code> is in the <code>public/</code> folder</p>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-title">
                    <h1>⚡ Czech Electricity Price Dashboard</h1>
                    <p className="header-subtitle">
                        OTE-CR Day-Ahead Market Analysis • Grid Stabilization Opportunities
                    </p>
                </div>
            </header>

            {/* Controls */}
            <div className="controls-bar">
                <div className="control-group">
                    <label>📅 Date Range</label>
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={startDate}
                            min={dates[0]}
                            max={dates[dates.length - 1]}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <span className="date-separator">→</span>
                        <input
                            type="date"
                            value={endDate}
                            min={dates[0]}
                            max={dates[dates.length - 1]}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="control-group threshold-group">
                    <label>⚡ Price Threshold (EUR/MWh)</label>
                    <div className="threshold-controls">
                        <input
                            type="range"
                            min="-50"
                            max="200"
                            step="1"
                            value={threshold}
                            onChange={e => { setThreshold(Number(e.target.value)); setThresholdInput(e.target.value); }}
                            className="threshold-slider"
                        />
                        <input
                            type="number"
                            value={thresholdInput}
                            onChange={handleThresholdChange}
                            className="threshold-number"
                        />
                    </div>
                </div>
                <div className="control-group data-info">
                    <span className="data-badge">{filteredData.length.toLocaleString()} records</span>
                    <span className="data-badge">{summary.totalDays ?? 0} days</span>
                </div>
            </div>

            {/* Summary Cards */}
            <StatsCards summary={summary} threshold={threshold} />

            {/* Charts */}
            <div className="charts-container">
                <ThresholdAnalysis data={filteredData} threshold={threshold} />
                <DailyAverageChart data={filteredData} threshold={threshold} />
                <div className="chart-row-2col">
                    <HourlyProfile data={filteredData} />
                    <WeekdayWeekendChart data={filteredData} />
                </div>
                <PriceHeatmap data={filteredData} />
                <div className="chart-row-2col">
                    <MonthlyStats data={filteredData} />
                    <NegativePriceAnalysis data={filteredData} />
                </div>
                <VolatilityChart data={filteredData} />
                <CumulativeCheapHours data={filteredData} threshold={threshold} />
            </div>

            <footer className="app-footer">
                <p>Data source: <a href="https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh" target="_blank" rel="noopener">OTE-CR Day-Ahead Market</a></p>
            </footer>
        </div>
    );
}

export default App;
