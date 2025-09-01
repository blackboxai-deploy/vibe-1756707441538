import { NextResponse } from 'next/server';
import { Trade } from '@/types/trading';

// Mock recent trades - in a real app, this would come from a database
const mockTrades: Trade[] = [
  {
    id: 'trade_001',
    symbol: 'AAPL',
    type: 'BUY',
    quantity: 50,
    price: 174.25,
    status: 'EXECUTED',
    timestamp: Date.now() - 3600000, // 1 hour ago
    predictionId: 'pred_001',
    stopLoss: 170.25,
    takeProfit: 178.25
  },
  {
    id: 'trade_002',
    symbol: 'NVDA',
    type: 'BUY',
    quantity: 10,
    price: 888.50,
    status: 'EXECUTED',
    timestamp: Date.now() - 7200000, // 2 hours ago
    predictionId: 'pred_002',
    stopLoss: 870.00,
    takeProfit: 910.00
  },
  {
    id: 'trade_003',
    symbol: 'TSLA',
    type: 'SELL',
    quantity: 25,
    price: 245.80,
    status: 'EXECUTED',
    timestamp: Date.now() - 10800000, // 3 hours ago
    predictionId: 'pred_003',
    stopLoss: 250.00,
    takeProfit: 240.00
  },
  {
    id: 'trade_004',
    symbol: 'GOOGL',
    type: 'BUY',
    quantity: 75,
    price: 137.90,
    status: 'PENDING',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    predictionId: 'pred_004',
    stopLoss: 135.00,
    takeProfit: 142.00
  },
  {
    id: 'trade_005',
    symbol: 'AMZN',
    type: 'SELL',
    quantity: 40,
    price: 146.75,
    status: 'FAILED',
    timestamp: Date.now() - 14400000, // 4 hours ago
    predictionId: 'pred_005'
  }
];

export async function GET() {
  try {
    // Sort by timestamp (most recent first)
    const sortedTrades = mockTrades.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      trades: sortedTrades,
      total: sortedTrades.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Recent trades API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent trades' },
      { status: 500 }
    );
  }
}