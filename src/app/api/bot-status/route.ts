import { NextResponse } from 'next/server';
import { BotStatus } from '@/types/trading';

// Mock bot status - in a real app, this would come from the trading bot instance
let mockBotStatus: BotStatus = {
  isActive: true,
  lastUpdate: Date.now(),
  activePredictions: 3,
  pendingTrades: 1,
  systemHealth: 'HEALTHY'
};

export async function GET() {
  try {
    // Update timestamp
    mockBotStatus.lastUpdate = Date.now();
    
    // Simulate some dynamic changes
    if (Math.random() < 0.1) { // 10% chance to change status
      const healthStates: ('HEALTHY' | 'WARNING' | 'ERROR')[] = ['HEALTHY', 'WARNING', 'ERROR'];
      const weights = [0.7, 0.2, 0.1]; // 70% healthy, 20% warning, 10% error
      
      let random = Math.random();
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          mockBotStatus.systemHealth = healthStates[i];
          break;
        }
      }
      
      if (mockBotStatus.systemHealth === 'ERROR') {
        mockBotStatus.errorMessage = 'API connection timeout - retrying...';
        mockBotStatus.isActive = false;
      } else if (mockBotStatus.systemHealth === 'WARNING') {
        mockBotStatus.errorMessage = 'High market volatility detected';
      } else {
        mockBotStatus.errorMessage = undefined;
      }
    }

    return NextResponse.json({
      status: mockBotStatus,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Bot status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot status' },
      { status: 500 }
    );
  }
}