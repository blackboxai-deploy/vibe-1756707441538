import { Trade, Prediction, Portfolio, TradingSettings, BotStatus, Position } from '@/types/trading';
import { generateId, calculatePnL, calculatePnLPercent } from './utils';

export class TradingBot {
  private settings: TradingSettings;
  private portfolio: Portfolio;
  private status: BotStatus;
  private activeTrades: Trade[] = [];
  private tradeHistory: Trade[] = [];

  constructor(initialSettings: TradingSettings) {
    this.settings = initialSettings;
    this.portfolio = {
      totalValue: 100000, // Starting with $100k
      availableBalance: 100000,
      positions: [],
      totalPnL: 0,
      dailyPnL: 0,
      totalTrades: 0,
      winRate: 0
    };
    this.status = {
      isActive: false,
      lastUpdate: Date.now(),
      activePredictions: 0,
      pendingTrades: 0,
      systemHealth: 'HEALTHY'
    };
  }

  async evaluatePrediction(prediction: Prediction): Promise<Trade | null> {
    try {
      // Check if prediction meets minimum confidence threshold
      if (prediction.confidence < this.settings.minConfidenceLevel) {
        console.log(`Prediction ${prediction.id} confidence ${prediction.confidence}% below threshold ${this.settings.minConfidenceLevel}%`);
        return null;
      }

      // Check if auto trading is enabled
      if (!this.settings.autoTradingEnabled) {
        console.log('Auto trading disabled');
        return null;
      }

      // Check if symbol is allowed
      if (!this.settings.allowedSymbols.includes(prediction.symbol)) {
        console.log(`Symbol ${prediction.symbol} not in allowed list`);
        return null;
      }

      // Skip HOLD signals for automated trading
      if (prediction.direction === 'HOLD') {
        return null;
      }

      // Calculate position size based on risk management
      const positionSize = this.calculatePositionSize(prediction);
      
      if (positionSize <= 0) {
        console.log('Position size too small or insufficient balance');
        return null;
      }

      // Create trade order
      const trade: Trade = {
        id: generateId(),
        symbol: prediction.symbol,
        type: prediction.direction === 'BUY' ? 'BUY' : 'SELL',
        quantity: positionSize,
        price: prediction.currentPrice,
        status: 'PENDING',
        timestamp: Date.now(),
        predictionId: prediction.id,
        stopLoss: this.calculateStopLoss(prediction),
        takeProfit: this.calculateTakeProfit(prediction)
      };

      // Execute the trade
      await this.executeTrade(trade);
      
      return trade;

    } catch (error) {
      console.error('Error evaluating prediction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateSystemHealth('ERROR', `Failed to evaluate prediction: ${errorMessage}`);
      return null;
    }
  }

  private calculatePositionSize(prediction: Prediction): number {
    const riskAmount = this.portfolio.availableBalance * (this.settings.maxRiskPerTrade / 100);
    const stopLossDistance = Math.abs(prediction.currentPrice - this.calculateStopLoss(prediction));
    
    if (stopLossDistance === 0) return 0;
    
    const maxShares = Math.floor(riskAmount / stopLossDistance);
    const maxValue = this.portfolio.availableBalance * 0.1; // Max 10% of balance per trade
    const valueBasedShares = Math.floor(maxValue / prediction.currentPrice);
    
    return Math.min(maxShares, valueBasedShares);
  }

  private calculateStopLoss(prediction: Prediction): number {
    const stopLossPercent = this.settings.stopLossPercent / 100;
    
    if (prediction.direction === 'BUY') {
      return prediction.currentPrice * (1 - stopLossPercent);
    } else {
      return prediction.currentPrice * (1 + stopLossPercent);
    }
  }

  private calculateTakeProfit(prediction: Prediction): number {
    const takeProfitPercent = this.settings.takeProfitPercent / 100;
    
    if (prediction.direction === 'BUY') {
      return prediction.currentPrice * (1 + takeProfitPercent);
    } else {
      return prediction.currentPrice * (1 - takeProfitPercent);
    }
  }

  private async executeTrade(trade: Trade): Promise<void> {
    try {
      // Simulate trade execution (in real implementation, this would call exchange API)
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      // Update trade status
      trade.status = 'EXECUTED';
      trade.timestamp = Date.now();
      
      // Add to active trades
      this.activeTrades.push(trade);
      
      // Update portfolio
      this.updatePortfolioAfterTrade(trade);
      
      // Update status
      this.status.pendingTrades = this.activeTrades.filter(t => t.status === 'PENDING').length;
      this.status.lastUpdate = Date.now();
      
      console.log(`Trade executed: ${trade.type} ${trade.quantity} ${trade.symbol} at $${trade.price}`);
      
    } catch (error) {
      console.error('Failed to execute trade:', error);
      trade.status = 'FAILED';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateSystemHealth('ERROR', `Trade execution failed: ${errorMessage}`);
    }
  }

  private updatePortfolioAfterTrade(trade: Trade): void {
    if (trade.status !== 'EXECUTED') return;

    const tradeValue = trade.quantity * trade.price;
    
    // Update available balance
    if (trade.type === 'BUY') {
      this.portfolio.availableBalance -= tradeValue;
    } else {
      this.portfolio.availableBalance += tradeValue;
    }

    // Update or create position
    this.updatePosition(trade);

    // Update total trades count
    this.portfolio.totalTrades++;

    // Recalculate portfolio metrics
    this.recalculatePortfolioMetrics();
  }

  private updatePosition(trade: Trade): void {
    const existingPosition = this.portfolio.positions.find(p => p.symbol === trade.symbol);

    if (existingPosition) {
      if (trade.type === 'BUY') {
        // Add to position
        const totalValue = (existingPosition.quantity * existingPosition.avgPrice) + (trade.quantity * trade.price);
        const totalQuantity = existingPosition.quantity + trade.quantity;
        existingPosition.avgPrice = totalValue / totalQuantity;
        existingPosition.quantity = totalQuantity;
      } else {
        // Reduce position
        existingPosition.quantity -= trade.quantity;
        if (existingPosition.quantity <= 0) {
          // Remove position if fully sold
          this.portfolio.positions = this.portfolio.positions.filter(p => p.symbol !== trade.symbol);
        }
      }
    } else if (trade.type === 'BUY') {
      // Create new position
      const newPosition: Position = {
        symbol: trade.symbol,
        quantity: trade.quantity,
        avgPrice: trade.price,
        currentPrice: trade.price,
        pnl: 0,
        pnlPercent: 0,
        timestamp: trade.timestamp
      };
      this.portfolio.positions.push(newPosition);
    }
  }

  updatePositionPrices(marketPrices: { [symbol: string]: number }): void {
    this.portfolio.positions.forEach(position => {
      if (marketPrices[position.symbol]) {
        position.currentPrice = marketPrices[position.symbol];
        position.pnl = calculatePnL(position.currentPrice, position.avgPrice, position.quantity);
        position.pnlPercent = calculatePnLPercent(position.currentPrice, position.avgPrice);
      }
    });

    this.recalculatePortfolioMetrics();
  }

  private recalculatePortfolioMetrics(): void {
    // Calculate total portfolio value
    const positionsValue = this.portfolio.positions.reduce((total, position) => {
      return total + (position.quantity * position.currentPrice);
    }, 0);

    this.portfolio.totalValue = this.portfolio.availableBalance + positionsValue;

    // Calculate total P&L
    this.portfolio.totalPnL = this.portfolio.positions.reduce((total, position) => {
      return total + position.pnl;
    }, 0);

    // Calculate win rate
    const executedTrades = this.tradeHistory.filter(t => t.status === 'EXECUTED');
    if (executedTrades.length > 0) {
      const winningTrades = executedTrades.filter(trade => {
        const position = this.portfolio.positions.find(p => p.symbol === trade.symbol);
        return position && position.pnl > 0;
      });
      this.portfolio.winRate = (winningTrades.length / executedTrades.length) * 100;
    }
  }

  checkStopLossAndTakeProfit(marketPrices: { [symbol: string]: number }): Trade[] {
    const triggeredTrades: Trade[] = [];

    this.activeTrades.forEach(trade => {
      const currentPrice = marketPrices[trade.symbol];
      if (!currentPrice) return;

      let shouldTrigger = false;
      
      // Check stop loss
      if (trade.stopLoss) {
        if (trade.type === 'BUY' && currentPrice <= trade.stopLoss) {
          shouldTrigger = true;
        } else if (trade.type === 'SELL' && currentPrice >= trade.stopLoss) {
          shouldTrigger = true;
        }
      }

      // Check take profit
      if (trade.takeProfit && !shouldTrigger) {
        if (trade.type === 'BUY' && currentPrice >= trade.takeProfit) {
          shouldTrigger = true;
        } else if (trade.type === 'SELL' && currentPrice <= trade.takeProfit) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        // Create exit trade
        const exitTrade: Trade = {
          id: generateId(),
          symbol: trade.symbol,
          type: trade.type === 'BUY' ? 'SELL' : 'BUY',
          quantity: trade.quantity,
          price: currentPrice,
          status: 'EXECUTED',
          timestamp: Date.now()
        };

        triggeredTrades.push(exitTrade);
        
        // Move original trade to history
        this.tradeHistory.push(trade);
        
        // Update portfolio
        this.updatePortfolioAfterTrade(exitTrade);
      }
    });

    // Remove triggered trades from active trades
    this.activeTrades = this.activeTrades.filter(trade => 
      !triggeredTrades.some(t => t.symbol === trade.symbol)
    );

    return triggeredTrades;
  }

  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  getStatus(): BotStatus {
    return { ...this.status };
  }

  getSettings(): TradingSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<TradingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  start(): void {
    this.status.isActive = true;
    this.status.lastUpdate = Date.now();
    this.updateSystemHealth('HEALTHY');
    console.log('Trading bot started');
  }

  stop(): void {
    this.status.isActive = false;
    this.status.lastUpdate = Date.now();
    console.log('Trading bot stopped');
  }

  private updateSystemHealth(health: 'HEALTHY' | 'WARNING' | 'ERROR', message?: string): void {
    this.status.systemHealth = health;
    this.status.errorMessage = message;
    this.status.lastUpdate = Date.now();
  }

  getTradeHistory(): Trade[] {
    return [...this.tradeHistory];
  }

  getActiveTrades(): Trade[] {
    return [...this.activeTrades];
  }
}