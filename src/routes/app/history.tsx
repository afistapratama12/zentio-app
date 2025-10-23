import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import type { Budget } from '~/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import AppLayout from '~/components/AppLayout'
import { useAuth } from '~/hooks/use-auth'
import { useBudgetHistory } from '~/hooks/use-budget'

export const Route = createFileRoute('/app/history')({
  component: HistoryPage,
})

interface TimelineDataPoint {
  period: string
  total: number
  [key: string]: number | string
}

function HistoryPage() {
  const { user } = useAuth()
  const { data: budgetHistory = [], isLoading: loading } = useBudgetHistory(user?.id || '')
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])

  // Select last 2 periods for comparison by default
  useEffect(() => {
    if (budgetHistory.length >= 2) {
      setSelectedPeriods([budgetHistory[0].period, budgetHistory[1].period])
    } else if (budgetHistory.length === 1) {
      setSelectedPeriods([budgetHistory[0].period])
    }
  }, [budgetHistory])

  // Prepare timeline data
  const timelineData = useMemo(() => {
    return [...budgetHistory]
      .reverse()
      .map((history) => {
        const point: TimelineDataPoint = {
          period: formatPeriod(history.period),
          total: 0,
        }

        if (history.ai_generated_budget?.budget) {
          history.ai_generated_budget.budget.forEach((item: Budget) => {
            point[item.category] = item.amount
            point.total += item.amount
          })
        }

        return point
      })
  }, [budgetHistory])

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

  function calculateDifference(current: Budget[], previous: Budget[]): {
    category: string
    currentAmount: number
    previousAmount: number
    difference: number
    percentageChange: number
  }[] {
    const result: {
      category: string
      currentAmount: number
      previousAmount: number
      difference: number
      percentageChange: number
    }[] = []

    current.forEach((currItem) => {
      const prevItem = previous.find((p) => p.category === currItem.category)
      const currentAmount = currItem.amount
      const previousAmount = prevItem?.amount || 0
      const difference = currentAmount - previousAmount
      const percentageChange = previousAmount > 0 ? (difference / previousAmount) * 100 : 100

      result.push({
        category: currItem.category,
        currentAmount,
        previousAmount,
        difference,
        percentageChange,
      })
    })

    return result
  }

  function getTrendIcon(change: number) {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  function getTrendColor(change: number): string {
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const categories = useMemo(() => 
    budgetHistory.length > 0 
      ? Array.from(new Set(budgetHistory.flatMap(h => h.ai_generated_budget?.budget?.map(b => b.category) || [])))
      : [],
    [budgetHistory]
  )

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (selectedPeriods.length < 2) return []
    
    const current = budgetHistory.find(h => h.period === selectedPeriods[0])
    const previous = budgetHistory.find(h => h.period === selectedPeriods[1])
    
    if (current?.ai_generated_budget?.budget && previous?.ai_generated_budget?.budget) {
      return calculateDifference(
        current.ai_generated_budget.budget,
        previous.ai_generated_budget.budget
      )
    }
    return []
  }, [budgetHistory, selectedPeriods])

  const COLORS = [
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'
  ]

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (budgetHistory.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget History</h1>
          <p className="text-gray-600 mb-8">Track your budget evolution over time</p>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Budget History Yet</h3>
              <p className="text-gray-500 text-center">
                Start by creating your first budget in the dashboard!
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget History</h1>
          <p className="text-gray-600">Track your budget evolution and compare periods</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Budgets Created</CardDescription>
              <CardTitle className="text-3xl">{budgetHistory.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Latest Budget</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(
                  budgetHistory[0]?.ai_generated_budget?.budget?.reduce(
                    (sum, item) => sum + item.amount,
                    0
                  ) || 0
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Period Range</CardDescription>
              <CardTitle className="text-xl">
                {budgetHistory.length > 0 &&
                  `${formatPeriod(budgetHistory[budgetHistory.length - 1].period)} - ${formatPeriod(budgetHistory[0].period)}`}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Budget Evolution Timeline</CardTitle>
            <CardDescription>See how your total budget changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Total Budget"
                  dot={{ fill: '#10b981', r: 6 }}
                />
                {categories.slice(0, 5).map((category, index) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={COLORS[index]}
                    strokeWidth={2}
                    name={category}
                    dot={{ fill: COLORS[index], r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Period Comparison */}
        {comparisonData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
              <CardDescription>
                Comparing {formatPeriod(selectedPeriods[0])} vs {formatPeriod(selectedPeriods[1])}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.category}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatCurrency(item.previousAmount)} → {formatCurrency(item.currentAmount)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-right ${getTrendColor(item.difference)}`}>
                        <div className="font-semibold">
                          {item.difference > 0 ? '+' : ''}
                          {formatCurrency(item.difference)}
                        </div>
                        <div className="text-sm">
                          {item.percentageChange > 0 ? '+' : ''}
                          {item.percentageChange.toFixed(1)}%
                        </div>
                      </div>
                      {getTrendIcon(item.difference)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Comparison */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">Total Budget</div>
                    <div className="text-gray-600 mt-1">
                      {formatCurrency(comparisonData.reduce((sum, item) => sum + item.previousAmount, 0))} →{' '}
                      {formatCurrency(comparisonData.reduce((sum, item) => sum + item.currentAmount, 0))}
                    </div>
                  </div>
                  <div className={`text-right ${getTrendColor(
                    comparisonData.reduce((sum, item) => sum + item.difference, 0)
                  )}`}>
                    <div className="font-bold text-xl">
                      {comparisonData.reduce((sum, item) => sum + item.difference, 0) > 0 ? '+' : ''}
                      {formatCurrency(comparisonData.reduce((sum, item) => sum + item.difference, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Budgets List */}
        <Card>
          <CardHeader>
            <CardTitle>All Budget Records</CardTitle>
            <CardDescription>Complete history of all your budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetHistory.map((history, index) => (
                <div
                  key={history.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (selectedPeriods.includes(history.period)) {
                      setSelectedPeriods(prev => prev.filter(p => p !== history.period))
                    } else if (selectedPeriods.length < 2) {
                      setSelectedPeriods(prev => [...prev, history.period])
                    } else {
                      setSelectedPeriods([selectedPeriods[1], history.period])
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                        {formatPeriod(history.period)}
                        {index === 0 && (
                          <Badge variant="default">Latest</Badge>
                        )}
                        {selectedPeriods.includes(history.period) && (
                          <Badge variant="outline">Selected</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(history.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-emerald-600">
                        {formatCurrency(
                          history.ai_generated_budget?.budget?.reduce(
                            (sum, item) => sum + item.amount,
                            0
                          ) || 0
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Total Budget</div>
                    </div>
                  </div>

                  {history.ai_generated_budget?.explanation && (
                    <p className="text-sm text-gray-600 mb-3 italic">
                      "{history.ai_generated_budget.explanation}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {history.ai_generated_budget?.budget?.map((item) => (
                      <Badge key={item.category} variant="secondary">
                        {item.category}: {formatCurrency(item.amount)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
