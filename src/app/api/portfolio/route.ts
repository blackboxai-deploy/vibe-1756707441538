import { NextResponse } from 'next/server';
import { Portfolio } from '@/types/trading';

// Mock portfolio data - in a real app, this would come from a database
let mockPortfolio: Portfolio = {
  totalValue: 105420.50,
  availableBalance: 45230.75,
  positions: [
    {
      symbol: 'AAPL',
      quantity: 100,
      avgPrice: 172.50,
      currentPrice: 175.43,
      pnl: 293.00,
      pnlPercent: 1.70,
      timestamp: Date.now() - 86400000 // 1 day ago
    },
    {
      symbol: 'NVDA',
      quantity: 25,
      avgPrice: 885.20,
      currentPrice: 891.23,
      pnl: 150.75,
      pnlPercent: 0.68,
      timestamp: Date.now() - 172800000 // 2 days ago
    },
    {
      symbol: 'TSLA',
      quantity: 50,
      avgPrice: 248.90,
      currentPrice: 242.67,
      pnl: -311.50,
      pnlPercent: -2.50,
      timestamp: Date.now() - 259200000 // 3 days ago
    }
  ],
  totalPnL: 2420.50,
  dailyPnL: 187.25,
  totalTrades: 47,
  winRate: 74.5
};

export async function GET() {
  try {
    // Simulate real-time price updates
    mockPortfolio.positions.forEach(position => {
      // Add small random price movements
      const change = (Math.random() - 0.5) * 0.01; // ±0.5% change
      position.currentPrice *= (1 + change);
      
      // Recalculate P&L
      position.pnl = (position.currentPrice - position.avgPrice) * position.quantity;
      position.pnlPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
    });

    // Recalculate totals
    const positionsValue = mockPortfolio.positions.reduce((total, position) => {
      return total + (position.quantity * position.currentPrice);
    }, 0);

    mockPortfolio.totalValue = mockPortfolio.availableBalance + positionsValue;
    mockPortfolio.totalPnL = mockPortfolio.positions.reduce((total, position) => {
      return total + position.pnl;
    }, 0);

    return NextResponse.json({
      portfolio: mockPortfolio,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}