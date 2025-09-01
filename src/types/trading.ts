export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface Prediction {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  timeframe: string;
  reasoning: string;
  indicators: TechnicalIndicator[];
  timestamp: number;
  expiresAt: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  weight: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  timestamp: number;
  predictionId?: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Portfolio {
  totalValue: number;
  availableBalance: number;
  positions: Position[];
  totalPnL: number;
  dailyPnL: number;
  totalTrades: number;
  winRate: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

export interface TradingSettings {
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  minConfidenceLevel: number;
  autoTradingEnabled: boolean;
  stopLossPercent: number;
  takeProfitPercent: number;
  allowedSymbols: string[];
}

export interface AnalyticsData {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  monthlyReturns: MonthlyReturn[];
  recentTrades: Trade[];
}

export interface MonthlyReturn {
  month: string;
  return: number;
  trades: number;
}

export interface BotStatus {
  isActive: boolean;
  lastUpdate: number;
  activePredictions: number;
  pendingTrades: number;
  systemHealth: 'HEALTHY' | 'WARNING' | 'ERROR';
  errorMessage?: string;
}