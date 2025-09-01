"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Prediction, 
  Portfolio, 
  BotStatus, 
  Trade
} from "@/types/trading";
import { 
  formatCurrency, 
  formatPercent, 
  getSignalBgColor, 
  getTimeAgo,
  formatNumber
} from "@/lib/utils";

export default function TradingDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [predictionsRes, portfolioRes, statusRes, tradesRes] = await Promise.all([
        fetch('/api/predictions'),
        fetch('/api/portfolio'),
        fetch('/api/bot-status'),
        fetch('/api/trades/recent')
      ]);

      if (predictionsRes.ok) {
        const predictionsData = await predictionsRes.json();
        setPredictions(predictionsData.predictions || []);
      }

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolio(portfolioData.portfolio);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setBotStatus(statusData.status);
      }

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setRecentTrades(tradesData.trades || []);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setIsLoading(false);
    }
  };

  const toggleBot = async () => {
    try {
      const response = await fetch('/api/bot-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: botStatus?.isActive ? 'stop' : 'start'
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Trading Bot Dashboard</h1>
            <p className="text-slate-600 mt-1">AI-Powered Trading with 90% Prediction Confidence</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                botStatus?.systemHealth === 'HEALTHY' ? 'bg-green-500' : 
                botStatus?.systemHealth === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-slate-600">
                System {botStatus?.systemHealth || 'Unknown'}
              </span>
            </div>
            <Button
              onClick={toggleBot}
              variant={botStatus?.isActive ? "destructive" : "default"}
              size="sm"
            >
              {botStatus?.isActive ? 'Stop Bot' : 'Start Bot'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(portfolio?.totalValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(portfolio?.availableBalance || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (portfolio?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(portfolio?.totalPnL || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatNumber(portfolio?.winRate || 0, 1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                {predictions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No active predictions available</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => fetch('/api/predictions/generate', { method: 'POST' })}
                    >
                      Generate New Predictions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {predictions.map((prediction) => (
                      <div key={prediction.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-lg">{prediction.symbol}</span>
                            <Badge className={getSignalBgColor(prediction.direction)}>
                              {prediction.direction}
                            </Badge>
                            <Badge variant="outline">
                              {prediction.timeframe}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-600">Confidence</div>
                            <div className="text-xl font-bold text-blue-600">
                              {formatNumber(prediction.confidence, 1)}%
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-sm text-slate-600">Current Price</div>
                            <div className="font-medium">{formatCurrency(prediction.currentPrice)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600">Target Price</div>
                            <div className="font-medium">{formatCurrency(prediction.targetPrice)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-slate-600">Generated</div>
                            <div className="font-medium">{getTimeAgo(prediction.timestamp)}</div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm text-slate-600 mb-1">Confidence Level</div>
                          <Progress value={prediction.confidence} className="h-2" />
                        </div>

                        <div>
                          <div className="text-sm text-slate-600 mb-1">Reasoning</div>
                          <p className="text-sm text-slate-800">{prediction.reasoning}</p>
                        </div>

                        {prediction.indicators.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="text-sm text-slate-600 mb-2">Technical Indicators</div>
                            <div className="flex flex-wrap gap-2">
                              {prediction.indicators.map((indicator, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {indicator.name}: {indicator.signal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {!portfolio || portfolio.positions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No active positions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2">Symbol</th>
                          <th className="text-right py-2">Quantity</th>
                          <th className="text-right py-2">Avg Price</th>
                          <th className="text-right py-2">Current Price</th>
                          <th className="text-right py-2">P&L</th>
                          <th className="text-right py-2">P&L %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.positions.map((position, index) => (
                          <tr key={index} className="border-b border-slate-100">
                            <td className="py-2 font-medium">{position.symbol}</td>
                            <td className="text-right py-2">{formatNumber(position.quantity, 0)}</td>
                            <td className="text-right py-2">{formatCurrency(position.avgPrice)}</td>
                            <td className="text-right py-2">{formatCurrency(position.currentPrice)}</td>
                            <td className={`text-right py-2 font-medium ${
                              position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(position.pnl)}
                            </td>
                            <td className={`text-right py-2 font-medium ${
                              position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercent(position.pnlPercent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No recent trades</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2">Symbol</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-right py-2">Quantity</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrades.map((trade) => (
                          <tr key={trade.id} className="border-b border-slate-100">
                            <td className="py-2 font-medium">{trade.symbol}</td>
                            <td className="py-2">
                              <Badge className={getSignalBgColor(trade.type)}>
                                {trade.type}
                              </Badge>
                            </td>
                            <td className="text-right py-2">{formatNumber(trade.quantity, 0)}</td>
                            <td className="text-right py-2">{formatCurrency(trade.price)}</td>
                            <td className="py-2">
                              <Badge variant={
                                trade.status === 'EXECUTED' ? 'default' :
                                trade.status === 'PENDING' ? 'secondary' :
                                trade.status === 'FAILED' ? 'destructive' : 'outline'
                              }>
                                {trade.status}
                              </Badge>
                            </td>
                            <td className="py-2">{getTimeAgo(trade.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-slate-500">Settings configuration coming soon</p>
                    <p className="text-sm text-slate-400 mt-2">
                      Configure risk management, API keys, and trading parameters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}