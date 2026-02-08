
export interface HashtagDataPoint {
  date: string;
  count: number;
  sentiment: number; // -1 to 1
  reach: number;
}

export interface LiveMention {
  id: string;
  user: string;
  handle: string;
  text: string;
  timestamp: string;
}

export interface HashtagReport {
  currentStats: {
    totalMentions: number;
    growthRate: number;
    averageSentiment: string;
    estimatedReach: string;
  };
  trendData: HashtagDataPoint[];
  comparisonData?: {
    label: string;
    previous: number;
    current: number;
  }[];
  summary: string;
  sources: { title: string; uri: string }[];
  liveMentions?: LiveMention[];
}

export interface HourlyLog {
  timestamp: number;
  count: number;
}

export enum TimePeriod {
  LAST_24H = '24h',
  LAST_7D = '7d',
  LAST_30D = '30d'
}
