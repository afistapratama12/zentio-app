'use client'

import { useState, useMemo } from 'react'
import type { Budget } from '@/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Sparkles,
  BarChart3,
  Target,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/hooks/use-auth'
import { useBudgetHistory } from '@/hooks/use-budget'
import Link from 'next/link'

export default function History() {
  const { user } = useAuth()
  const { data: budgetHistory = [], isLoading: loading } = useBudgetHistory(user?.id || '')
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12' | 'all'>('6')

  function formatPeriod(period: string): string {
    const [year, month] = period.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') return budgetHistory
    const months = parseInt(timeRange)
    return budgetHistory.slice(0, months)
  }, [budgetHistory, timeRange])

  const timelineData = useMemo(() => {
    return [...filteredHistory]
      .reverse()
      .map((history) => ({
        period: formatPeriod(history.period),
        total: history.ai_generated_budget?.budget?.reduce((sum: number, item: Budget) => sum + item.amount, 0) || 0,
      }))
  }, [filteredHistory])

  const stats = useMemo(() => {
    if (budgetHistory.length === 0) return null

    const totals = budgetHistory.map(h => 
      h.ai_generated_budget?.budget?.reduce((sum: number, item: Budget) => sum + item.amount, 0) || 0
    )

    const average = totals.reduce((sum, val) => sum + val, 0) / totals.length
    const latest = totals[0]
    const previous = totals[1] || latest
    const change = latest - previous
    const changePercent = previous > 0 ? (change / previous) * 100 : 0

    const recentTotals = totals.slice(0, 3)
    const isIncreasing = recentTotals.length >= 2 && recentTotals[0] > recentTotals[1]
    const isDecreasing = recentTotals.length >= 2 && recentTotals[0] < recentTotals[1]

    return {
      total: budgetHistory.length,
      latest,
      previous,
      average,
      change,
      changePercent,
      trend: isIncreasing ? 'increasing' : isDecreasing ? 'decreasing' : 'stable',
    }
  }, [budgetHistory])

  const insights = useMemo(() => {
    if (!stats || budgetHistory.length < 2) return []

    const result: any[] = []

    if (stats.trend === 'increasing') {
      result.push({
        type: 'warning',
        title: 'Budget is Growing',
        description: `Your budget increased by ${formatCurrency(Math.abs(stats.change))} (${stats.changePercent.toFixed(1)}%) from last period.`,
        icon: ArrowUp,
      })
    } else if (stats.trend === 'decreasing') {
      result.push({
        type: 'success',
        title: 'Budget Optimized',
        description: `Great job! You reduced your budget by ${formatCurrency(Math.abs(stats.change))} (${Math.abs(stats.changePercent).toFixed(1)}%).`,
        icon: ArrowDown,
      })
    }

    const latestBudget = budgetHistory[0]?.ai_generated_budget?.budget || []
    const categories = latestBudget.map(b => b.category)
    
    if (categories.length >= 5) {
      result.push({
        type: 'info',
        title: 'Diverse Budget Categories',
        description: `You're tracking ${categories.length} categories for balanced financial planning.`,
        icon: Target,
      })
    }

    if (budgetHistory.length >= 6) {
      result.push({
        type: 'success',
        title: 'Consistent Tracking',
        description: `You've created ${budgetHistory.length} budgets. Consistent tracking leads to better decisions!`,
        icon: Sparkles,
      })
    }

    return result
  }, [stats, budgetHistory])

  const comparison = useMemo(() => {
    if (budgetHistory.length < 2) return null

    const current = budgetHistory[0].ai_generated_budget?.budget || []
    const previous = budgetHistory[1].ai_generated_budget?.budget || []

    const changes = current.map(currItem => {
      const prevItem = previous.find(p => p.category === currItem.category)
      const diff = currItem.amount - (prevItem?.amount || 0)
      const percent = prevItem?.amount ? (diff / prevItem.amount) * 100 : 100

      return {
        category: currItem.category,
        current: currItem.amount,
        previous: prevItem?.amount || 0,
        diff,
        percent,
      }
    })

    changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

    return {
      current: budgetHistory[0],
      previous: budgetHistory[1],
      changes: changes.slice(0, 5),
    }
  }, [budgetHistory])

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (budgetHistory.length === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget History</h1>
            <p className="text-gray-600 mb-8">Track your budget evolution and gain insights</p>

            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-20 w-20 text-gray-300 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">No History Yet</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Start creating budgets to see your financial journey
                </p>
                <Link href="/app/create-budget">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Your First Budget
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget History</h1>
            <p className="text-gray-600">Track evolution, compare periods, and gain insights</p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Total Budgets</CardDescription>
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Latest Budget</CardDescription>
                    <Calendar className="w-4 h-4 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{formatCurrency(stats.latest)}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">Average Budget</CardDescription>
                    <Target className="w-4 h-4 text-purple-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{formatCurrency(stats.average)}</CardTitle>
                </CardHeader>
              </Card>

              <Card className={`border-l-4 ${stats.change >= 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
                <CardHeader className="">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">vs Last Period</CardDescription>
                    {stats.change >= 0 ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-green-500" />}
                  </div>
                  <CardTitle className={`text-2xl font-bold ${stats.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{stats.change >= 0 ? '+' : ''}{formatCurrency(stats.change)}</p>
                </CardHeader>
              </Card>
            </div>
          )}

          {insights.length > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-blue-900">AI-Powered Insights</CardTitle>
                </div>
                <CardDescription className="text-blue-700">Personalized recommendations based on your history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {insights.map((insight, index) => {
                    const Icon = insight.icon
                    return (
                      <div key={index} className={`flex items-start gap-3 p-4 rounded-lg ${
                        insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                        insight.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          insight.type === 'success' ? 'text-green-600' :
                          insight.type === 'warning' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${
                            insight.type === 'success' ? 'text-green-900' :
                            insight.type === 'warning' ? 'text-orange-900' :
                            'text-blue-900'
                          }`}>{insight.title}</p>
                          <p className={`text-sm mt-1 ${
                            insight.type === 'success' ? 'text-green-700' :
                            insight.type === 'warning' ? 'text-orange-700' :
                            'text-blue-700'
                          }`}>{insight.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Budget Trend</CardTitle>
                  <CardDescription>See how your total budget evolves over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant={timeRange === '3' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('3')} className={timeRange === '3' ? 'bg-emerald-600' : ''}>3M</Button>
                  <Button variant={timeRange === '6' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('6')} className={timeRange === '6' ? 'bg-emerald-600' : ''}>6M</Button>
                  <Button variant={timeRange === '12' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('12')} className={timeRange === '12' ? 'bg-emerald-600' : ''}>1Y</Button>
                  <Button variant={timeRange === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('all')} className={timeRange === 'all' ? 'bg-emerald-600' : ''}>All</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} name="Total Budget" dot={{ fill: '#10b981', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {comparison && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Comparison</CardTitle>
                <CardDescription>{formatPeriod(comparison.current.period)} vs {formatPeriod(comparison.previous.period)} - Top 5 Changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparison.changes.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'
                        }`}>#{index + 1}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.category}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.previous)} → {formatCurrency(item.current)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-right ${item.diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <p className="font-bold">{item.diff >= 0 ? '+' : ''}{formatCurrency(item.diff)}</p>
                          <p className="text-sm">{item.diff >= 0 ? '+' : ''}{item.percent.toFixed(1)}%</p>
                        </div>
                        {item.diff >= 0 ? <TrendingUp className="w-5 h-5 text-red-500" /> : <TrendingDown className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Budget Timeline</CardTitle>
              <CardDescription>All your budget records in chronological order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredHistory.map((history, index) => {
                  const total = history.ai_generated_budget?.budget?.reduce((sum: number, item: Budget) => sum + item.amount, 0) || 0
                  const categories = history.ai_generated_budget?.budget || []
                  return (
                    <div key={history.id} className="group p-5 border rounded-lg hover:border-emerald-500 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-gray-900">{formatPeriod(history.period)}</h4>
                              {index === 0 && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">Latest</Badge>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Created {new Date(history.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(total)}</p>
                            <p className="text-xs text-gray-500">{categories.length} {categories.length === 1 ? 'category' : 'categories'}</p>
                          </div>
                          <Link href={`/app/create-budget?sessionId=${history.id}`}>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">View</Button>
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 6).map((item: Budget) => (
                          <Badge key={item.category} variant="outline" className="text-xs">{item.category}: {formatCurrency(item.amount)}</Badge>
                        ))}
                        {categories.length > 6 && <Badge variant="outline" className="text-xs text-gray-500">+{categories.length - 6} more</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
