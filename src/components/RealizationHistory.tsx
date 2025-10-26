"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, TrendingDown, Eye, Trash2 } from 'lucide-react'
import { BudgetRealization } from '@/types'

interface RealizationHistoryProps {
  realizations: Array<BudgetRealization & {
    budget_sessions?: {
      budget_type: string
      start_date: string
      end_date: string
      ai_generated_budget: any
    }
  }>
  onView: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
}

export default function RealizationHistory({
  realizations,
  onView,
  onDelete,
}: RealizationHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Group realizations by session
  const sessionGroups = realizations.reduce((acc, real) => {
    if (!acc[real.session_id]) {
      acc[real.session_id] = []
    }
    acc[real.session_id].push(real)
    return acc
  }, {} as Record<string, typeof realizations>)

  const sessions = Object.entries(sessionGroups).map(([sessionId, items]) => {
    const totalPlanned = items.reduce((sum, item) => sum + item.planned_amount, 0)
    const totalIncome = items.reduce((sum, item) => sum + item.realized_income, 0)
    const totalExpense = items.reduce((sum, item) => sum + item.realized_expense, 0)
    const netSavings = totalIncome - totalExpense
    const savingsPercentage = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
    const sessionInfo = items[0].budget_sessions

    return {
      sessionId,
      items,
      totalPlanned,
      totalIncome,
      totalExpense,
      netSavings,
      savingsPercentage,
      realizationDate: items[0].realization_date,
      sessionInfo,
    }
  }).sort((a, b) => new Date(b.realizationDate).getTime() - new Date(a.realizationDate).getTime())

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Realization History
            </h3>
            <p className="text-gray-600">
              Your budget realization history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const isSaved = session.netSavings >= 0
        const performance = session.savingsPercentage >= 20 
          ? 'excellent' 
          : session.savingsPercentage >= 10 
          ? 'good' 
          : session.savingsPercentage >= 0 
          ? 'fair' 
          : 'poor'

        return (
          <Card key={session.sessionId} className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {session.sessionInfo && (
                      <Badge variant="outline">
                        {session.sessionInfo.budget_type === '1-month' && '1 Month'}
                        {session.sessionInfo.budget_type === '1-year' && '1 Year'}
                        {session.sessionInfo.budget_type === 'custom' && 'Custom'}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        performance === 'excellent' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                        performance === 'good' ? 'bg-green-100 text-green-700 border-green-300' :
                        performance === 'fair' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                        'bg-red-100 text-red-700 border-red-300'
                      }
                    >
                      {performance === 'excellent' ? '🌟 Excellent' :
                       performance === 'good' ? '✅ Good' :
                       performance === 'fair' ? '⚠️ Fair' :
                       '❌ Needs Work'}
                    </Badge>
                  </div>

                  {/* Date Info */}
                  {session.sessionInfo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(session.sessionInfo.start_date)} - {formatDate(session.sessionInfo.end_date)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>Realized on {formatDate(session.realizationDate)}</span>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Planned</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatCurrency(session.totalPlanned)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Income</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(session.totalIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expense</p>
                      <p className="text-sm font-semibold text-orange-600">
                        {formatCurrency(session.totalExpense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Savings</p>
                      <p className={`text-sm font-semibold ${isSaved ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(session.netSavings)}
                      </p>
                    </div>
                  </div>

                  {/* Savings Rate */}
                  <div className="flex items-center gap-2">
                    {isSaved ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${isSaved ? 'text-emerald-600' : 'text-red-600'}`}>
                      {session.savingsPercentage.toFixed(1)}% savings rate
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(session.sessionId)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(session.sessionId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
