
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, trend }) => {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-white">{value}</span>
        {subValue && (
          <span className={`text-sm mt-1 font-semibold ${trendColor}`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
