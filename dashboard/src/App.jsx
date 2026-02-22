import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadAllData, filterByDateRange, computeSummary, getUniqueDates } from './utils/dataLoader';
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
import SparkSpreadChart from './components/SparkSpreadChart';
import SVRRevenueChart from './components/SVRRevenueChart';
import ImbalanceChart from './components/ImbalanceChart';
import DAMvsIMChart from './components/DAMvsIMChart';
import YearOverYearChart from './components/YearOverYearChart';
import PeakOffpeakChart from './components/PeakOffpeakChart';
import './App.css';

const TABS = [
    { id: 'smart-charging', label: 'Smart Charging', icon: '\u26A1' },
    { id: 'spark-spread', label: 'Spark Spread', icon: '\uD83D\uDD25' },
    { id: 'svr-revenue', label: 'SVR Revenue', icon: '\uD83D\uDCC8' },
    { id: 'cross-market', label: 'Cross-Market', icon: '\uD83C\uDF10' },
];

function App() {
    const [currency, setCurrency] = useState('eur');
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [threshold, setThreshold] = useState(20);
    const [thresholdInput, setThresholdInput] = useState('20');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('smart-charging');

    useEffect(() => {
        setLoading(true);
        loadAllData(currency)
            .then(data => {
                setAllData(data);
                const dates = getUniqueDates(data.dam);
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
    }, [currency]);

    const filteredDAM = useMemo(
        () => allData ? filterByDateRange(allData.dam, startDate, endDate) : [],
        [allData, startDate, endDate]
    );

    const filteredIM = useMemo(
        () => allData ? filterByDateRange(allData.im, startDate, endDate) : [],
        [allData, startDate, endDate]
    );

    const filteredGas = useMemo(
        () => allData ? filterByDateRange(allData.gas, startDate, endDate) : [],
        [allData, startDate, endDate]
    );

    const filteredReNeg = useMemo(
        () => allData ? filterByDateRange(allData.reNeg, startDate, endDate) : [],
        [allData, startDate, endDate]
    );

    const filteredImbalances = useMemo(
        () => allData ? filterByDateRange(allData.imbalances, startDate, endDate) : [],
        [allData, startDate, endDate]
    );

    const filteredIndexes = useMemo(
        () => allData ? filterByDateRange(allData.indexes, startDate, endDate) : [],
        [allData, startDate, endDate]
    );

    const summary = useMemo(
        () => computeSummary(filteredDAM, threshold),
        [filteredDAM, threshold]
    );

    const dates = useMemo(() => allData ? getUniqueDates(allData.dam) : [], [allData]);

    const handleThresholdChange = useCallback((e) => {
        setThresholdInput(e.target.value);
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setThreshold(val);
    }, [currency]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <h2>Loading E-BRIX market data...</h2>
                <p>Parsing 7 datasets</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loading-screen error-screen">
                <h2>Failed to load data</h2>
                <p>{error}</p>
                <p className="hint">Make sure CSV files are in the <code>public/</code> folder</p>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-title">
                    <h1>E-BRIX Energy Market Dashboard</h1>
                    <p className="header-subtitle">
                        OTE-CR Market Analysis &bull; Smart Charging &bull; Grid Flexibility &bull; Spark Spread
                    </p>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="tab-nav">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Controls */}
            <div className="controls-bar">
                
                <div className="control-group">
                    <label>Currency</label>
                    <div className="toggle-buttons" style={{display: 'flex', gap: '4px'}}>
                        <button className={`tab-btn ${currency === 'eur' ? 'active' : ''}`} onClick={() => setCurrency('eur')} style={{padding: '4px 8px', fontSize: '0.8rem'}}>EUR</button>
                        <button className={`tab-btn ${currency === 'czk' ? 'active' : ''}`} onClick={() => setCurrency('czk')} style={{padding: '4px 8px', fontSize: '0.8rem'}}>CZK</button>
                    </div>
                </div>
                <div className="control-group">
                    <label>Date Range</label>
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={startDate}
                            min={dates[0]}
                            max={dates[dates.length - 1]}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <span className="date-separator">&rarr;</span>
                        <input
                            type="date"
                            value={endDate}
                            min={dates[0]}
                            max={dates[dates.length - 1]}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                {activeTab === 'smart-charging' && (
                    <div className="control-group threshold-group">
                        <label>Price Threshold ({currency.toUpperCase()}/MWh)</label>
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
                )}
                <div className="control-group data-info">
                    <span className="data-badge">{filteredDAM.length.toLocaleString()} DAM records</span>
                    <span className="data-badge">{summary.totalDays ?? 0} days</span>
                    {activeTab === 'spark-spread' && <span className="data-badge">{filteredGas.length} gas days</span>}
                    {activeTab === 'svr-revenue' && <span className="data-badge">{filteredReNeg.length} RE- records</span>}
                </div>
            </div>

            {/* === Tab: Smart Charging === */}
            {activeTab === 'smart-charging' && (
                <>
                    <StatsCards currency={currency} summary={summary} threshold={threshold} />
                    <div className="charts-container">
                        <ThresholdAnalysis currency={currency} data={filteredDAM} threshold={threshold} />
                        <DailyAverageChart currency={currency} data={filteredDAM} threshold={threshold} />
                        <div className="chart-row-2col">
                            <HourlyProfile currency={currency} data={filteredDAM} />
                            <WeekdayWeekendChart currency={currency} data={filteredDAM} />
                        </div>
                        <PriceHeatmap currency={currency} data={filteredDAM} />
                        <div className="chart-row-2col">
                            <MonthlyStats currency={currency} data={filteredDAM} />
                            <NegativePriceAnalysis currency={currency} data={filteredDAM} />
                        </div>
                        <VolatilityChart currency={currency} data={filteredDAM} />
                        <CumulativeCheapHours currency={currency} data={filteredDAM} threshold={threshold} />
                    </div>
                </>
            )}

            {/* === Tab: Spark Spread === */}
            {activeTab === 'spark-spread' && (
                <div className="charts-container">
                    <SparkSpreadChart currency={currency} damData={filteredDAM} gasData={filteredGas} />
                </div>
            )}

            {/* === Tab: SVR Revenue === */}
            {activeTab === 'svr-revenue' && (
                <div className="charts-container">
                    <SVRRevenueChart currency={currency} reNegData={filteredReNeg} />
                    <ImbalanceChart currency={currency} imbalanceData={filteredImbalances} />
                </div>
            )}

            {/* === Tab: Cross-Market === */}
            {activeTab === 'cross-market' && (
                <div className="charts-container">
                    <DAMvsIMChart currency={currency} damData={filteredDAM} imData={filteredIM} />
                    <div className="chart-row-2col">
                        <YearOverYearChart currency={currency} damData={filteredDAM} />
                        <PeakOffpeakChart currency={currency} indexData={filteredIndexes} />
                    </div>
                </div>
            )}

            <footer className="app-footer">
                <p>Data source: <a href="https://www.ote-cr.cz" target="_blank" rel="noopener">OTE-CR</a> | E-BRIX Project</p>
            </footer>
        </div>
    );
}

export default App;
