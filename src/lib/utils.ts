import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function calculatePnL(currentPrice: number, avgPrice: number, quantity: number): number {
  return (currentPrice - avgPrice) * quantity
}

export function calculatePnLPercent(currentPrice: number, avgPrice: number): number {
  return ((currentPrice - avgPrice) / avgPrice) * 100
}

export function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function validateConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 100
}

export function getSignalColor(signal: string): string {
  switch (signal?.toLowerCase()) {
    case 'bullish':
    case 'buy':
      return 'text-green-500'
    case 'bearish':
    case 'sell':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export function getSignalBgColor(signal: string): string {
  switch (signal?.toLowerCase()) {
    case 'bullish':
    case 'buy':
      return 'bg-green-100 text-green-800'
    case 'bearish':
    case 'sell':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
