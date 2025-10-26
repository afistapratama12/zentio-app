"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { RealizationAnalysis as RealizationAnalysisType } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface RealizationAnalysisProps {
  analysis: RealizationAnalysisType
  aiInsight?: string
  isLoadingInsight?: boolean
  onGenerateInsight?: () => void
}

export default function RealizationAnalysis({
  analysis,
  aiInsight,
  isLoadingInsight = false,
  onGenerateInsight,
}: RealizationAnalysisProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Prepare chart data
  const barChartData = analysis.categories.map((cat) => ({
    name: cat.category.length > 15 ? cat.category.substring(0, 12) + '...' : cat.category,
    fullName: cat.category,
    Planned: cat.planned,
    Expense: cat.expense,
    Income: cat.income,
  }))

  const pieChartData = [
    { name: 'Income', value: analysis.totalIncome, fill: '#10b981' },
    { name: 'Expense', value: analysis.totalExpense, fill: '#f59e0b' },
  ]

  const savingsStatus = analysis.savingsPercentage >= 20 
    ? 'excellent' 
    : analysis.savingsPercentage >= 10 
    ? 'good' 
    : analysis.savingsPercentage >= 0 
    ? 'fair' 
    : 'poor'

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(analysis.totalIncome)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expense</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(analysis.totalExpense)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.expenseToIncomeRatio.toFixed(1)}% of income
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Savings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Savings</p>
                <p className={`text-2xl font-bold mt-1 ${analysis.netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(analysis.netSavings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.savingsPercentage.toFixed(1)}% savings rate
                </p>
              </div>
              <div className={`p-3 rounded-full ${analysis.netSavings >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <PiggyBank className={`w-6 h-6 ${analysis.netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <Badge 
                  className={`mt-2 ${
                    savingsStatus === 'excellent' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                    savingsStatus === 'good' ? 'bg-green-100 text-green-700 border-green-300' :
                    savingsStatus === 'fair' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    'bg-red-100 text-red-700 border-red-300'
                  }`}
                  variant="outline"
                >
                  {savingsStatus === 'excellent' ? '🌟 Excellent' :
                   savingsStatus === 'good' ? '✅ Good' :
                   savingsStatus === 'fair' ? '⚠️ Fair' :
                   '❌ Needs Improvement'}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">
                  {analysis.categories.filter(c => c.status === 'saved').length} categories saved
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                savingsStatus === 'excellent' || savingsStatus === 'good' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  savingsStatus === 'excellent' || savingsStatus === 'good' ? 'text-green-600' : 'text-yellow-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Planned vs Actual Expense by Category</CardTitle>
            <CardDescription>
              Compare your budget plan with actual spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullName
                    }
                    return label
                  }}
                />
                <Legend />
                <Bar dataKey="Planned" fill="#3b82f6" name="Planned" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Expense" fill="#f59e0b" name="Actual Expense" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income vs Expense Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense</CardTitle>
            <CardDescription>
              Overall distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expense Ratio:</span>
                <span className="font-semibold">{analysis.expenseToIncomeRatio.toFixed(1)}%</span>
              </div>
              <Progress value={analysis.expenseToIncomeRatio} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance Details</CardTitle>
          <CardDescription>
            Individual category analysis with variance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.categories.map((cat) => {
              const isOver = cat.status === 'overspent'
              const isSaved = cat.status === 'saved'
              const progressValue = cat.planned > 0 ? (cat.expense / cat.planned) * 100 : 0

              return (
                <div key={cat.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat.category}</span>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          isOver ? 'bg-red-50 text-red-700 border-red-200' :
                          isSaved ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {isOver ? '🔴 Over' : isSaved ? '🟢 Saved' : '🟡 On Track'}
                      </Badge>
                    </div>
                    <div className="text-sm text-right">
                      <div className="font-medium">
                        {formatCurrency(cat.expense)} / {formatCurrency(cat.planned)}
                      </div>
                      <div className={`text-xs ${cat.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {cat.variance > 0 ? '+' : ''}{formatCurrency(cat.variance)} ({cat.variancePercentage > 0 ? '+' : ''}{cat.variancePercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(progressValue, 100)} 
                    className={`h-2 ${
                      isOver ? '[&>div]:bg-red-500' :
                      isSaved ? '[&>div]:bg-green-500' :
                      '[&>div]:bg-blue-500'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Insight */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Financial Insights
              </CardTitle>
              <CardDescription>
                Personalized analysis and recommendations for your budget
              </CardDescription>
            </div>
            {!aiInsight && onGenerateInsight && (
              <Button 
                onClick={onGenerateInsight}
                disabled={isLoadingInsight}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                {isLoadingInsight ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Insight
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInsight ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
              <p className="text-sm text-gray-600">Analyzing your budget performance...</p>
            </div>
          ) : aiInsight ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {aiInsight}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Get personalized AI insights about your budget performance
              </p>
              {onGenerateInsight && (
                <Button 
                  onClick={onGenerateInsight}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Insight
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
