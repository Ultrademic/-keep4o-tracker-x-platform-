
import React from 'react';
import { Twitter, MessageSquare } from 'lucide-react';
import { LiveMention } from '../types';

interface LiveFeedProps {
  mentions: LiveMention[];
}

const LiveFeed: React.FC<LiveFeedProps> = ({ mentions }) => {
  return (
    <div className="space-y-4">
      {mentions.map((mention) => (
        <div 
          key={mention.id} 
          className="p-4 bg-slate-900/40 border border-slate-700/50 rounded-xl hover:border-blue-500/30 transition-all group animate-in fade-in slide-in-from-right-4 duration-500"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
              <div className="bg-blue-500/20 w-full h-full flex items-center justify-center text-blue-400 font-bold uppercase text-xs">
                {mention.user.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-100 truncate">{mention.user}</span>
                  <span className="text-xs text-slate-500 truncate">@{mention.handle}</span>
                </div>
                <Twitter className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-2">
                {mention.text}
              </p>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                <span>{mention.timestamp}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> Reply</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveFeed;
