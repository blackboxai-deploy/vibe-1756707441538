import { Prediction, TechnicalIndicator, MarketData } from '@/types/trading';
import { generateId } from './utils';

export class PredictionEngine {
  private readonly apiEndpoint = 'https://oi-server.onrender.com/chat/completions';
  private readonly headers = {
    'customerId': 'cus_SyNW8U6IgSpBIQ',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer xxx'
  };

  async generatePrediction(
    symbol: string,
    marketData: MarketData,
    historicalData: MarketData[],
    timeframe: string = '1h'
  ): Promise<Prediction> {
    try {
      const technicalIndicators = this.calculateTechnicalIndicators(historicalData);
      const prompt = this.buildAnalysisPrompt(symbol, marketData, technicalIndicators, timeframe);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: 'openrouter/anthropic/claude-sonnet-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert trading analyst with 95% accuracy. Analyze market data and provide trading predictions with confidence levels. Always aim for 90%+ confidence predictions. 

              Respond with a JSON object containing:
              {
                "direction": "BUY" | "SELL" | "HOLD",
                "confidence": number (0-100),
                "targetPrice": number,
                "reasoning": "detailed analysis",
                "riskLevel": "LOW" | "MEDIUM" | "HIGH"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const aiAnalysis = JSON.parse(result.choices[0].message.content);

      // Enhance confidence if technical indicators align
      const enhancedConfidence = this.enhanceConfidenceWithTechnicals(
        aiAnalysis.confidence,
        aiAnalysis.direction,
        technicalIndicators
      );

      return {
        id: generateId(),
        symbol,
        direction: aiAnalysis.direction,
        confidence: enhancedConfidence,
        targetPrice: aiAnalysis.targetPrice,
        currentPrice: marketData.price,
        timeframe,
        reasoning: aiAnalysis.reasoning,
        indicators: technicalIndicators,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.getTimeframeMs(timeframe)
      };

    } catch (error) {
      console.error('Prediction generation failed:', error);
      
      // Fallback to technical analysis only
      return this.generateFallbackPrediction(symbol, marketData, [], timeframe);
    }
  }

  private calculateTechnicalIndicators(data: MarketData[]): TechnicalIndicator[] {
    if (data.length < 20) {
      return [];
    }

    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume);

    return [
      this.calculateRSI(prices),
      this.calculateMACD(prices),
      this.calculateMovingAverages(prices),
      this.calculateBollingerBands(prices),
      this.calculateVolumeIndicator(volumes)
    ];
  }

  private calculateRSI(prices: number[], period: number = 14): TechnicalIndicator {
    if (prices.length < period + 1) {
      return { name: 'RSI', value: 50, signal: 'NEUTRAL', weight: 0.8 };
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (rsi > 70) signal = 'BEARISH'; // Overbought
    else if (rsi < 30) signal = 'BULLISH'; // Oversold

    return {
      name: 'RSI',
      value: rsi,
      signal,
      weight: 0.8
    };
  }

  private calculateMACD(prices: number[]): TechnicalIndicator {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (macd > 0) signal = 'BULLISH';
    else if (macd < 0) signal = 'BEARISH';

    return {
      name: 'MACD',
      value: macd,
      signal,
      weight: 0.9
    };
  }

  private calculateMovingAverages(prices: number[]): TechnicalIndicator {
    const currentPrice = prices[prices.length - 1];
    const ma20 = this.calculateSMA(prices, 20);
    const ma50 = this.calculateSMA(prices, 50);

    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    
    if (currentPrice > ma20 && ma20 > ma50) {
      signal = 'BULLISH';
    } else if (currentPrice < ma20 && ma20 < ma50) {
      signal = 'BEARISH';
    }

    return {
      name: 'Moving Averages',
      value: (currentPrice / ma20 - 1) * 100,
      signal,
      weight: 0.7
    };
  }

  private calculateBollingerBands(prices: number[]): TechnicalIndicator {
    const period = 20;
    const sma = this.calculateSMA(prices, period);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate standard deviation
    const squared = prices.slice(-period).map(price => Math.pow(price - sma, 2));
    const stdDev = Math.sqrt(squared.reduce((a, b) => a + b, 0) / period);
    
    const upperBand = sma + (2 * stdDev);
    const lowerBand = sma - (2 * stdDev);
    
    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (currentPrice <= lowerBand) signal = 'BULLISH'; // Oversold
    else if (currentPrice >= upperBand) signal = 'BEARISH'; // Overbought

    const position = (currentPrice - lowerBand) / (upperBand - lowerBand);

    return {
      name: 'Bollinger Bands',
      value: position * 100,
      signal,
      weight: 0.6
    };
  }

  private calculateVolumeIndicator(volumes: number[]): TechnicalIndicator {
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;

    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (volumeRatio > 1.5) signal = 'BULLISH'; // High volume
    else if (volumeRatio < 0.5) signal = 'BEARISH'; // Low volume

    return {
      name: 'Volume',
      value: volumeRatio,
      signal,
      weight: 0.5
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateSMA(prices: number[], period: number): number {
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private enhanceConfidenceWithTechnicals(
    baseConfidence: number,
    direction: string,
    indicators: TechnicalIndicator[]
  ): number {
    let alignedWeight = 0;
    let totalWeight = 0;

    indicators.forEach(indicator => {
      totalWeight += indicator.weight;
      
      const isAligned = (
        (direction === 'BUY' && indicator.signal === 'BULLISH') ||
        (direction === 'SELL' && indicator.signal === 'BEARISH') ||
        (direction === 'HOLD' && indicator.signal === 'NEUTRAL')
      );

      if (isAligned) {
        alignedWeight += indicator.weight;
      }
    });

    const alignmentRatio = totalWeight > 0 ? alignedWeight / totalWeight : 0.5;
    const enhancedConfidence = Math.min(100, baseConfidence * (0.7 + 0.3 * alignmentRatio));

    return Math.round(enhancedConfidence * 100) / 100;
  }

  private buildAnalysisPrompt(
    symbol: string,
    marketData: MarketData,
    indicators: TechnicalIndicator[],
    timeframe: string
  ): string {
    return `Analyze ${symbol} for ${timeframe} trading prediction:

Current Price: $${marketData.price}
Price Change: ${marketData.changePercent}%
Volume: ${marketData.volume}

Technical Indicators:
${indicators.map(ind => `- ${ind.name}: ${ind.value.toFixed(2)} (${ind.signal})`).join('\n')}

Provide a high-confidence prediction (aim for 90%+) with detailed reasoning. Consider:
1. Technical indicator alignment
2. Price action and momentum
3. Volume analysis
4. Market context and trends
5. Risk assessment

Focus on predictions with strong technical confirmation and clear directional bias.`;
  }

  private generateFallbackPrediction(
    symbol: string,
    marketData: MarketData,
    indicators: TechnicalIndicator[],
    timeframe: string
  ): Prediction {
    // Simple fallback based on technical indicators
    const bullishSignals = indicators.filter(i => i.signal === 'BULLISH');
    const bearishSignals = indicators.filter(i => i.signal === 'BEARISH');

    let direction: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 60;

    if (bullishSignals.length > bearishSignals.length) {
      direction = 'BUY';
      confidence = 70 + (bullishSignals.length * 5);
    } else if (bearishSignals.length > bullishSignals.length) {
      direction = 'SELL';
      confidence = 70 + (bearishSignals.length * 5);
    }

    const targetPrice = direction === 'BUY' 
      ? marketData.price * 1.02 
      : direction === 'SELL' 
        ? marketData.price * 0.98 
        : marketData.price;

    return {
      id: generateId(),
      symbol,
      direction,
      confidence: Math.min(confidence, 90),
      targetPrice,
      currentPrice: marketData.price,
      timeframe,
      reasoning: `Technical analysis fallback: ${bullishSignals.length} bullish vs ${bearishSignals.length} bearish signals`,
      indicators,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.getTimeframeMs(timeframe)
    };
  }

  private getTimeframeMs(timeframe: string): number {
    const timeframeMap: { [key: string]: number } = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    };
    
    return timeframeMap[timeframe] || 3600000; // Default to 1 hour
  }
}