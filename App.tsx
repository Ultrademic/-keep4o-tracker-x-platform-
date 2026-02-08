
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Users, 
  Search, 
  Info, 
  Share2,
  RefreshCw,
  ExternalLink,
  Github,
  Twitter,
  Activity,
  History
} from 'lucide-react';
import { HashtagReport, TimePeriod, HourlyLog } from './types';
import { analyzeHashtag } from './services/geminiService';
import StatCard from './components/StatCard';
import TrendChart from './components/TrendChart';
import LiveFeed from './components/LiveFeed';

const STORAGE_KEY = 'keep4o_history_logs';

const App: React.FC = () => {
  const [report, setReport] = useState<HashtagReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.LAST_7D);
  const [error, setError] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HourlyLog[]>([]);
  const [isLive, setIsLive] = useState<boolean>(true);
  
  // Ref for polling interval
  const pollIntervalRef = useRef<number | null>(null);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistoryLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history logs");
      }
    }
  }, []);

  const updateHistory = useCallback((count: number) => {
    setHistoryLogs(prev => {
      const now = Date.now();
      const last = prev[prev.length - 1];
      
      // Log if it's the first log OR if an hour has passed since last log
      if (!last || now - last.timestamp >= 3600000) {
        const newLogs = [...prev, { timestamp: now, count }];
        // Keep only last 48 logs (2 days of hourly data)
        const trimmed = newLogs.slice(-48);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return trimmed;
      }
      return prev;
    });
  }, []);

  const fetchData = useCallback(async (selectedPeriod: TimePeriod, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const data = await analyzeHashtag(selectedPeriod);
      setReport(data);
      if (data.currentStats.totalMentions) {
        updateHistory(data.currentStats.totalMentions);
      }
    } catch (err) {
      setError("Analysis interrupted. The scraper is retrying...");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [updateHistory]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchData(period);

    // Setup real-time polling every 5 minutes (300,000 ms)
    // We simulate "continuous" by polling Gemini for latest search grounding
    if (isLive) {
      pollIntervalRef.current = window.setInterval(() => {
        fetchData(period, true);
      }, 300000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [period, fetchData, isLive]);

  const handleRefresh = () => {
    fetchData(period);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">HashtagPulse</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isLive ? 'Live Scrape Active' : 'Offline'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              {(Object.keys(TimePeriod) as Array<keyof typeof TimePeriod>).map((key) => (
                <button
                  key={key}
                  onClick={() => setPeriod(TimePeriod[key])}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    period === TimePeriod[key] 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {TimePeriod[key]}
                </button>
              ))}
            </div>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">#keep4o</h2>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">Tracking Live</span>
            </div>
            <p className="text-slate-400 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-emerald-500" />
              Continuous scraping and sentiment analysis via Google Search Grounding
            </p>
          </div>
          <div className="flex gap-3">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 font-medium">Auto-refresh in</span>
                <span className="text-sm font-mono text-blue-400">04:59</span>
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400">
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Live Total Count" 
            value={report?.currentStats.totalMentions.toLocaleString() || '---'} 
            subValue={`+${report?.currentStats.growthRate}% hourly velocity`}
            trend="up"
            icon={<Activity className="w-5 h-5" />}
          />
          <StatCard 
            label="Verified Reach" 
            value={report?.currentStats.estimatedReach || '---'} 
            icon={<Users className="w-5 h-5" />}
            trend="neutral"
          />
          <StatCard 
            label="Sentiment Index" 
            value={report?.currentStats.averageSentiment || 'Neutral'} 
            icon={<Info className="w-5 h-5" />}
            trend="up"
          />
          <StatCard 
            label="Hourly Logged" 
            value={historyLogs.length} 
            icon={<History className="w-5 h-5" />}
            trend="neutral"
          />
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
          {/* Main Visualizer */}
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">Mentions Velocity</h3>
                  <p className="text-xs text-slate-500">Volume distribution for selected {period} window</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 text-[10px] font-bold text-blue-400">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> VOLUME
                  </div>
                </div>
              </div>
              {loading && !report ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-slate-500 font-medium">Scraping social sources...</span>
                  </div>
                </div>
              ) : (
                <TrendChart data={report?.trendData || []} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Movement Summary
                  </h3>
                  {loading && !report ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-700/50 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-5/6 animate-pulse"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-4/6 animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                      "{report?.summary || 'No summary available.'}"
                    </p>
                  )}
               </div>

               <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" />
                    Hourly Log History
                  </h3>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {historyLogs.length === 0 ? (
                      <div className="text-xs text-slate-500 py-4 text-center">Waiting for first hourly log...</div>
                    ) : (
                      historyLogs.slice().reverse().map((log, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                          <span className="text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="text-xs font-bold text-blue-400">{log.count.toLocaleString()} posts</span>
                        </div>
                      ))
                    )}
                  </div>
               </div>
            </div>
          </div>

          {/* Right Sidebar: Live Feed */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl flex flex-col h-[700px]">
              <div className="p-6 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Activity className="w-5 h-5 text-blue-500" />
                   <h3 className="text-lg font-bold text-white">Live Feed</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {loading && !report ? (
                   Array(4).fill(0).map((_, i) => (
                     <div key={i} className="h-24 bg-slate-700/30 rounded-2xl animate-pulse"></div>
                   ))
                ) : report?.liveMentions ? (
                  <LiveFeed mentions={report.liveMentions} />
                ) : (
                  <div className="text-center py-12 text-slate-600 text-sm">Waiting for incoming data stream...</div>
                )}
              </div>
              <div className="p-6 border-t border-slate-700/60">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                  Open Full Stream
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Grounding */}
        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Analysis Grounding</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Sources</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report?.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 truncate">{source.title}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
              </a>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-slate-800 py-12 bg-slate-900/50">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
               <TrendingUp className="text-blue-500 w-8 h-8" />
               <span className="text-2xl font-black text-white italic">HashtagPulse</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Real-time sentiment and volume intelligence for high-velocity social movements. Powered by Google Gemini 3 Flash and Search Grounding.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer Portal</a></li>
            </ul>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
