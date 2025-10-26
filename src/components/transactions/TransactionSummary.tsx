"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react'

interface TransactionSummaryProps {
  summary: Array<{
    category: string
    totalIncome: number
    totalExpense: number
    transactionCount: number
  }>
  budgetPlan: Array<{
    category: string
    amount: number
  }>
}

export default function TransactionSummary({
  summary,
  budgetPlan,
}: TransactionSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalIncome = summary.reduce((sum, s) => sum + s.totalIncome, 0)
  const totalExpense = summary.reduce((sum, s) => sum + s.totalExpense, 0)
  const totalTransactions = summary.reduce((sum, s) => sum + s.transactionCount, 0)
  const netSavings = totalIncome - totalExpense

  // Merge budget plan with actual data
  const categoriesData = budgetPlan.map(budget => {
    const actual = summary.find(s => s.category === budget.category) || {
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: 0,
    }

    const variance = actual.totalExpense - budget.amount
    const percentage = budget.amount > 0 ? (actual.totalExpense / budget.amount) * 100 : 0

    return {
      category: budget.category,
      planned: budget.amount,
      actualIncome: actual.totalIncome,
      actualExpense: actual.totalExpense,
      variance,
      percentage,
      transactionCount: actual.transactionCount,
      status: variance > budget.amount * 0.1 
        ? 'over' 
        : variance < -budget.amount * 0.05 
        ? 'under' 
        : 'ontrack'
    }
  })

  return (
    <div className="space-y-6">
      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expense</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Savings</p>
                <p className={`text-2xl font-bold mt-1 ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(netSavings)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${netSavings >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <TrendingUp className={`w-6 h-6 ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {totalTransactions}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  tracked items
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoriesData.map((cat) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-xs text-gray-500">
                      ({cat.transactionCount} transactions)
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        cat.status === 'over'
                          ? 'bg-red-100 text-red-700'
                          : cat.status === 'under'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cat.status === 'over' ? '🔴 Over Budget' : 
                       cat.status === 'under' ? '🟢 Under Budget' : 
                       '🟡 On Track'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="font-medium">{formatCurrency(cat.actualExpense)}</span>
                      <span className="text-gray-500"> / {formatCurrency(cat.planned)}</span>
                    </div>
                    <div className={`text-xs ${cat.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {cat.variance > 0 ? '+' : ''}{formatCurrency(cat.variance)} 
                      ({cat.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
                <Progress 
                  value={Math.min(cat.percentage, 100)} 
                  className={`h-2 ${
                    cat.status === 'over' ? '[&>div]:bg-red-500' :
                    cat.status === 'under' ? '[&>div]:bg-green-500' :
                    '[&>div]:bg-blue-500'
                  }`}
                />
                {cat.actualIncome > 0 && (
                  <p className="text-xs text-gray-600">
                    Income: {formatCurrency(cat.actualIncome)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
