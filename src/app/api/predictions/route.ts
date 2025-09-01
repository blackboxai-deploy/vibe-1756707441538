import { NextRequest, NextResponse } from 'next/server';
import { PredictionEngine } from '@/lib/prediction-engine';
import { MarketData } from '@/types/trading';

// Mock market data - in a real app, this would come from a market data provider
const mockMarketData: { [symbol: string]: MarketData } = {
  'AAPL': {
    symbol: 'AAPL',
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    volume: 45123000,
    timestamp: Date.now()
  },
  'TSLA': {
    symbol: 'TSLA',
    price: 242.67,
    change: -3.21,
    changePercent: -1.31,
    volume: 52341000,
    timestamp: Date.now()
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 891.23,
    change: 15.44,
    changePercent: 1.76,
    volume: 31245000,
    timestamp: Date.now()
  },
  'GOOGL': {
    symbol: 'GOOGL',
    price: 138.45,
    change: 0.87,
    changePercent: 0.63,
    volume: 28934000,
    timestamp: Date.now()
  },
  'AMZN': {
    symbol: 'AMZN',
    price: 145.23,
    change: -1.45,
    changePercent: -0.99,
    volume: 35621000,
    timestamp: Date.now()
  }
};

// Generate mock historical data
function generateHistoricalData(symbol: string, currentPrice: number): MarketData[] {
  const historical: MarketData[] = [];
  let price = currentPrice;
  
  for (let i = 50; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 0.02; // ±1% random change
    price = price * (1 + change);
    
    historical.push({
      symbol,
      price: price,
      change: change * price,
      changePercent: change * 100,
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      timestamp: Date.now() - (i * 3600000) // 1 hour intervals
    });
  }
  
  return historical;
}

let cachedPredictions: any[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Return cached predictions if still valid
    if (cachedPredictions.length > 0 && Date.now() - lastCacheUpdate < CACHE_DURATION) {
      return NextResponse.json({
        predictions: cachedPredictions,
        cached: true,
        timestamp: Date.now()
      });
    }

    // Generate new predictions
    const predictionEngine = new PredictionEngine();
    const predictions = [];
    
    const symbols = Object.keys(mockMarketData);
    
    for (const symbol of symbols.slice(0, 3)) { // Generate for first 3 symbols
      try {
        const marketData = mockMarketData[symbol];
        const historicalData = generateHistoricalData(symbol, marketData.price);
        
        const prediction = await predictionEngine.generatePrediction(
          symbol,
          marketData,
          historicalData,
          '1h'
        );
        
        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to generate prediction for ${symbol}:`, error);
      }
    }

    // Cache the predictions
    cachedPredictions = predictions;
    lastCacheUpdate = Date.now();

    return NextResponse.json({
      predictions,
      timestamp: Date.now(),
      cached: false
    });

  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeframe = '1h' } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const marketData = mockMarketData[symbol];
    if (!marketData) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: 404 }
      );
    }

    const predictionEngine = new PredictionEngine();
    const historicalData = generateHistoricalData(symbol, marketData.price);
    
    const prediction = await predictionEngine.generatePrediction(
      symbol,
      marketData,
      historicalData,
      timeframe
    );

    return NextResponse.json({
      prediction,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Prediction generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}